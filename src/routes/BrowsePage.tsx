import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { DocumentTitle } from '../components/DocumentTitle'
import { TrialIndex } from '../components/TrialIndex'
import { loadManifest } from '../lib/api'
import type { TranscriptManifest } from '../parser/types'

export function BrowsePage() {
	const location = useLocation()
	const [manifest, setManifest] = useState<TranscriptManifest | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadManifest()
			.then(setManifest)
			.catch((caught: unknown) => {
				setError(
					caught instanceof Error
						? caught.message
						: 'The transcript index could not be loaded.',
				)
			})
	}, [])

	useEffect(() => {
		if (!manifest || !location.hash) {
			return
		}

		const id = location.hash.slice(1)
		window.document.getElementById(id)?.scrollIntoView({ block: 'start' })
	}, [manifest, location.hash])

	return (
		<main className="page" id="content">
			<DocumentTitle title="Browse the trial · Transcripts" />
			<p className="kicker">The trial</p>
			<h1 className="index-heading">Browse by sitting day</h1>
			{error ? <p className="empty">{error}</p> : null}
			{manifest ? <TrialIndex manifest={manifest} /> : null}
		</main>
	)
}
