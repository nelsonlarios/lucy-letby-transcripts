import { Link, useNavigate } from 'react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { DocumentTitle } from '../components/DocumentTitle'
import { SearchForm } from '../components/SearchForm'
import { loadManifest } from '../lib/api'
import { formatDayLabel, formatLongDate } from '../lib/dates'
import { findTranscript } from '../lib/navigation'
import { loadReadingPosition } from '../lib/storage'
import type { TranscriptManifest } from '../parser/types'

export function HomePage() {
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [day, setDay] = useState('')
	const [manifest, setManifest] = useState<TranscriptManifest | null>(null)
	const [error, setError] = useState<string | null>(null)
	const position = loadReadingPosition()
	const continueEntry =
		manifest && position ? findTranscript(manifest, position.day) : null

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

	function onJump(event: FormEvent) {
		event.preventDefault()
		const value = Number(day)

		if (!Number.isInteger(value) || value < 1) {
			return
		}

		navigate(`/transcripts/${value}`)
	}

	return (
		<main className="page" id="content">
			<DocumentTitle title="Lucy Letby Trial Transcripts" />
			<section className="home-hero">
				<p className="kicker">Manchester Crown Court · 2022–2023</p>
				<h1>Lucy Letby trial transcripts</h1>
				<p className="lede">
					A readable archive of the proceedings. Search the full text, or
					open any sitting day.
				</p>
				<SearchForm
					value={query}
					onChange={setQuery}
					autoFocus
					variant="hero"
					placeholder="Search the transcripts"
				/>
				{continueEntry ? (
					<Link
						className="continue-card"
						to={`/transcripts/${continueEntry.day}${position?.passageId ? `#${position.passageId}` : ''}`}
					>
						<span className="kicker">Continue reading</span>
						<strong>
							{formatDayLabel(continueEntry.day)} ·{' '}
							{formatLongDate(continueEntry.date)}
						</strong>
						<span>{continueEntry.title}</span>
					</Link>
				) : null}
			</section>

			{error ? <p className="empty">{error}</p> : null}

			{manifest ? (
				<div className="home-index">
					<aside>
						<h2 className="index-heading">Sections</h2>
						<nav className="section-nav" aria-label="Sections">
							{manifest.sections.map((section) => (
								<Link
									key={section.name}
									to={`/browse#section-${slug(section.name)}`}
								>
									<span>{section.name}</span>
									<span className="muted">{section.days.length}</span>
								</Link>
							))}
						</nav>
					</aside>
					<div>
						<h2 className="index-heading">The trial</h2>
						<p className="lede">
							{manifest.transcriptCount} sitting days, from{' '}
							{manifest.transcripts[0]
								? formatLongDate(manifest.transcripts[0].date)
								: ''}{' '}
							to{' '}
							{manifest.transcripts.at(-1)
								? formatLongDate(manifest.transcripts.at(-1)!.date)
								: ''}
							. Titles are those supplied with the published transcripts.
						</p>
						<p>
							<Link to="/browse">Browse every day</Link>
						</p>
						<form className="jump-day" onSubmit={onJump}>
							<label htmlFor="jump-day">Jump to day</label>
							<input
								id="jump-day"
								inputMode="numeric"
								value={day}
								onChange={(event) => setDay(event.target.value)}
							/>
							<button type="submit" className="ghost-button">
								Open
							</button>
						</form>
					</div>
				</div>
			) : null}
		</main>
	)
}

function slug(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}
