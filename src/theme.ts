import { createTheme } from '@mantine/core'

const stone = [
	'#f7f3ee',
	'#ebe4db',
	'#d6cbbd',
	'#c0b09e',
	'#a89480',
	'#8d7c71',
	'#73645b',
	'#5b4f48',
	'#433b36',
	'#2b2623',
] as const

export const theme = createTheme({
	fontFamily:
		'"Source Sans 3 Variable", "Source Sans 3", "Segoe UI", sans-serif',
	headings: {
		fontFamily:
			'"Source Serif 4 Variable", "Source Serif 4", Georgia, serif',
		fontWeight: '600',
	},
	primaryColor: 'stone',
	colors: {
		stone,
	},
	defaultRadius: 0,
	cursorType: 'pointer',
	black: '#1c1916',
	white: '#fbfaf7',
	components: {
		Button: {
			defaultProps: {
				radius: 0,
			},
		},
		TextInput: {
			defaultProps: {
				radius: 0,
			},
		},
		Select: {
			defaultProps: {
				radius: 0,
			},
		},
		Drawer: {
			defaultProps: {
				radius: 0,
			},
		},
		Modal: {
			defaultProps: {
				radius: 0,
			},
		},
		Tooltip: {
			defaultProps: {
				withArrow: false,
				openDelay: 250,
			},
		},
	},
})
