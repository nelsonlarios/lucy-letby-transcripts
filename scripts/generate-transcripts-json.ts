import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import * as cheerio from 'cheerio'

const PAGE_URL = 'https://lucyletbyinnocence.com/transcripts.html'
const TRANSCRIPTS_DIR = './transcripts'
const OUTPUT_FILE = './data/transcripts.json'

async function main() {
	const response = await fetch(PAGE_URL)

	if (!response.ok) {
		throw new Error(`Failed to fetch ${PAGE_URL}: ${response.status}`)
	}

	const html = await response.text()
	const $ = cheerio.load(html)

	const localFiles = new Set(await readdir(TRANSCRIPTS_DIR))

	let section = ''

	const transcripts: Array<{
		day: number
		date: string
		title: string
		section: string
		filename: string
		sourceUrl: string
	}> = []

	$('h3, a').each((_, element) => {
		const node = $(element)

		if (element.tagName === 'h3') {
			section = node.text().replace(/\s+/g, ' ').trim()
			return
		}

		const href = node.attr('href')

		if (!href?.toLowerCase().includes('.pdf')) {
			return
		}

		const sourceUrl = new URL(href, PAGE_URL).href
		const filename = decodeURIComponent(
			basename(new URL(sourceUrl).pathname),
		)

		if (!localFiles.has(filename)) {
			console.warn(`PDF not found locally: ${filename}`)
			return
		}

		const match = filename.match(
			/^day_(\d+)_(\d{2})-(\d{2})-(\d{4})\.pdf$/i,
		)

		if (!match) {
			console.warn(`Unexpected filename: ${filename}`)
			return
		}

		const [, day, dd, mm, yyyy] = match

		transcripts.push({
			day: Number(day),
			date: `${yyyy}-${mm}-${dd}`,
			title: node.text().replace(/\s+/g, ' ').trim(),
			section,
			filename,
			sourceUrl,
		})
	})

	transcripts.sort((a, b) => a.day - b.day)

	await mkdir('./data', { recursive: true })

	await writeFile(
		OUTPUT_FILE,
		JSON.stringify(transcripts, null, '\t') + '\n',
	)

	console.log(`Generated ${transcripts.length} transcripts`)
	console.log(`→ ${OUTPUT_FILE}`)
}

await main()