// Asset 타입 가드.
// ADR-0014가 채택한 단일 polymorphic 테이블 + 개별 nullable 컬럼 하이브리드의
// 타입 좁힘을 애플리케이션 레이어에서 보완한다.
//
// Prisma는 discriminator(`type` 컬럼)에 따라 필드 접근을 자동으로 좁혀주지
// 않으므로, 아래 가드를 통해 `asset.referenceUrl!` 같은 non-null assertion을
// 쓰지 않고 타입 안전하게 접근한다.

import type { Asset } from '@prisma/client'

export type ReferenceAsset = Asset & {
  type: 'reference'
  referenceKind: NonNullable<Asset['referenceKind']>
}

export type DocumentAsset = Asset & {
  type: 'document'
}

export function isReferenceAsset(asset: Asset): asset is ReferenceAsset {
  return asset.type === 'reference'
}

export function isDocumentAsset(asset: Asset): asset is DocumentAsset {
  return asset.type === 'document'
}
