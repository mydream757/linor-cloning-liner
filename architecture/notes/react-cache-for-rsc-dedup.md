# React.cache가 RSC 중복 쿼리를 제거하는 원리

ADR-0007에서 채택한 "`React.cache`로 래핑된 쿼리 유틸" 패턴의 **원리**. ADR은 결정과 대안 비교에 집중하고, 이 문서는 *"왜 작동하는가 / 언제 작동하지 않는가"*의 세부를 담는다.

## 문제

Next.js App Router에서 layout과 하위 page는 **하나의 React render 안에서 순차 평가**된다. 둘 다 Server Component이고 각자 데이터를 async 함수로 가져온다. 같은 Project를 layout과 page가 각각 쿼리하면 동일 요청인데도 DB 왕복이 2회다. 합성 깊이가 깊어질수록 누적된다.

Pages Router 시대라면 `getServerSideProps` 하나에서 모든 데이터를 모아 props로 내려주면 됐다. App Router는 이 "단일 진입점"이 사라졌다. 그래서 중복 제거를 프레임워크 수준에서 해결할 메커니즘이 필요하다. 그게 `React.cache`다.

## React.cache의 동작

```ts
import { cache } from 'react'

const getProject = cache(async (projectId: string) => {
  return prisma.project.findUniqueOrThrow({ where: { id: projectId } })
})
```

`cache(fn)`은 새로운 함수를 반환한다. 그 함수는 호출될 때:

1. 현재 **React 렌더 컨텍스트**를 식별
2. 그 컨텍스트 내부에서 `fn`과 arguments를 키로 조회
3. 키가 이미 있으면 **저장된 Promise**를 그대로 반환 (재실행 없음)
4. 키가 없으면 `fn(...args)`를 실행하고 결과 Promise를 키에 저장

핵심은 **"현재 렌더 컨텍스트"의 의미**다. React RSC 환경에서 한 번의 요청은 한 번의 렌더고, 렌더가 끝나면 그 컨텍스트는 폐기된다. 즉 **요청 단위 메모이제이션**이다. 런타임 전역 캐시가 아니다.

### 왜 layout-page에서 효과적인가

Next.js가 `/p/[projectId]/liner` 같은 경로를 처리할 때:

```
render tree:
  RootLayout
    └─ ProjectLayout ([projectId])
         └─ LinerPage
```

이 세 컴포넌트는 **같은 React 렌더 안에서 순차 평가**된다. `ProjectLayout`이 `getProject('abc')`를 호출해 DB에서 가져오고 Promise가 캐시에 저장된다. 그 다음 `LinerPage`가 또 `getProject('abc')`를 호출하면 **첫 Promise가 그대로 반환**된다. 이미 resolved 상태라면 즉시 값을 얻는다.

효과:
- DB 왕복 1회
- arguments가 동일 (`'abc'` === `'abc'`)하면 매칭
- layout과 page는 `getProject`를 "자기 자신이 호출하는 유틸"로 인식할 뿐, 상대가 존재하는지 알 필요가 없다

### 왜 요청 간에는 작동하지 않는가

React.cache의 캐시는 render 종료 시점에 폐기된다. 다음 요청은 새 render이고 새 캐시다. 이는 **의도적 설계**다:

- 요청 간 데이터 공유가 원하는 동작이면 개발자가 명시적으로 `unstable_cache`, 외부 Redis, HTTP 캐시 등을 써야 함
- 요청 간 상태 누수(stale 데이터, 사용자 A의 데이터가 사용자 B에게 노출)를 원천 차단
- 각 요청이 독립적으로 정확한 데이터를 가져가도록 보장

## 언제 사용하면 안 되는가

### 1. 요청 간 공유가 필요할 때
공개 페이지 콘텐츠 같은 "사용자와 무관한 정적 데이터"는 React.cache가 아니라 Next.js의 fetch 캐시(`fetch(url, { next: { revalidate: N } })`)나 `unstable_cache`가 적합.

### 2. 객체 인자로 조회할 때
```ts
const getThing = cache(async (filters: { userId: string; limit: number }) => { ... })

// 각 호출마다 새 객체 리터럴을 넘기면 참조가 달라 캐시 miss
getThing({ userId: 'u1', limit: 10 })
getThing({ userId: 'u1', limit: 10 })  // ← 또 DB 왕복
```

해결책: 원시 타입 인자로 분해 (`getThing(userId, limit)`) 또는 호출부에서 안정 객체 참조를 유지. 실제로 Prisma findMany 같은 복잡 조회를 cache로 감쌀 때 이 함정에 빠지기 쉽다.

### 3. mutation 직후 즉시 재조회할 때
Server Action이 Project를 수정한 뒤, 같은 요청 사이클이 계속 이어진다면 `getProject`가 **이전 값을 캐시에서 반환**할 수 있다. RSC에서 mutation은 보통 Server Action → `revalidatePath` → 새 요청으로 이어지므로 실제로는 다른 render에서 평가돼 문제가 안 되지만, **같은 Server Action 안에서 mutation 전후 상태를 모두 읽어야 한다면** React.cache 대신 직접 `prisma.project.findUnique` 두 번 호출이 맞다.

### 4. 비-결정적 함수
랜덤·타임스탬프·외부 상태에 의존하는 함수에 cache를 감싸면 첫 호출의 결과가 고정된다. DB 조회는 "요청 시점의 스냅샷"이라는 의미에서 결정적(같은 요청 내에서는)이므로 OK.

## 호출 시그니처 설계 팁

- **인자는 원시 타입(string, number)**만 받도록 설계. ID 기반 조회가 최적.
- 이름은 `getX` / `listX` 형태로 서버 전용 조회임을 암시.
- 반환은 그대로 엔티티 (`Project`, `User` 등). UI 포맷팅은 상위에서.
- Not-found는 `findUniqueOrThrow` + 호출부 `try/catch` → `notFound()`. 또는 `findUnique` + `null` 체크 + `notFound()`. 후자가 더 명시적.

## Next.js 16 특이사항

- React 19 기반이므로 `react` 패키지에서 `cache`를 import. `import { cache } from 'react'` 한 줄.
- `cache`는 Server Component·Route Handler·Server Action 어디서나 사용 가능. 클라이언트 컴포넌트에서 사용하면 각 호출마다 새로 실행되어 dedupe 효과 없음 (`useMemo`로 대체).
- `next/cache`의 `unstable_cache`와 혼동 금지. `unstable_cache`는 요청 **간** 캐시, `React.cache`는 요청 **내** 캐시.

## 참고

- [ADR-0007: Layout·page 공유 서버 쿼리를 React.cache로 중복 제거](../decisions/0007-react-cache-for-layout-page-shared-queries.md)
- `develop/lib/queries/project.ts` (구현 파일, D2에서 생성)
- React 공식: `cache` API
