// Prisma seed script
// ADR-0006: 고정 email 기반 upsert로 개발용 임시 user 확보.
// pnpm prisma migrate dev 실행 시 (또는 pnpm prisma db seed) 자동으로 호출된다.
//
// 주의: seed는 독립 프로세스로 실행되므로 lib/prisma.ts의 싱글톤을 재사용하지
// 않고 자체 PrismaClient 인스턴스를 만든다. Prisma 7부터 adapter가 필수.

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('[seed] DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const DEV_USER_EMAIL = 'dev@local'

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {},
    create: {
      email: DEV_USER_EMAIL,
      name: 'Dev User',
    },
  })

  console.log(`[seed] ensured dev user: ${user.email} (${user.id})`)
}

main()
  .catch((e) => {
    console.error('[seed] failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
