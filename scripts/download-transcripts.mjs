import { mkdir, writeFile, access } from 'node:fs/promises'
import { basename, join } from 'node:path'

const PAGE_URL = 'https://lucyletbyinnocence.com/transcripts.html'
const OUTPUT_DIR = './transcripts'
const CONCURRENCY = 4

async function fileExists(path) {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

async function getPdfUrls() {
	const response = await fetch(PAGE_URL)

	if (!response.ok) {
		throw new Error(`Failed to load page: ${response.status}`)
	}

	const html = await response.text()

	const matches = [
		...html.matchAll(/href=["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi),
	]

	return [
		...new Set(
			matches.map(([, href]) => new URL(href, PAGE_URL).href),
		),
	]
}

async function downloadPdf(url, index, total) {
	const filename = basename(new URL(url).pathname)
	const path = join(OUTPUT_DIR, filename)

	if (await fileExists(path)) {
		console.log(`[${index}/${total}] Skipping ${filename}`)
		return
	}

	console.log(`[${index}/${total}] Downloading ${filename}`)

	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}: ${url}`)
	}

	const data = Buffer.from(await response.arrayBuffer())

	await writeFile(path, data)
}

async function downloadWorker(queue, total) {
	while (queue.length > 0) {
		const item = queue.shift()

		if (!item) {
			return
		}

		try {
			await downloadPdf(item.url, item.index, total)
		} catch (error) {
			console.error(`Failed: ${item.url}`)
			console.error(error)
		}
	}
}

async function main() {
	await mkdir(OUTPUT_DIR, { recursive: true })

	const urls = await getPdfUrls()

	console.log(`Found ${urls.length} PDFs`)

	const queue = urls.map((url, index) => ({
		url,
		index: index + 1,
	}))

	await Promise.all(
		Array.from(
			{ length: Math.min(CONCURRENCY, urls.length) },
			() => downloadWorker(queue, urls.length),
		),
	)

	console.log('\nDone.')
}

await main()