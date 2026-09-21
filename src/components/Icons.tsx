import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function icon(node: ReactNode) {
	return function Icon(props: IconProps) {
		return (
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				{...props}
			>
				{node}
			</svg>
		)
	}
}

export const SearchIcon = icon(
	<>
		<circle cx="11" cy="11" r="7" />
		<path d="M20 20l-3.2-3.2" />
	</>,
)

export const BookmarkIcon = icon(
	<path d="M7 4h10v16l-5-3.2L7 20V4z" />,
)

export const SettingsIcon = icon(
	<>
		<circle cx="12" cy="12" r="3" />
		<path d="M12 3v2.1M12 18.9V21M4.9 6.3l1.5 1.5M17.6 16.2l1.5 1.5M3 12h2.1M18.9 12H21M4.9 17.7l1.5-1.5M17.6 7.8l1.5-1.5" />
	</>,
)

export const PdfIcon = icon(
	<>
		<path d="M7 3h7l5 5v13H7z" />
		<path d="M14 3v5h5" />
	</>,
)

export const LinkIcon = icon(
	<>
		<path d="M10 13a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 0 0-7.1-7.1L10 5.9" />
		<path d="M14 11a5 5 0 0 0-7.1 0L5.5 12.4a5 5 0 0 0 7.1 7.1L14 18.1" />
	</>,
)

export const CopyIcon = icon(
	<>
		<rect x="8" y="8" width="12" height="12" />
		<path d="M4 16V4h12" />
	</>,
)

export const MenuIcon = icon(
	<>
		<path d="M4 7h16M4 12h16M4 17h16" />
	</>,
)

export const ListIcon = icon(
	<>
		<path d="M8 7h12M8 12h12M8 17h12" />
		<path d="M4 7h.01M4 12h.01M4 17h.01" />
	</>,
)

export const CloseIcon = icon(
	<path d="M6 6l12 12M18 6L6 18" />,
)

export const ChevronIcon = icon(
	<path d="M9 6l6 6-6 6" />,
)
