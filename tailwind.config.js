/** @type {import('tailwindcss').Config} */

module.exports = {
	content: [
		'./public/webpages/*.{html,js}',
		'./public/js/*.{html,js}',
		'./frontend/index.html',
		'./frontend/src/**/*.{js,jsx,ts,tsx}',
	],
	theme: {
		extend: {},
	},
	plugins: [],
};
