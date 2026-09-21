import { Link } from 'react-router'
import { AppHeader } from '../components/AppHeader'
import { DocumentTitle } from '../components/DocumentTitle'

export function NotFoundPage() {
	return (
		<>
			<AppHeader />
			<main className="page" id="content">
				<DocumentTitle title="Not found · Transcripts" />
				<p className="kicker">Not found</p>
				<h1 className="index-heading">This page is not in the archive</h1>
				<p>
					<Link to="/">Return home</Link>
				</p>
			</main>
		</>
	)
}

