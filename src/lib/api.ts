import type { TranscriptDocument, TranscriptManifest } from '../parser/types'

const manifestCache: { value: TranscriptManifest | null; promise: Promise<TranscriptManifest> | null } = {
	value: null,
	promise: null,
}

export async function loadManifest() {
	if (manifestCache.value) {
		return manifestCache.value
	}

	if (!manifestCache.promise) {
		manifestCache.promise = fetch('/data/manifest.json').then(async (response) => {
			if (!response.ok) {
				throw new Error('The transcript index has not been built.')
			}

			const manifest = (await response.json()) as TranscriptManifest
			manifestCache.value = manifest
			return manifest
		})
	}

	return manifestCache.promise
}

export async function loadTranscript(day: number) {
	const response = await fetch(`/data/transcripts/${day}.json`)

	if (response.status === 404) {
		return null
	}

	if (!response.ok) {
		throw new Error('The transcript could not be loaded.')
	}

	return (await response.json()) as TranscriptDocument
}
