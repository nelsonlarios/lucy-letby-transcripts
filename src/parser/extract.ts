import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { reconstructLines } from './lines'
import { buildPageBlocks, collectSpeakers, type ParseCarry } from './structure'
import type {
	IngestResult,
	TranscriptDocument,
	TranscriptMetadata,
	TranscriptPage,
} from './types'

const require = createRequire(import.meta.url)

pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
	require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs'),
).href

export async function extractTranscript(
	pdfPath: string,
	metadata: TranscriptMetadata,
): Promise<IngestResult> {
	const warnings: IngestResult['warnings'] = []

	try {
		const data = new Uint8Array(await readFile(pdfPath))
		const document = await pdfjs.getDocument({ data }).promise
		const pages: Array<TranscriptPage> = []
		let carry: ParseCarry = { speaker: null }
		let characterCount = 0

		for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
			const page = await document.getPage(pageNumber)
			const content = await page.getTextContent()
			const items = content.items.flatMap((item) =>
				'str' in item
					? [
							{
								str: item.str,
								transform: item.transform,
								width: item.width,
								height: item.height,
							},
						]
					: [],
			)
			const lines = reconstructLines(items, pageNumber)
			const parsed = buildPageBlocks(lines, pageNumber, carry)

			carry = parsed.carry
			characterCount += parsed.blocks.reduce(
				(sum, block) => sum + block.text.length,
				0,
			)

			pages.push({
				page: pageNumber,
				blocks: parsed.blocks,
			})
		}

		const blocks = pages.flatMap((page) => page.blocks)
		const speakers = collectSpeakers(blocks)

		if (pages.length === 0) {
			warnings.push({
				day: metadata.day,
				filename: metadata.filename,
				reason: 'No pages extracted',
			})
		}

		if (blocks.length === 0) {
			warnings.push({
				day: metadata.day,
				filename: metadata.filename,
				reason: 'No text blocks extracted',
			})
		}

		const transcript: TranscriptDocument = {
			...metadata,
			pageCount: pages.length,
			blockCount: blocks.length,
			speakers,
			pages,
		}

		return {
			document: transcript,
			characterCount,
			warnings,
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)

		return {
			document: null,
			characterCount: 0,
			warnings: [
				{
					day: metadata.day,
					filename: metadata.filename,
					reason: `Extraction failed: ${message}`,
				},
			],
			error: message,
		}
	}
}
