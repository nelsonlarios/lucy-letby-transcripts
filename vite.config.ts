import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { createReadStream, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function serveOriginalPdfs(): Plugin {
	const directory = resolve('transcripts')

	return {
		name: 'serve-original-pdfs',
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				if (!request.url?.startsWith('/originals/')) {
					next()
					return
				}

				const name = decodeURIComponent(
					request.url.slice('/originals/'.length).split('?')[0] ?? '',
				)
				const file = resolve(directory, name)

				if (!file.startsWith(directory) || !existsSync(file)) {
					response.statusCode = 404
					response.end('Not found')
					return
				}

				response.setHeader('Content-Type', 'application/pdf')
				createReadStream(file).pipe(response)
			})
		},
	}
}

export default defineConfig({
	plugins: [
		react(),
		serveOriginalPdfs(),
		viteStaticCopy({
			targets: [
				{
					src: 'transcripts/*.pdf',
					dest: 'originals',
					rename: { stripBase: true },
				},
			],
		}),
	],
	server: {
		port: 5173,
	},
	preview: {
		port: 4173,
	},
	build: {
		sourcemap: true,
		target: 'es2022',
	},
})
