export type TranscriptBlockType =
	| 'heading'
	| 'speaker'
	| 'paragraph'
	| 'stageDirection'

export type TranscriptBlock = {
	id: string
	type: TranscriptBlockType
	speaker?: string
	text: string
	page: number
}

export type TranscriptPage = {
	page: number
	blocks: Array<TranscriptBlock>
}

export type TranscriptMetadata = {
	day: number
	date: string
	title: string
	section: string
	filename: string
	sourceUrl: string
}

export type TranscriptDocument = TranscriptMetadata & {
	pageCount: number
	blockCount: number
	speakers: Array<string>
	pages: Array<TranscriptPage>
}

export type TranscriptManifestEntry = TranscriptMetadata & {
	pageCount: number
	blockCount: number
	characterCount: number
	speakers: Array<string>
}

export type TranscriptManifest = {
	generatedAt: string
	transcriptCount: number
	pageCount: number
	blockCount: number
	speakerCount: number
	sections: Array<{
		name: string
		days: Array<number>
	}>
	transcripts: Array<TranscriptManifestEntry>
}

export type IngestWarning = {
	day: number
	filename: string
	reason: string
}

export type IngestResult = {
	document: TranscriptDocument | null
	characterCount: number
	warnings: Array<IngestWarning>
	error?: string
}

export type PageLine = {
	text: string
	y: number
	page: number
}
