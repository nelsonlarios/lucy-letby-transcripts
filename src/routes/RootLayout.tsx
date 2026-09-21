import { Outlet } from 'react-router'
import { AppHeader } from '../components/AppHeader'

export function RootLayout() {
	return (
		<>
			<a className="skip-link" href="#content">
				Skip to content
			</a>
			<AppHeader />
			<Outlet />
		</>
	)
}
