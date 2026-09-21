import { pagefindPathToLocation } from '../parser/ids'

export type PagefindResult = {
	url: string
	excerpt: string
	meta: Record<string, string | undefined>
}

type PagefindSearchResult = {
	id: string
	data: () => Promise<PagefindResult>
}

type PagefindApi = {
	options: (options: { bundlePath: string }) => Promise<void>
	init: () => Promise<void>
	search: (
		query: string | null,
		options?: { filters?: Record<string, string | Array<string>> },
	) => Promise<{ results: Array<PagefindSearchResult> }>
	filters: () => Promise<Record<string, Record<string, number>>>
}

let api: PagefindApi | null = null
let failed = false

export async function getPagefind() {
	if (api) {
		return api
	}

	if (failed) {
		return null
	}

	try {
		const bundlePath = `${import.meta.env.BASE_URL}pagefind/`
		const module = (await import(/* @vite-ignore */ `${bundlePath}pagefind.js`)) as PagefindApi
		await module.options({ bundlePath })
		await module.init()
		api = module
		return api
	} catch {
		failed = true
		return null
	}
}

export async function searchTranscripts(query: string, section?: string) {
	const pagefind = await getPagefind()

	if (!pagefind) {
		throw new Error('Search index is unavailable. Run pnpm transcripts:build.')
	}

	const trimmed = query.trim()

	if (!trimmed) {
		return []
	}

	const search = await pagefind.search(
		trimmed,
		section ? { filters: { section } } : undefined,
	)

	const results = await Promise.all(
		search.results.slice(0, 80).map((result) => result.data()),
	)

	return results.map((result) => {
		const location = pagefindPathToLocation(result.url)
		const day = Number(result.meta.day ?? location?.day ?? 0)
		const page = Number(result.meta.page ?? location?.page ?? 0)

		return {
			...result,
			day,
			page,
			title: result.meta.title ?? '',
			section: result.meta.section ?? '',
			date: result.meta.date ?? '',
		}
	})
}

export type SearchHit = Awaited<ReturnType<typeof searchTranscripts>>[number]
