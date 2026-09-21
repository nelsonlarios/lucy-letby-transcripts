export function formatLongDate(isoDate: string) {
	const [year, month, day] = isoDate.split('-').map(Number)

	if (!year || !month || !day) {
		return isoDate
	}

	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date(year, month - 1, day))
}

export function formatShortDate(isoDate: string) {
	const [year, month, day] = isoDate.split('-').map(Number)

	if (!year || !month || !day) {
		return isoDate
	}

	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(new Date(year, month - 1, day))
}

export function formatDayLabel(day: number) {
	return `Day ${day}`
}
