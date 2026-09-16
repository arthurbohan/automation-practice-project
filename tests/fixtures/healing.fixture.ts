import { test as base, Page, Locator } from '@playwright/test'
import path                            from 'path'
import { heal as healFn }              from '../../helpers/selfHealing'

// ─── Fixture type ─────────────────────────────────────────────────────────────

type HealFixture = {
  heal: (page: Page, locator: Locator, description: string) => Promise<Locator>
}

// ─── Fixture implementation ───────────────────────────────────────────────────

export const healingFixtures = base.extend<HealFixture>({

  heal: async ({}, use, testInfo) => {
    await use(async (page, locator, description) => {
      const result = await healFn(page, locator, description, {
        // titlePath[0] is the file path itself — drop it, testFile carries that separately
        testTitle: testInfo.titlePath.slice(1).join(' > '),
        testFile: path.relative(process.cwd(), testInfo.file),
      })
      return result.locator
    })
  },

})