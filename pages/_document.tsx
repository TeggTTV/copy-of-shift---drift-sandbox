import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<script src="https://cdn.tailwindcss.com"></script>
				<link rel="stylesheet" href="/pixel-ui.css" />
				<style>{`
					body {
						margin: 0;
						overflow: hidden;
						background-color: #1a1a1a;
					}
					canvas {
						display: block;
					}
				`}</style>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
