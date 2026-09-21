import { useNavigate } from 'react-router'
import { useEffect, type FormEvent } from 'react'
import { SearchIcon } from './Icons'

type SearchFormProps = {
	id?: string
	value: string
	label?: string
	placeholder?: string
	autoFocus?: boolean
	variant?: 'header' | 'hero' | 'page'
	onChange: (value: string) => void
	onSubmit?: (value: string) => void
}

export function SearchForm({
	id = 'transcript-search',
	value,
	label = 'Search transcripts',
	placeholder = 'Search transcripts',
	autoFocus = false,
	variant = 'page',
	onChange,
	onSubmit,
}: SearchFormProps) {
	const navigate = useNavigate()

	useEffect(() => {
		if (!autoFocus) {
			return
		}

		document.getElementById(id)?.focus()
	}, [autoFocus, id])

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const query = value.trim()

		if (onSubmit) {
			onSubmit(query)
			return
		}

		if (!query) {
			navigate('/search')
			return
		}

		navigate(`/search?q=${encodeURIComponent(query)}`)
	}

	return (
		<form className={`search-form search-form--${variant}`} onSubmit={handleSubmit}>
			<label className="visually-hidden" htmlFor={id}>
				{label}
			</label>
			<div className={`search-field search-field--${variant}`}>
				<SearchIcon />
				<input
					id={id}
					type="search"
					value={value}
					placeholder={placeholder}
					autoComplete="off"
					enterKeyHint="search"
					onChange={(event) => onChange(event.target.value)}
				/>
			</div>
		</form>
	)
}
