import { Page } from '@playwright/test'
import { BasePage } from './basePage'

export class ItemDetailPage extends BasePage {
    constructor(page: Page) {
        super(page)
    }

    // ── Locators ──────────────────────────────────────────────────

    get name() { return this.page.getByTestId('inventory-item-name') }
    get description() { return this.page.getByTestId('inventory-item-desc') }
    get price() { return this.page.getByTestId('inventory-item-price') }
    get addToCartBtn() { return this.page.getByTestId('add-to-cart') }
    get removeBtn() { return this.page.getByTestId('remove') }
    get backButton() { return this.page.getByTestId('back-to-products') }
    get cartBadge() { return this.page.locator('.shopping_cart_badge') }

    // ── Standard methods ──────────────────────────────────────────

    async goto(id: number = 4) {
        await this.page.goto(`/inventory-item.html?id=${id}`)
        await this.name.waitFor({ state: 'visible' })
    }

    async addToCart() {
        await this.addToCartBtn.click()
    }

    async removeFromCart() {
        await this.removeBtn.click()
    }

    async goBack() {
        await this.backButton.click()
        await this.page.waitForURL('/inventory.html')
    }

    async getPrice(): Promise<number> {
        const text = await this.price.innerText()
        return parseFloat(text.replace('$', ''))
    }

    async getCartCount(): Promise<number> {
        if (!await this.cartBadge.isVisible()) return 0
        return parseInt(await this.cartBadge.innerText())
    }
}
