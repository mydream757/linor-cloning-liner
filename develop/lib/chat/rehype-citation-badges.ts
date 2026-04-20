// rehype 플러그인 — 어시스턴트 응답의 텍스트 노드에서 [n] 패턴을 찾아
// <span data-citation="n">[n]</span>으로 치환한다. AssistantMessage의
// ReactMarkdown에서 span 컴포넌트를 data-citation 속성으로 분기해 배지로 렌더.
//
// 디자인: design/features/3-liner.md §2-7 출처 배지.
// 원본 content는 plain text 그대로 보존되고, 파싱은 렌더 시점에만 수행.
//
// 외부 트리 walker 의존 없이 순수 재귀로 구현 — unist-util-visit ESM 해석이
// Next.js 번들러에서 막히는 사례를 회피한다.

import type { Element, Root, RootContent, Text } from 'hast'

const CITATION_PATTERN = /\[(\d+)\]/g

export function rehypeCitationBadges() {
  return (tree: Root) => {
    transformChildren(tree)
  }
}

function transformChildren(parent: Root | Element): void {
  const children = parent.children
  // 역순 순회 — splice로 원소를 늘려도 아직 방문하지 않은 인덱스가 안정적으로 유지됨.
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i]
    if (child.type === 'text') {
      const replacement = splitTextForCitations(child.value)
      if (replacement) {
        children.splice(i, 1, ...replacement)
      }
    } else if (child.type === 'element') {
      // 코드 블록·인라인 코드 내부의 [n]은 코드 샘플일 수 있으므로 건드리지 않음.
      if (child.tagName === 'code' || child.tagName === 'pre') continue
      transformChildren(child)
    }
  }
}

function splitTextForCitations(text: string): RootContent[] | null {
  const matches = [...text.matchAll(CITATION_PATTERN)]
  if (matches.length === 0) return null

  const nodes: RootContent[] = []
  let lastIndex = 0
  for (const match of matches) {
    const full = match[0]
    const num = match[1]
    const start = match.index ?? 0
    if (start > lastIndex) {
      nodes.push(textNode(text.slice(lastIndex, start)))
    }
    nodes.push(badgeElement(full, num))
    lastIndex = start + full.length
  }
  if (lastIndex < text.length) {
    nodes.push(textNode(text.slice(lastIndex)))
  }
  return nodes
}

function textNode(value: string): Text {
  return { type: 'text', value }
}

function badgeElement(display: string, num: string): Element {
  return {
    type: 'element',
    tagName: 'span',
    properties: { dataCitation: num },
    children: [{ type: 'text', value: display }],
  }
}
