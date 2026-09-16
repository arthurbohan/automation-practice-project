import { test, expect } from '../../fixtures'

// ─── Scenario 1: Original locator works fine ──────────────────────────────────

test('heal: original locator works — no healing triggered', async ({
  inventoryPage,
  heal,
}) => {
  const addBtn = inventoryPage.addToCartBtn('sauce-labs-backpack')

  const healedBtn = await heal(
    inventoryPage.page,
    addBtn,
    'Add to cart button for Sauce Labs Backpack',
  )

  await healedBtn.click()

  expect(await inventoryPage.getCartCount()).toBe(1)
})

// ─── Scenario 2: Broken locator — AI heals it ────────────────────────────────

test('heal: broken locator — AI finds the correct element', async ({
  inventoryPage,
  heal,
}) => {
  const brokenLocator = inventoryPage.page.locator(
    '[data-test="btn-add-sauce-labs-backpack"]',
  )

  const healedBtn = await heal(
    inventoryPage.page,
    brokenLocator,
    'Add to cart button for Sauce Labs Backpack',
  )

  await healedBtn.click()

  expect(await inventoryPage.getCartCount()).toBe(1)
})

// ─── Scenario 3: Healing the sort dropdown ────────────────────────────────────

test('heal: broken sort dropdown — AI finds it', async ({
  inventoryPage,
  heal,
}) => {
  const brokenDropdown = inventoryPage.page.locator(
    '[data-test="sort-container"]',
  )

  const healedDropdown = await heal(
    inventoryPage.page,
    brokenDropdown,
    'Product sort dropdown — allows sorting by name or price',
  )

  await healedDropdown.selectOption('lohi')

  const prices = await inventoryPage.getItemPrices()
  for (let i = 1; i < prices.length; i++) {
    expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
  }
})

// ─── Scenario 4: Multiple healed locators in one test ────────────────────────

test('heal: full add-to-cart flow with broken locators', async ({
  inventoryPage,
  heal,
}) => {
  const brokenAddBtn = inventoryPage.page.locator(
    '[data-broken="add-to-cart-sauce-labs-bike-light"]',
  )
  const brokenCartIcon = inventoryPage.page.locator(
    '.broken-cart-icon',
  )

  const addBtn = await heal(
    inventoryPage.page,
    brokenAddBtn,
    'Add to cart button for Sauce Labs Bike Light',
  )
  await addBtn.click()
  expect(await inventoryPage.getCartCount()).toBe(1)

  const cartIcon = await heal(
    inventoryPage.page,
    brokenCartIcon,
    'Shopping cart icon link in the navigation bar',
  )
  await cartIcon.click()

  await expect(inventoryPage.page).toHaveURL(/cart/)
})
