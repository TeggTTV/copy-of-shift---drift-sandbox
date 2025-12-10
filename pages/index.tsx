import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import App with SSR disabled because it uses window/document
const App = dynamic(() => import('../App'), { ssr: false });

export default function Home() {
	return <App />;
}
