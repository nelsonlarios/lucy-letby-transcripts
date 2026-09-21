import { expect, test } from '@playwright/test'

test('home, search, reader, settings and pdf link', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('heading', { name: /Lucy Letby trial transcripts/i })).toBeVisible()

	const search = page.getByLabel('Search transcripts')
	await search.fill('insulin')
	await search.press('Enter')
	await expect(page).toHaveURL(/\/search\?q=insulin/)
	await expect(page.locator('.search-result').first()).toBeVisible({
		timeout: 15_000,
	})

	await page.locator('.search-result').first().click()
	await expect(page).toHaveURL(/\/transcripts\/\d+/)
	await expect(page.locator('.reader')).toBeVisible()
	await expect(page.locator('mark').first()).toBeVisible()

	await page.getByRole('button', { name: 'Reading settings' }).click()
	await page.getByRole('button', { name: 'Sans' }).click()
	await expect(page.locator('.reader')).toHaveAttribute('data-font', 'sans')
	await page.getByRole('button', { name: 'White' }).click()
	await page.reload()
	await expect(page.locator('.reader')).toHaveAttribute('data-font', 'sans')
	await expect(page.locator('html')).toHaveAttribute('data-reader-theme', 'white')

	const pdf = page.getByRole('link', { name: 'PDF' })
	await expect(pdf).toHaveAttribute('href', /\/originals\/day_\d+/)

	await page.getByRole('link', { name: 'Next day' }).click()
	await expect(page).toHaveURL(/\/transcripts\/\d+/)
})

test('deep link lands on a passage', async ({ page }) => {
	await page.goto('/transcripts/1#p1-b4')
	await expect(page.locator('#p1-b4')).toBeVisible()
})
