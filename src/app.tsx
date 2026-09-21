import { createBrowserRouter, RouterProvider } from 'react-router'
import { MantineProvider } from '@mantine/core'
import { theme } from './theme'
import { PrefsProvider, usePrefs } from './lib/prefs'
import { isDarkTheme } from './lib/storage'
import { RootLayout } from './routes/RootLayout'
import { HomePage } from './routes/HomePage'
import { SearchPage } from './routes/SearchPage'
import { BrowsePage } from './routes/BrowsePage'
import { BookmarksPage } from './routes/BookmarksPage'
import { TranscriptPage } from './routes/TranscriptPage'
import { NotFoundPage } from './routes/NotFoundPage'

const router = createBrowserRouter([
	{
		path: '/',
		element: <RootLayout />,
		children: [
			{ index: true, element: <HomePage /> },
			{ path: 'search', element: <SearchPage /> },
			{ path: 'browse', element: <BrowsePage /> },
			{ path: 'bookmarks', element: <BookmarksPage /> },
		],
	},
	{ path: '/transcripts/:day', element: <TranscriptPage /> },
	{ path: '*', element: <NotFoundPage /> },
])

function ThemedApp() {
	const { prefs } = usePrefs()

	return (
		<MantineProvider
			theme={theme}
			forceColorScheme={isDarkTheme(prefs.theme) ? 'dark' : 'light'}
		>
			<RouterProvider router={router} />
		</MantineProvider>
	)
}

export function App() {
	return (
		<PrefsProvider>
			<ThemedApp />
		</PrefsProvider>
	)
}
