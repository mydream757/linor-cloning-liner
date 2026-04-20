// Chat 조회 유틸. React.cache로 요청 내 중복 dedupe (ADR-0007).

import { cache } from 'react'

import { prisma } from '@/lib/prisma'

export const listChatsByProject = cache(async (projectId: string) => {
  return prisma.chat.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })
})

export const getLatestChatIdByProject = cache(async (projectId: string) => {
  const chat = await prisma.chat.findFirst({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  return chat?.id ?? null
})

export const getChatWithMessages = cache(async (chatId: string) => {
  return prisma.chat.findUnique({
    where: { id: chatId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
})
