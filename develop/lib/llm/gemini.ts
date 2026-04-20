// Gemini 프로바이더 — GEMINI_API_KEY 설정 시 활성화.
// generateContentStream() → AsyncGenerator로 청크를 직접 순회.

import { GoogleGenAI } from '@google/genai'

import type { LLMMessage, LLMProvider, LLMStreamChunk, LLMStreamOptions } from './types'

export function createGeminiProvider(): LLMProvider {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  }
  const client = new GoogleGenAI({ apiKey })

  return {
    async *stream(
      messages: LLMMessage[],
      systemPrompt: string,
      options?: LLMStreamOptions,
    ): AsyncIterable<LLMStreamChunk> {
      const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'

      // Gemini의 contents 포맷으로 변환 (role: user/model)
      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      const response = await client.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 4096,
          abortSignal: options?.signal,
        },
      })

      for await (const chunk of response) {
        const text = chunk.text
        if (typeof text === 'string' && text.length > 0) {
          yield { type: 'text', text }
        }
      }

      yield { type: 'done' }
    },
  }
}
