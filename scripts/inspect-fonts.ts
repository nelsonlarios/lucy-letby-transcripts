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
	fontName: string
	hasEOL?: boolean
}

async function inspectFonts(path: string) {
	const data = new Uint8Array(await readFile(path))
	const doc = await pdfjs.getDocument({ data }).promise
	const page = await doc.getPage(Math.min(2, doc.numPages))
	const content = await page.getTextContent()
	const styles = content.styles
	const counts = new Map<string, number>()

	for (const item of content.items) {
		if (!('str' in item) || !item.str) {
			continue
		}

		const textItem = item as TextItem
		const style = styles[textItem.fontName]
		const key = `${textItem.fontName} | ${style?.fontFamily ?? '?'} | ${style?.ascent?.toFixed(2)} | h=${textItem.height.toFixed(1)}`
		counts.set(key, (counts.get(key) ?? 0) + 1)
	}

	console.log('\n', basename(path), 'pages', doc.numPages)
	for (const [key, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
		console.log(String(count).padStart(5), key)
	}

	const first = content.items.find((item) => 'str' in item && item.str.includes(':')) as
		| TextItem
		| undefined

	if (first) {
		console.log('first colon item', JSON.stringify(first.str), first.fontName, first.height)
	}
}

for (const file of process.argv.slice(2)) {
	await inspectFonts(file)
}
