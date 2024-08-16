const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const fsProm = fs.promises;
const compression = require('compression');
const App = express();
require('dotenv').config();
const mongoose = require('mongoose');
const { Deck, Question } = require('./modules/Structure');
const { err, success, misc, blue, caution } = require('./modules/Util');
const DeckSchema = require('./modules/DeckSchema');
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 10 });
const {
	authenticateEndpoint,
	authenticateAdmin,
	rateLimiterMiddleware,
} = require('./modules/Util');

const adminRoutes = fs
	.readdirSync('./routes/admin')
	.filter((file) => file.endsWith('.js'));
const quizRoutes = fs
	.readdirSync('./routes/quiz')
	.filter((file) => file.endsWith('.js'));

App.use(express.static(path.join(__dirname, 'public')));
App.use(express.json());
App.use(compression());
App.use(fileUpload());
App.disable('x-powered-by');
App.use(rateLimiterMiddleware);

App.decks = new Map();
App.players = new Map();
App.admin = uid.rnd();
process.env.ADMIN = App.admin;

const pages = ['', 'home', 'quiz', 'result', 'dashboard'];

// -----------------CONNECTION-----------------------------------------------------

async function connect() {
	blue(
		'------------------ QUIZ-MAKER | VERSION: MONGODB ------------------------------------------------',
	);
	await mongoose
		.connect(process.env.MONGO_URI, {
			dbName: 'quiz-maker',
		})
		.then(() => success('Established connection with Database'))
		.catch((error) => err(error));

	await fetchDecks();

	await handleRoutes();

	App.listen(process.env.PORT, () => {
		misc(
			`Admin Dashboard running on http://localhost:${process.env.PORT}/dashboard`,
		);
	});
}

// ------------------DECKS/QUESTIONS-------------------------------------------------

const fetchDecks = async () => {
	try {
		const decks = await DeckSchema.find().lean();

		decks.forEach((deckobj) => {
			const deck = new Deck(deckobj);
			App.decks.set(deck.id, deck);

			deckobj.questions.forEach((questionobj) => {
				let question = new Question(questionobj);
				deck.addQuestion(question);
			});
		});

		success('Data successfully fetched from Database');
	} catch (error) {
		console.error(error);
		err(error);
	}
};

// ------------WEBPAGE-HANDLER----------------------------------------------------------------

for (const page of pages)
	App.get(`/${page}`, (req, res) => {
			const userAgent = req.headers['user-agent'];

			const isMobile = /Mobi|iPad|Tablet|Android/i.test(userAgent);
			if (isMobile && page === ('dashboard' || '')) return res.send('Dashboard can only be accessed via Laptop/PC');
			res.sendFile(
				path.join(
					__dirname,
					'public',
					'webpages',
					`${page || 'dashboard'}.html`,
				),
			);
	}
	);

// ------------- ROUTES-HANDLER---------------------------------------------------------------

const routePaths = {
	adminRoutes: 'admin',
	quizRoutes: 'quiz',
};

const routeRegistry = new Map();

async function loadEndpoint(routePath, fileName) {
	const endpointPath = path.join(__dirname, 'routes', routePath, fileName);
	return require(endpointPath);
}

async function registerRoute(App, basePath, methods) {
	const [fileName] = basePath.split('/').slice(-1);
	const endpoint = await loadEndpoint(
		basePath.split('/').slice(1, -1).join('/'),
		`${fileName}.js`,
	);

	methods.forEach((method) => {
		if (endpoint[method]) {
			App[method](basePath, async (req, res) => {
				try {
					if (
						basePath.startsWith('/admin') &&
						!authenticateAdmin(req, ['/admin/login'])
					) {
						return res.sendStatus(401);
					}
					await endpoint[method](App, req, res);
				} catch (error) {
					err(`Error handling route: ${error}`);
					res.sendStatus(500);
				}
			});
			routeRegistry.set(
				`${basePath}_${method.toLowerCase()}`,
				endpoint[method],
			);
		}
	});
}

async function handleRequest(req, res) {
	const { method, originalUrl } = req;
	const handler = routeRegistry.get(`${originalUrl}_${method.toLowerCase()}`);

	if (handler) {
		try {
			if (
				originalUrl.startsWith('/admin') &&
				!authenticateAdmin(req, ['/admin/login'])
			) {
				return res.sendStatus(401);
			}
			await handler(req, res);
		} catch (error) {
			err(`Error handling route: ${error}`);
			res.sendStatus(500);
		}
	} else {
		caution(
			`Request sent from IP: ${req.ip} for invalid method  ${method}: ${originalUrl}`,
		);
		res.sendStatus(404);
	}
}

async function handleRoutes() {
	const methods = ['get', 'post', 'put', 'delete'];
	const routeDirs = [adminRoutes, quizRoutes];

	for (const dir of routeDirs) {
		const routePath =
			routePaths[dir === adminRoutes ? 'adminRoutes' : 'quizRoutes'];
		const fileNames = await fsProm.readdir(
			path.join(__dirname, 'routes', routePath),
		);

		for (const fileName of fileNames) {
			if (fileName.endsWith('.js')) {
				const basePath = `/${routePath}/${path.basename(fileName, '.js')}`;
				await registerRoute(App, basePath, methods);
			}
		}
	}
	App.use(handleRequest);
	success('Registered all Routes');
}

// ---------------------------------------------------------------------------------------------

connect().catch((e) => err(e));

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection: ', error);
});

