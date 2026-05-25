import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	base: '/webpages/',
	build: {
		outDir: '../public/webpages',
		emptyOutDir: true,
	},
});
