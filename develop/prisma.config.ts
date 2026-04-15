// Prisma 7의 config 파일. 두 가지 변경을 반영한다.
//
// 1. schema의 `datasource.url`이 더 이상 schema 내부에서 지원되지 않아
//    여기로 이동되었다.
// 2. Prisma 7 config 파일은 .env를 자동 로드하지 않는다. Node 20.6+의
//    process.loadEnvFile() API로 명시적으로 로드해야 env('DATABASE_URL')이
//    값을 찾을 수 있다.
//
// 참고: architecture/notes/prisma7-config-migration.md

import process from 'node:process'
import { defineConfig, env } from 'prisma/config'

process.loadEnvFile()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
