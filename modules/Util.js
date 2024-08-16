const chalk = require('chalk');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const log = console.log;

function updatePlayer(App, token, items) {
	const players = new Map(App.players);

	for (const item of items) {
		const { name, value } = item;
		if (players.has(token) && players.get(token).hasOwnProperty(name))
			players.get(token)[name] = value;
	}

	App.players = players;
}

function authenticateEndpoint(App, req, ignoreEndpoints) {
	if (!ignoreEndpoints.includes(req.path))
		return !(
			!req.get('Authorization') ||
			!App.players.has(req.get('Authorization').split(' ')[1])
		);
	else return true;
}

function authenticateAdmin(req, ignoreRoutes) {
	if (!ignoreRoutes.includes(req.path))
		return !(
			!req.get('Authorization') ||
			!(process.env.ADMIN === req.get('Authorization').split(' ')[1])
		);
	else return true;
}

const rateLimiter = new RateLimiterMemory({
	points: process.env.MAX_REQUESTS_PER_SECOND || 4,
	duration: 1,
});

const rateLimiterMiddleware = (req, res, next) => {
	// if (!req.get('Authorization')) return next();
	const token = req.get('Authorization')?.split(' ')[1] || req.ip;
	rateLimiter
		.consume(token, 1)
		.then(() => {
			next();
		})
		.catch(() => {
			res.status(429).send('Too Many Requests');
		});
};

module.exports = {
	updatePlayer,
	authenticateEndpoint,
	authenticateAdmin,
	rateLimiterMiddleware,
	err(text) {
		log(chalk.italic.bold.redBright(text + '\n'));
	},

	success(text) {
		log(chalk.italic.bold.greenBright(text + '\n'));
	},

	misc(text) {
		log(chalk.italic.bold.cyanBright(text + '\n'));
	},

	caution(text) {
		log(chalk.italic.bold.yellowBright(text + '\n'));
	},

	blue(text) {
		log(chalk.italic.bold.blueBright(text + '\n'));
	},
};
