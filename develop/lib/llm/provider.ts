// LLM 프로바이더 팩토리 — 환경 변수 기반 자동 선택.
//
// 선택 우선순위:
//   1. LLM_PROVIDER 환경 변수가 명시적으로 설정된 경우 해당 프로바이더
//   2. ANTHROPIC_API_KEY가 설정된 경우 → Anthropic
//   3. GEMINI_API_KEY가 설정된 경우 → Gemini
//   4. 둘 다 없으면 → 에러

import { createAnthropicProvider } from './anthropic'
import { createGeminiProvider } from './gemini'
import type { LLMProvider } from './types'

export function getLLMProvider(): LLMProvider {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase()

  if (explicit === 'anthropic' || (!explicit && process.env.ANTHROPIC_API_KEY)) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('LLM_PROVIDER=anthropic이지만 ANTHROPIC_API_KEY가 설정되지 않았습니다.')
    }
    return createAnthropicProvider()
  }

  if (explicit === 'gemini' || (!explicit && process.env.GEMINI_API_KEY)) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('LLM_PROVIDER=gemini이지만 GEMINI_API_KEY가 설정되지 않았습니다.')
    }
    return createGeminiProvider()
  }

  throw new Error(
    'LLM 프로바이더를 설정해주세요. ANTHROPIC_API_KEY 또는 GEMINI_API_KEY를 .env.local에 추가하세요.',
  )
}
