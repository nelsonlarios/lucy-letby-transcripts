import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractTranscript } from '../src/parser/extract.ts'
import { searchDocumentHtml, searchDocumentPath } from '../src/parser/searchDocs.ts'
import { uniqueInOrder } from '../src/parser/text.ts'
import {
	formatIngestSummary,
	median,
	suspiciousReasons,
} from '../src/parser/validate.ts'
import type {
	IngestWarning,
	TranscriptManifest,
	TranscriptManifestEntry,
	TranscriptMetadata,
} from '../src/parser/types.ts'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const TRANSCRIPTS_DIR = join(ROOT, 'transcripts')
const METADATA_FILE = join(ROOT, 'data/transcripts.json')
const DATA_DIR = join(ROOT, 'public/data')
const TRANSCRIPT_JSON_DIR = join(DATA_DIR, 'transcripts')
const PAGEFIND_SOURCE_DIR = join(ROOT, 'generated/pagefind-source')
const CONCURRENCY = 4

async function mapPool<T, R>(
	items: Array<T>,
	limit: number,
	worker: (item: T, index: number) => Promise<R>,
) {
	const results = new Array<R>(items.length)
	let next = 0

	async function run() {
		while (next < items.length) {
			const index = next
			next += 1
			results[index] = await worker(items[index], index)
		}
	}

	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, () => run()),
	)

	return results
}

async function main() {
	const metadata = JSON.parse(
		await readFile(METADATA_FILE, 'utf8'),
	) as Array<TranscriptMetadata>
	const pdfs = new Set(await readdir(TRANSCRIPTS_DIR))
	const only = process.argv
		.find((arg) => arg.startsWith('--only='))
		?.slice('--only='.length)
		.split(',')
		.map(Number)
		.filter((day) => Number.isFinite(day))

	const selected = only
		? metadata.filter((entry) => only.includes(entry.day))
		: metadata

	if (selected.length === 0) {
		throw new Error('No transcripts selected for ingestion')
	}

	await rm(TRANSCRIPT_JSON_DIR, { recursive: true, force: true })
	await rm(PAGEFIND_SOURCE_DIR, { recursive: true, force: true })
	await mkdir(TRANSCRIPT_JSON_DIR, { recursive: true })
	await mkdir(PAGEFIND_SOURCE_DIR, { recursive: true })

	const missingOnDisk = selected.filter((entry) => !pdfs.has(entry.filename))

	if (missingOnDisk.length > 0) {
		throw new Error(
			`Missing local PDFs:\n${missingOnDisk.map((entry) => `  ${entry.filename}`).join('\n')}`,
		)
	}

	const extraPdfs = [...pdfs].filter(
		(filename) =>
			filename.endsWith('.pdf') &&
			!metadata.some((entry) => entry.filename === filename),
	)

	console.log(`Ingesting ${selected.length} transcripts…`)

	const results = await mapPool(selected, CONCURRENCY, async (entry, index) => {
		const pdfPath = join(TRANSCRIPTS_DIR, entry.filename)
		const result = await extractTranscript(pdfPath, entry)
		const label = `[${index + 1}/${selected.length}] Day ${entry.day}`

		if (result.error || !result.document) {
			console.error(`${label} FAILED — ${result.error}`)
		} else {
			console.log(
				`${label} — ${result.document.pageCount} pages, ${result.document.blockCount} blocks`,
			)
		}

		return result
	})

	const documents = results
		.map((result) => result.document)
		.filter((document) => document !== null)

	const pageCounts = documents.map((document) => document.pageCount)
	const charsPerPage = results.flatMap((result) => {
		if (!result.document || result.document.pageCount === 0) {
			return []
		}

		return [result.characterCount / result.document.pageCount]
	})
	const stats = {
		medianPages: median(pageCounts),
		medianCharsPerPage: median(charsPerPage.map(Math.round)),
	}

	const warnings: Array<IngestWarning> = []

	for (const extra of extraPdfs) {
		warnings.push({
			day: 0,
			filename: extra,
			reason: 'PDF exists on disk but is not listed in transcripts.json',
		})
	}

	for (const result of results) {
		warnings.push(...result.warnings)

		if (!result.document) {
			continue
		}

		for (const reason of suspiciousReasons(
			result.document,
			result.characterCount,
			stats,
		)) {
			warnings.push({
				day: result.document.day,
				filename: result.document.filename,
				reason,
			})
		}
	}

	const manifestEntries: Array<TranscriptManifestEntry> = []

	for (const result of results) {
		if (!result.document) {
			continue
		}

		const document = result.document

		await writeFile(
			join(TRANSCRIPT_JSON_DIR, `${document.day}.json`),
			JSON.stringify(document) + '\n',
		)

		for (const page of document.pages) {
			const html = searchDocumentHtml(document, page.page)

			if (!html) {
				continue
			}

			const relative = searchDocumentPath(document.day, page.page)
			const outputPath = join(PAGEFIND_SOURCE_DIR, relative)
			await mkdir(join(outputPath, '..'), { recursive: true })
			await writeFile(outputPath, html)
		}

		manifestEntries.push({
			day: document.day,
			date: document.date,
			title: document.title,
			section: document.section,
			filename: document.filename,
			sourceUrl: document.sourceUrl,
			pageCount: document.pageCount,
			blockCount: document.blockCount,
			characterCount: result.characterCount,
			speakers: document.speakers,
		})
	}

	manifestEntries.sort((a, b) => a.day - b.day)

	const sectionMap = new Map<string, Array<number>>()

	for (const entry of manifestEntries) {
		const days = sectionMap.get(entry.section) ?? []
		days.push(entry.day)
		sectionMap.set(entry.section, days)
	}

	const speakers = uniqueInOrder(
		manifestEntries.flatMap((entry) => entry.speakers),
	)

	const manifest: TranscriptManifest = {
		generatedAt: new Date().toISOString(),
		transcriptCount: manifestEntries.length,
		pageCount: manifestEntries.reduce((sum, entry) => sum + entry.pageCount, 0),
		blockCount: manifestEntries.reduce((sum, entry) => sum + entry.blockCount, 0),
		speakerCount: speakers.length,
		sections: [...sectionMap.entries()].map(([name, days]) => ({ name, days })),
		transcripts: manifestEntries,
	}

	await writeFile(
		join(DATA_DIR, 'manifest.json'),
		JSON.stringify(manifest, null, '\t') + '\n',
	)

	const failed = results.filter((result) => !result.document).length

	console.log('')
	console.log(
		formatIngestSummary({
			processed: documents.length,
			failed,
			pageCount: manifest.pageCount,
			blockCount: manifest.blockCount,
			speakers,
			warnings,
		}),
	)

	if (failed > 0) {
		process.exitCode = 1
	}
}

await main()
