import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import './styles/global.css'
import './styles/reader.css'
import { App } from './app'

const root = document.getElementById('root')

if (!root) {
	throw new Error('Root element missing')
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
