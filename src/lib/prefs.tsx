import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
	isDarkTheme,
	loadPrefs,
	savePrefs,
	type ReaderPrefs,
} from './storage'

type PrefsContextValue = {
	prefs: ReaderPrefs
	setPrefs: (prefs: ReaderPrefs) => void
}

const PrefsContext = createContext<PrefsContextValue | null>(null)

export function PrefsProvider({ children }: { children: ReactNode }) {
	const [prefs, setPrefsState] = useState<ReaderPrefs>(() => loadPrefs())

	useEffect(() => {
		document.documentElement.dataset.readerTheme = prefs.theme
		document.documentElement.dataset.mantineColorScheme = isDarkTheme(
			prefs.theme,
		)
			? 'dark'
			: 'light'
	}, [prefs])

	const value = useMemo(
		() => ({
			prefs,
			setPrefs(next: ReaderPrefs) {
				setPrefsState(next)
				savePrefs(next)
			},
		}),
		[prefs],
	)

	return (
		<PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
	)
}

export function usePrefs() {
	const value = useContext(PrefsContext)

	if (!value) {
		throw new Error('usePrefs must be used within PrefsProvider')
	}

	return value
}
