# Next.js에서 Prisma Client 싱글톤이 필요한 이유

이 메모는 ADR-0005의 "왜 Prisma Client를 싱글톤으로 두는가"를 원리 레벨에서 기록한다. ADR은 *"우리가 이걸 채택했다"*이고, 이 문서는 *"그게 왜 필요한지"*를 설명한다.

## 문제

Prisma 공식 문서에는 다음과 같은 경고가 있다:

> In development, Next.js Fast Refresh may reload your server code, causing a new `PrismaClient` to be instantiated each time.

Next.js dev 서버(`pnpm dev`)는 **HMR(Hot Module Replacement)** 로 소스 파일이 저장될 때마다 해당 모듈을 다시 import한다. 만약 DB 접근 코드가 아래처럼 생겼다면:

```ts
// app/actions/project.ts (❌ 나쁜 예)
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createProject(name: string) {
  return prisma.project.create({ data: { name } })
}
```

이 파일을 한 번 저장할 때마다 **새로운 `PrismaClient` 인스턴스가 생성**된다. 각 인스턴스는 PostgreSQL에 자기 자신의 **연결 풀(기본 10개 커넥션)** 을 연다.

결과:
- 30~50번의 코드 저장이면 수백 개 커넥션이 PostgreSQL에 쌓인다
- PostgreSQL의 `max_connections`(기본 100) 한계에 금방 도달
- 개발 중 "too many connections" 에러 발생
- 콘솔에는 `PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in "Node.js").` 경고가 쌓이거나, warn 로그 도배

## 해결책

**`globalThis`에 client를 1번만 생성하고 캐싱**한다. HMR은 모듈의 top-level 코드를 다시 실행하지만, `globalThis`는 Node.js 프로세스 전체에서 공유되는 객체라 HMR 경계 바깥에 있다.

```ts
// lib/prisma.ts (✅ 권장)
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 각 줄의 의미

1. `globalThis as unknown as { prisma?: PrismaClient }` — TypeScript에 "`globalThis`에 `prisma`라는 프로퍼티가 있을 수도 있다"고 알려주는 타입 단언. `as unknown as`를 거치는 이유는 `globalThis`의 타입이 엄격해서 직접 확장이 막혀있기 때문.
2. `globalForPrisma.prisma ?? new PrismaClient()` — 이미 있으면 재사용, 없으면 새로 생성.
3. `if (process.env.NODE_ENV !== 'production')` — 프로덕션에서는 HMR이 없으므로 `globalThis`에 매달아둘 필요가 없다. 프로덕션은 서버가 1번 시작되고 끝날 때까지 같은 모듈 인스턴스를 쓴다.

## 왜 프로덕션에서는 캐싱하지 않는가

프로덕션 Node.js 서버는:
- 서버 시작 시 모듈을 한 번 평가
- 요청 처리 중 같은 module instance 사용
- 재시작은 전체 프로세스 교체

따라서 module-level `new PrismaClient()`가 한 번만 실행되고 그 인스턴스가 프로세스 종료까지 유지된다. `globalThis`에 매달아둘 이유가 없고, 매달지 않아야 이상한 상태 의존이 생기지 않는다.

## 왜 "그냥 DI 컨테이너 쓰면 되지"가 아닌가

이 패턴이 매우 `Next.js` 특유의 해결책처럼 보이지만, 본질은 **"HMR 환경에서 long-lived 리소스를 어떻게 유지하는가"** 이다. 같은 문제가 DB 외에 Redis client, worker pool, external API client에도 적용된다. DI 컨테이너(tsyringe 등)를 들이면 이 문제의 한 해결책이 되지만, **DI 컨테이너 자체도 module 단위로 import**되어 HMR 문제를 그대로 물려받는다. 결국 DI 컨테이너를 `globalThis`에 매다는 한 번 더 감싸는 꼴이 된다. 이 프로젝트 규모에서는 불필요한 추가 층.

## 관련 주의점

- **엣지 런타임에서 주의**: Next.js의 Edge Runtime에서는 `globalThis`가 요청 단위로 격리될 수 있다 (런타임에 따라 다름). Prisma Client는 기본적으로 Node.js 런타임 전용이라 Server Components/Actions에서 `"use node"` 런타임 보장이 필요할 수 있다. 이 프로젝트의 DB 접근은 전부 Server Action·Route Handler에서 일어나고, 기본이 Node.js 런타임이라 특별한 설정 불요.
- **여러 DB 연결이 필요해지면**: `globalForPrisma.prisma`를 배열·맵으로 확장. 지금은 단일 DB.
- **테스트 시 격리**: 싱글톤은 테스트에서 mock 삽입이 약간 번거롭다. 통합 테스트 기준으로는 실제 DB를 써서 검증하는 패턴이 더 신뢰할 수 있다.

## 참고

- 공식 가이드: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
- [ADR-0005: Prisma 파일 위치와 Client 싱글톤 패턴](../decisions/0005-prisma-infrastructure.md)
