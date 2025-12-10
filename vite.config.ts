import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, '.', '');
	return {
		server: {
			port: 3000,
			host: '0.0.0.0',
			fs: {
				// Allow serving files from Prisma runtime
				allow: ['..'],
			},
		},
		plugins: [react()],
		define: {
			'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
			'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
			'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
			'process.env.NODE_ENV': JSON.stringify(mode),
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, '.'),
			},
		},
		optimizeDeps: {
			exclude: ['@prisma/client', 'prisma'],
		},
	};
});
