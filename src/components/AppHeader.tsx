import { NavLink, useLocation, useNavigate } from 'react-router'
import { useEffect } from 'react'
import { BookmarkIcon, ListIcon, MenuIcon, SearchIcon } from './Icons'

export function AppHeader({
	onOpenNav,
}: {
	onOpenNav?: () => void
}) {
	const location = useLocation()
	const navigate = useNavigate()
	const isReader = location.pathname.startsWith('/transcripts/')

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null
			const typing =
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				target?.isContentEditable

			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault()
				navigate('/search')
				window.setTimeout(() => {
					document.getElementById('transcript-search')?.focus()
				}, 0)
				return
			}

			if (event.key === '/' && !typing) {
				event.preventDefault()
				navigate('/search')
				window.setTimeout(() => {
					document.getElementById('transcript-search')?.focus()
				}, 0)
			}
		}

		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [navigate])

	return (
		<header className="site-header">
			<div className="header-start">
				{isReader && onOpenNav ? (
					<button
						type="button"
						className="icon-button nav-toggle"
						onClick={onOpenNav}
						aria-label="Open transcript list"
					>
						<MenuIcon />
					</button>
				) : null}
				<NavLink to="/" className="wordmark">
					<span className="wordmark__rule" />
					<span>
						<span className="wordmark__title">Transcripts</span>
						<span className="wordmark__sub">Lucy Letby trial</span>
					</span>
				</NavLink>
			</div>

			<nav className="header-nav" aria-label="Site">
				<NavLink
					to="/search"
					className="header-link"
					aria-label="Search"
				>
					<SearchIcon />
					<span>Search</span>
				</NavLink>
				<NavLink to="/browse" className="header-link">
					<ListIcon />
					<span>Browse</span>
				</NavLink>
				<NavLink to="/bookmarks" className="header-link" aria-label="Bookmarks">
					<BookmarkIcon />
					<span>Saved</span>
				</NavLink>
			</nav>
		</header>
	)
}
