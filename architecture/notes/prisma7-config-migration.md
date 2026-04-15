# Prisma 7의 세 가지 브레이킹 체인지 (기록)

기능 1의 D1(Prisma 스키마 + 마이그레이션 + 시드) 착수 시, 훈련 데이터(~Prisma 6) 기준으로 코드를 작성한 뒤 `pnpm prisma migrate dev`를 실행하자 세 번의 실패가 연속으로 발생했다. 각 실패 지점과 원인·해결을 기록한다. 후속 작업(Prisma 관련 코드 변경, 다른 역할 소유 마이그레이션)에서 같은 함정을 재방문하지 않기 위함이다.

## 배경

- **프로젝트**: linor-cloning-liner
- **Prisma 버전**: 7.7.0 (CLI, Client, adapter-pg 모두)
- **Node 버전**: v24.3.0
- **DB**: PostgreSQL 16 (docker-compose)
- **Next.js**: 16.2.3 (App Router)

## 브레이킹 체인지 1: schema의 `datasource.url`이 제거됨

### 증상

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

에 대해 `pnpm prisma migrate dev --name init` 실행 시:

```
Error code: P1012
error: The datasource property `url` is no longer supported in schema files.
Move connection URLs for Migrate to `prisma.config.ts` ...
```

### 원인

Prisma 7부터 schema 파일에 **연결 정보를 두지 않는다**. `datasource` 블록은 `provider`만 유지하고, `url`은 새로 도입된 `prisma.config.ts`의 `datasource.url`로 이동한다.

### 해결

1. schema에서 `url = env("DATABASE_URL")` 줄 제거.
2. 프로젝트 루트(`develop/`)에 `prisma.config.ts` 생성:
   ```ts
   import { defineConfig, env } from 'prisma/config'

   export default defineConfig({
     schema: 'prisma/schema.prisma',
     datasource: {
       url: env('DATABASE_URL'),
     },
     migrations: {
       seed: 'tsx prisma/seed.ts',
     },
   })
   ```

`defineConfig`·`env`는 `prisma/config` 서브패스에서 export된다 (이는 `@prisma/config` 내부 재수출).

## 브레이킹 체인지 2: `prisma.config.ts`는 `.env`를 자동 로드하지 않음

### 증상

1번을 해결하고 다시 `pnpm prisma migrate dev` 실행:

```
Failed to load config file ".../develop" as a TypeScript/JavaScript module.
Error: PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL.
```

`.env` 파일이 `develop/` 디렉터리에 존재하고 DATABASE_URL도 정상인데 resolve 실패.

### 원인

Prisma 6까지는 CLI가 실행될 때 `dotenv`를 내부에서 호출해 `.env`를 자동 로드했다. Prisma 7의 config 파일은 **평범한 TypeScript 모듈**이고, `env()` 함수는 `process.env`를 직접 읽는다. 즉 config 파일 평가 시점에 `.env`가 로드되어 있어야 한다. Prisma는 이 자동 로드를 더 이상 해 주지 않는다.

### 해결

Node 20.6+의 내장 API `process.loadEnvFile()`을 config 파일 상단에서 호출한다. `dotenv` 패키지를 따로 설치할 필요 없음.

```ts
import process from 'node:process'
import { defineConfig, env } from 'prisma/config'

process.loadEnvFile()  // .env를 명시적으로 로드

export default defineConfig({
  // ...
})
```

### 왜 `.env`에만 DATABASE_URL을 두는가 (Next.js 환경과의 분리)

Next.js 16은 `.env.local`을 `.env`보다 우선시하며 자동 로드한다. 하지만 **Prisma CLI는 `.env`만 자동 로드한다**. 두 도구의 파일 로드 규약이 달라서:

- `DATABASE_URL`을 `.env.local`에만 두면 Prisma CLI는 찾지 못함
- `.env`와 `.env.local` 둘 다에 같은 값을 쓰면 복제본이 생기고 동기화 부담
- **해결**: `.env`에는 DATABASE_URL처럼 둘 다 필요로 하는 "비민감·공용" 변수, `.env.local`에는 개인·민감 정보 (`NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY` 등)

이 분리는 `develop/.env.example`의 주석에 명시해 두었다.

## 브레이킹 체인지 3: `new PrismaClient()`가 **driver adapter 필수**로 바뀜

### 증상

2번을 해결하고 seed 실행:

```
PrismaClientInitializationError: `PrismaClient` needs to be constructed with a
non-empty, valid `PrismaClientOptions`
```

### 원인

Prisma 7부터 ORM 레이어(Prisma Client)가 **DB 드라이버와 분리**되었다. 이제 앱 개발자가 "어떤 JavaScript DB 드라이버를 쓸지"를 직접 고르고, 그 드라이버를 **adapter**로 감싸서 `PrismaClient` 생성자에 전달해야 한다. 이는 Prisma가 Rust query engine 바이너리에 묶여있던 과거 구조에서 벗어나 JS 생태계 드라이버를 선택 가능하게 만든 의도된 설계 변화다.

### 해결

PostgreSQL의 경우 `@prisma/adapter-pg`를 설치하고 `PrismaPg`를 어댑터로 사용한다:

```bash
pnpm add @prisma/adapter-pg
```

```ts
// lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({ adapter })
```

`@prisma/adapter-pg`는 `pg` 드라이버를 번들하고 있어 별도 `pg` 설치는 필요 없다.

### 부가 주의점

- **`new PrismaClient()` 빈 생성자는 에러**다. 전체 앱에서 `new PrismaClient()` 호출 지점을 모두 확인해야 한다.
- **seed script도 예외 없음**. `prisma/seed.ts`가 자체 PrismaClient를 만든다면 거기도 adapter를 넘겨야 한다.
- **`lib/prisma.ts` 싱글톤 패턴**에 adapter를 넣으면 전체 앱이 하나의 adapter 인스턴스를 공유하게 된다. 이 프로젝트에서는 이게 원하는 동작이다.
- 환경변수 검증(`if (!connectionString) throw ...`)은 이전보다 더 중요해졌다. 과거에는 Prisma CLI가 env 로드를 챙겨줬지만, 이제는 우리 코드가 먼저 실패해야 "왜 안 되지"의 원인이 명확해진다.

## 공통 교훈: 메이저 버전 업 시 로컬 docs 우선

이 세 가지 변경은 모두 **Prisma 7의 release notes와 migration guide에 명시**되어 있다. 훈련 데이터(~Prisma 6) 기준으로 작성한 코드가 `pnpm prisma migrate dev` 한 번으로 세 번 연속 실패한 경험은, **메이저 버전 업이 있었던 라이브러리는 구현 직전에 로컬 node_modules의 타입·생성 코드를 먼저 확인**하는 습관의 가치를 재확인시켜준다.

기존 `feedback_nextjs16_check_docs_first` 메모리는 Next.js에 국한되어 있었지만, 원리상 Prisma·NextAuth처럼 **5.x → 7.x 같은 큰 점프가 있는 라이브러리 전반에 동일한 원칙**이 적용되어야 한다. 현재 프로젝트에서 그런 라이브러리는 Prisma 7, Next.js 16, React 19, Tailwind v4 정도.

## 참고

- [ADR-0005: Prisma 파일 위치와 Client 싱글톤 패턴](../decisions/0005-prisma-infrastructure.md)
- [ADR-0006: 개발용 임시 user 시드 전략](../decisions/0006-dev-user-seeding-strategy.md)
- `develop/prisma.config.ts`, `develop/lib/prisma.ts`, `develop/prisma/seed.ts`
- https://pris.ly/d/prisma7-client-config (error 메시지에 포함된 공식 가이드)
