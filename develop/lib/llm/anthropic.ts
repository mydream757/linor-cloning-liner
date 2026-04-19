// Anthropic 프로바이더 — ANTHROPIC_API_KEY 설정 시 활성화.
// create({ stream: true }) 저수준 패턴으로 RawMessageStreamEvent를 직접 순회.

import Anthropic from '@anthropic-ai/sdk'
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources'

import type { LLMMessage, LLMProvider, LLMStreamChunk, LLMStreamOptions } from './types'

export function createAnthropicProvider(): LLMProvider {
  const client = new Anthropic()

  return {
    async *stream(
      messages: LLMMessage[],
      systemPrompt: string,
      options?: LLMStreamOptions,
    ): AsyncIterable<LLMStreamChunk> {
      const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'
      const anthropicStream = await client.messages.create(
        {
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages,
          stream: true,
        },
        { signal: options?.signal },
      )

      for await (const event of anthropicStream as AsyncIterable<RawMessageStreamEvent>) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta
          if ('text' in delta) {
            yield { type: 'text', text: delta.text }
          }
        }
        if (event.type === 'message_stop') {
          break
        }
      }

      yield { type: 'done' }
    },
  }
}
