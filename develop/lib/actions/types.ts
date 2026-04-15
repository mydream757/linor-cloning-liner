// Server Action 공용 반환 타입 (ADR-0008).
//
// 모든 Server Action은 ActionResult<T>를 반환한다. client 쪽에서 useActionState로
// 받아 form 아래 인라인 에러 표시가 가능해진다.

export type ActionError = {
  message?: string
  fields?: Record<string, string[] | undefined>
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError }
