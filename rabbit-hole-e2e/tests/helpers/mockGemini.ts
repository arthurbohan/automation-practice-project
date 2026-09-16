import { Page, Route } from '@playwright/test'

export type Branch = { relation: string, name: string, why: string, track: string }

export const DEFAULT_BRANCHES: Branch[] = [
  { relation: 'ANCESTOR', name: 'Ancestor Artist', why: 'Influenced the sound', track: 'Ancestor Artist — Origin (1975)' },
  { relation: 'CONTEMPORARY', name: 'Contemporary Artist', why: 'Same era, same scene', track: 'Contemporary Artist — Parallel (1998)' },
  { relation: 'MUTATION', name: 'Mutation Artist', why: 'Twisted the formula', track: 'Mutation Artist — Warp (2003)' },
  { relation: 'DISTANT RELATIVE', name: 'Distant Relative', why: 'Shares a distant root', track: 'Distant Relative — Echo (2010)' },
  { relation: 'INHERITOR', name: 'Inheritor Artist', why: 'Carries the torch forward', track: 'Inheritor Artist — Legacy (2021)' },
]

async function fulfillCompleted(route: Route, text: string) {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'completed',
      steps: [{ type: 'model_output', content: [{ type: 'text', text }] }],
    }),
  })
}

export async function mockGemini(page: Page, { branches = DEFAULT_BRANCHES, deepText = 'This links back through a shared rhythmic approach and studio technique.' }: { branches?: Branch[], deepText?: string } = {}) {
  await page.route('**/api/gemini/v1beta/interactions', async (route) => {
    const body = route.request().postDataJSON()
    const prompt = body?.input || ''

    if (prompt.includes('Map five directions')) {
      const askedName = prompt.match(/Starting point: "([^"]+)"/)?.[1] || 'Unknown Artist'
      const text = JSON.stringify({
        node: { name: askedName, tagline: 'A test artist for e2e coverage', track: `${askedName} — Test Song (2020)` },
        branches,
      })
      await fulfillCompleted(route, text)
      return
    }

    await fulfillCompleted(route, deepText)
  })
}

export async function mockGeminiFailure(page: Page, { status = 500 }: { status?: number } = {}) {
  await page.route('**/api/gemini/v1beta/interactions', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'mocked failure' }) })
  )
}
