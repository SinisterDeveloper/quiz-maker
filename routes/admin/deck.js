const { Deck } = require('../../modules/Structure');
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 5 });
const path = require('path');
const fs = require('fs');

module.exports = {
	name: 'deck',

	/**
	 * GET request to fetch Application's decks
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async get(App, req, res) {
		let decks = [];

		App.decks.forEach((deckobj) => {
			let deck = new Deck(deckobj, true);
			decks.push(deck);
		});
		await res.json(decks);
	},

	/**
	 *
	 * Uploads Background Image to Server Files
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async put(App, req, res) {
		if (!req.files || Object.keys(req.files).length === 0)
			return res.status(400).send('No files were uploaded.');

		let imageFile = req.files.image;
		// const ext = imageFile.mimetype.slice(6);

		let uploadDir = path.join(__dirname, '..', '..', 'public', 'img');
		let fileName = `BG_${req.query.deck}.jpeg`;

		await imageFile.mv(`${uploadDir}/${fileName}`, async function (err) {
			if (err) {
				console.log(err);
				return res.status(500);
			}
			res.json({ filename: fileName });
		});
	},

	/**
	 * Creates a Deck Instance
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<*>}
	 */
	async post(App, req, res) {
		const body = req.body;
		const data = body.data;
		const id = uid.rnd();
		let status;

		if (!parseInt(data.timer))
			return res.json({
				success: false,
				errorMessage:
					'Enter an integer value for the "Time Limit" field!',
			});

		if (data.name.length > 25) return res.json({
			success: false,
			errorMessage:
				'Deck name must contain less than 20 characters',
		});

		const deck = new Deck({
			id: id,
			name: data.name,
			shuffle: Boolean(data.shuffle),
			email: Boolean(data.email),
			conclusion: data.conclusion,
			timer: data.timer,
		});

		status = await deck.create();

		App.decks.set(id, deck);

		if (!status.success)
			return res.json({
				success: false,
				errorMessage: status.error,
			});

		res.json({
			success: true,
			deck: id,
		});
	},

	/**
	 * Deletes a Deck Instance
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async delete(App, req, res) {
		const data = req.body;

		await App.decks.get(data.value).delete();
		App.decks.delete(data.value);

		res.sendStatus(200);
		let bgFile = fs
			.readdirSync(path.join(__dirname, '..', '..', 'public', 'img'))
			.filter((file) => file.startsWith(`BG_${data.value}`))[0];
		if (bgFile)
			await fs.promises.rm(
				path.join(__dirname, '..', '..', 'public', 'img', bgFile),
			);
	},
};
