import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'

const require = createRequire(import.meta.url)

pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
	require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs'),
).href

type TextItem = {
	str: string
	transform: Array<number>
	width: number
	height: number
	hasEOL?: boolean
}

async function inspect(path: string, pagesToShow = 3) {
	const data = new Uint8Array(await readFile(path))
	const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise
	const numPages = doc.numPages

	console.log('\n' + '='.repeat(80))
	console.log(basename(path))
	console.log('pages:', numPages)
	console.log('info:', await doc.getMetadata().then((m) => m.info))

	const pages = [1, 2, Math.min(10, numPages), numPages].filter(
		(page, index, all) => all.indexOf(page) === index && page <= numPages,
	)

	for (const pageNumber of pages.slice(0, pagesToShow + 1)) {
		const page = await doc.getPage(pageNumber)
		const content = await page.getTextContent()
		const viewport = page.getViewport({ scale: 1 })
		const items = content.items.filter(
			(item): item is TextItem => 'str' in item,
		)

		console.log('\n--- page', pageNumber, 'size', viewport.width, 'x', viewport.height, 'items', items.length)

		const lines: Array<{ y: number; parts: Array<{ x: number; text: string }> }> = []

		for (const item of items) {
			if (!item.str) {
				continue
			}

			const x = item.transform[4]
			const y = Math.round(item.transform[5] * 2) / 2
			const existing = lines.find((line) => Math.abs(line.y - y) < 2)

			if (existing) {
				existing.parts.push({ x, text: item.str })
			} else {
				lines.push({ y, parts: [{ x, text: item.str }] })
			}
		}

		lines.sort((a, b) => b.y - a.y)

		for (const line of lines) {
			line.parts.sort((a, b) => a.x - b.x)
			const text = line.parts.map((part) => part.text).join('')
			const xs = line.parts.map((part) => Math.round(part.x)).join(',')
			console.log(
				String(Math.round(line.y)).padStart(5),
				xs.padEnd(18).slice(0, 18),
				JSON.stringify(text),
			)
		}
	}
}

const files = process.argv.slice(2)

for (const file of files) {
	await inspect(file)
}
