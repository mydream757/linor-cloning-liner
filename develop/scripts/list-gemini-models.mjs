// 진단용 일회성 스크립트 — 현재 GEMINI_API_KEY로 접근 가능한 모델을 v1beta/v1 양쪽에서 조회.
// 실행: node --env-file=.env.local scripts/list-gemini-models.mjs

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error('GEMINI_API_KEY가 .env.local에 없습니다.')
  process.exit(1)
}

async function listVersion(version) {
  console.log(`\n=== ${version} ===`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}&pageSize=1000`,
  )
  if (!res.ok) {
    console.error(`조회 실패: ${res.status} ${res.statusText}`)
    console.error(await res.text())
    return
  }
  const data = await res.json()
  const models = data.models ?? []
  const streaming = models.filter(
    (m) =>
      m.supportedGenerationMethods?.includes('generateContent') ||
      m.supportedGenerationMethods?.includes('streamGenerateContent'),
  )
  console.log(`총 ${models.length}개 중 generateContent/streaming 지원 ${streaming.length}개\n`)
  for (const m of streaming) {
    console.log(`• ${m.name}`)
    console.log(`  methods: ${m.supportedGenerationMethods?.join(', ')}`)
  }
}

await listVersion('v1beta')
await listVersion('v1')
