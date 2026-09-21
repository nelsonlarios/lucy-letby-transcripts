import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { DocumentTitle } from '../components/DocumentTitle'
import { SearchForm } from '../components/SearchForm'
import { searchResultPath } from '../parser/ids'
import { formatDayLabel, formatLongDate } from '../lib/dates'
import { searchTranscripts, type SearchHit } from '../lib/pagefind'
import { loadManifest } from '../lib/api'

export function SearchPage() {
	const [params, setParams] = useSearchParams()
	const query = params.get('q') ?? ''
	const section = params.get('section') ?? ''
	const [input, setInput] = useState(query)
	const [results, setResults] = useState<Array<SearchHit>>([])
	const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
	const [error, setError] = useState<string | null>(null)
	const [sections, setSections] = useState<Array<string>>([])

	useEffect(() => {
		setInput(query)
	}, [query])

	useEffect(() => {
		loadManifest()
			.then((manifest) =>
				setSections(manifest.sections.map((entry) => entry.name)),
			)
			.catch(() => {
				setSections([])
			})
	}, [])

	useEffect(() => {
		const trimmed = query.trim()

		if (!trimmed) {
			setResults([])
			setStatus('idle')
			return
		}

		const controller = window.setTimeout(() => {
			setStatus('loading')
			searchTranscripts(trimmed, section || undefined)
				.then((hits) => {
					setResults(hits)
					setStatus('idle')
					setError(null)
				})
				.catch((caught: unknown) => {
					setStatus('error')
					setError(
						caught instanceof Error
							? caught.message
							: 'Search is currently unavailable.',
					)
				})
		}, 120)

		return () => window.clearTimeout(controller)
	}, [query, section])

	const title = useMemo(
		() => (query ? `${query} · Search` : 'Search transcripts'),
		[query],
	)

	return (
		<main className="page search-page" id="content">
			<DocumentTitle title={title} />
			<p className="kicker">Search</p>
			<h1 className="index-heading">Search the transcripts</h1>
			<SearchForm
				value={input}
				autoFocus
				variant="page"
				placeholder="Words, names, or a quoted phrase"
				onChange={(value) => {
					setInput(value)
					const next = new URLSearchParams(params)
					if (value.trim()) {
						next.set('q', value)
					} else {
						next.delete('q')
					}
					setParams(next, { replace: true })
				}}
			/>
			<div className="jump-day">
				<label htmlFor="section-filter">Section</label>
				<select
					id="section-filter"
					value={section}
					onChange={(event) => {
						const next = new URLSearchParams(params)
						if (event.target.value) {
							next.set('section', event.target.value)
						} else {
							next.delete('section')
						}
						setParams(next, { replace: true })
					}}
				>
					<option value="">All sections</option>
					{sections.map((name) => (
						<option key={name} value={name}>
							{name}
						</option>
					))}
				</select>
			</div>

			{status === 'loading' ? <p className="muted">Searching…</p> : null}
			{error ? <p className="empty">{error}</p> : null}
			{query.trim() && status !== 'loading' && results.length === 0 && !error ? (
				<p className="empty">No passages matched “{query.trim()}”.</p>
			) : null}
			{results.length > 0 ? (
				<p className="muted">
					{results.length === 80
						? 'Showing the first 80 matching pages'
						: `${results.length} matching pages`}
				</p>
			) : null}

			{results.map((result, index) => (
				<Link
					key={`${result.url}-${index}`}
					className="search-result"
					to={searchResultPath(result.day, result.page, query.trim())}
				>
					<div className="search-result__meta">
						<span>{formatDayLabel(result.day)}</span>
						{result.date ? <span>{formatLongDate(result.date)}</span> : null}
						<span>Source page {result.page}</span>
					</div>
					<h2 className="search-result__title">{result.title}</h2>
					<p
						className="search-result__excerpt"
						dangerouslySetInnerHTML={{ __html: result.excerpt }}
					/>
				</Link>
			))}
		</main>
	)
}
