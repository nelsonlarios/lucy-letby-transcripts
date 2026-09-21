import { Slider } from '@mantine/core'
import type { ReaderPrefs, ReaderTheme } from '../lib/storage'

const THEMES: Array<{ id: ReaderTheme; label: string; swatch: string }> = [
	{ id: 'white', label: 'White', swatch: '#fcfcfb' },
	{ id: 'paper', label: 'Paper', swatch: '#f4efe6' },
	{ id: 'sepia', label: 'Sepia', swatch: '#e8dcc4' },
	{ id: 'grey', label: 'Grey', swatch: '#e6e4e1' },
	{ id: 'dark', label: 'Dark', swatch: '#1b1a18' },
]

export function ReaderSettings({
	prefs,
	onChange,
}: {
	prefs: ReaderPrefs
	onChange: (prefs: ReaderPrefs) => void
}) {
	return (
		<div className="settings-panel">
			<div className="settings-row">
				<span className="settings-legend">Typeface</span>
				<div className="theme-swatches">
					<FontButton
						label="Serif"
						pressed={prefs.font === 'serif'}
						onClick={() => onChange({ ...prefs, font: 'serif' })}
					/>
					<FontButton
						label="Sans"
						pressed={prefs.font === 'sans'}
						onClick={() => onChange({ ...prefs, font: 'sans' })}
					/>
				</div>
			</div>

			<SliderRow
				label="Size"
				value={prefs.fontSize}
				min={16}
				max={26}
				step={1}
				display={`${prefs.fontSize}px`}
				onChange={(fontSize) => onChange({ ...prefs, fontSize })}
			/>
			<SliderRow
				label="Line height"
				value={prefs.lineHeight}
				min={1.4}
				max={1.9}
				step={0.02}
				display={prefs.lineHeight.toFixed(2)}
				onChange={(lineHeight) => onChange({ ...prefs, lineHeight })}
			/>
			<SliderRow
				label="Measure"
				value={prefs.measure}
				min={48}
				max={76}
				step={1}
				display={`${prefs.measure}ch`}
				onChange={(measure) => onChange({ ...prefs, measure })}
			/>

			<div className="settings-row">
				<span className="settings-legend">Background</span>
				<div className="theme-swatches" role="group" aria-label="Reading background">
					{THEMES.map((theme) => (
						<button
							key={theme.id}
							type="button"
							className="theme-swatch"
							style={{ ['--swatch' as string]: theme.swatch }}
							aria-label={theme.label}
							aria-pressed={prefs.theme === theme.id}
							onClick={() => onChange({ ...prefs, theme: theme.id as ReaderTheme })}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

function FontButton({
	label,
	pressed,
	onClick,
}: {
	label: string
	pressed: boolean
	onClick: () => void
}) {
	return (
		<button
			type="button"
			className="ghost-button"
			aria-pressed={pressed}
			onClick={onClick}
		>
			{label}
		</button>
	)
}

function SliderRow({
	label,
	value,
	min,
	max,
	step,
	display,
	onChange,
}: {
	label: string
	value: number
	min: number
	max: number
	step: number
	display: string
	onChange: (value: number) => void
}) {
	return (
		<div className="settings-row">
			<label>
				<span>{label}</span>
				<span>{display}</span>
			</label>
			<Slider
				value={value}
				min={min}
				max={max}
				step={step}
				label={null}
				color="stone"
				onChange={onChange}
			/>
		</div>
	)
}
