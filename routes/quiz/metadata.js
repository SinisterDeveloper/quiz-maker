const { updatePlayer } = require('../../modules/Util');
const fs = require('fs');
const path = require('path');

module.exports = {
	name: 'metadata',

	/**
	 * Fetches metadata required for quiz initialisation
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<*>}
	 */
	async get(App, req, res) {
		let image;
		if (!req.query.deck || !App.decks.has(req.query.deck))
			return res.sendStatus(400);
		const deck = App.decks.get(req.query.deck);
		fs.readFile(
			path.join(
				__dirname,
				'..',
				'..',
				'public',
				'img',
				`BG_${deck.id}.jpeg`,
			),
			(err, data) => {
				image = err ? 'default' : 'custom';
				res.json({
					name: deck.name,
					email: deck.email,
					background: image,
				});
			},
		);
	},

	/**
	 * POST request to submit the fetched player metadata
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<*>}
	 */
	async post(App, req, res) {
		let data = req.body;
		const token = req.get('Authorization')?.split(' ')[1];
		if (!token) res.sendStatus(401);
		const name = data.name;
		const email = data.email;

		updatePlayer(App, token, [
			{ name: 'name', value: name },
			{ name: 'email', value: email },
		]);

		return await res.sendStatus(200);
	},
};
