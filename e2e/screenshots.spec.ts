import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const dir = 'test-results/screens'

test('capture design review screenshots', async ({ page }) => {
	await mkdir(dir, { recursive: true })

	async function shot(name: string, width: number, height: number) {
		await page.setViewportSize({ width, height })
		await page.waitForTimeout(250)
		await page.screenshot({
			path: `${dir}/${name}.png`,
			fullPage: false,
		})
	}

	await page.goto('/')
	await expect(page.getByRole('heading', { name: /Lucy Letby trial transcripts/i })).toBeVisible()
	await shot('desktop-home', 1440, 900)
	await shot('tablet-home', 768, 1024)
	await shot('mobile-home', 390, 844)

	await page.setViewportSize({ width: 1440, height: 900 })
	await page.getByLabel('Search transcripts').fill('insulin')
	await page.getByLabel('Search transcripts').press('Enter')
	await expect(page.locator('.search-result').first()).toBeVisible({ timeout: 15_000 })
	await shot('desktop-search', 1440, 900)
	await shot('laptop-search', 1024, 800)
	await shot('mobile-search', 390, 844)

	await page.setViewportSize({ width: 1440, height: 900 })
	await page.locator('.search-result').first().click()
	await expect(page.locator('.reader')).toBeVisible()
	await shot('desktop-reader', 1440, 900)
	await shot('laptop-reader', 1024, 800)
	await shot('tablet-reader', 768, 1024)
	await shot('mobile-reader', 390, 844)

	await page.setViewportSize({ width: 1440, height: 900 })
	await page.getByRole('button', { name: 'Reading settings' }).click()
	await expect(page.getByText('Reading settings')).toBeVisible()
	await shot('desktop-settings', 1440, 900)
	await page.keyboard.press('Escape')

	await page.setViewportSize({ width: 390, height: 844 })
	await page.getByRole('button', { name: 'Reading settings' }).click()
	await shot('mobile-settings', 390, 844)
})
