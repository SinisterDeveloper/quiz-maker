const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 5 });
const { updatePlayer, err } = require('../../modules/Util');

module.exports = {
	name: 'update',

	/**
	 * Creates a new Player Instance for the server to work upon
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async post(App, req, res) {
		const token = uid.rnd();
		const { deck } = req.body;
		const deckData = App.decks.get(deck);

		App.players.set(token, {
			name: '',
			email: '',
			deck: {
				id: deck,
				questions:
					deckData.shuffle ?
						deckData.initialise(true)
					:	deckData.initialise(),
			},
			timeStarted: Date.now(),
			timeEnded: '',
			score: 0,
			savedOptions: new Map(),
		});

		await res.json({
			token: token,
			questionCount: deckData.getQuestionCount(),
			timer: deckData.timer,
		});

		setTimeout(async () => {
			if (App.players.has(token)) {
				await fetch(
					`${req.protocol}://${req.hostname}:${process.env.PORT}/quiz/update`,
					{
						method: 'DELETE',
						body: JSON.stringify({
							timeEnded: Date.now(),
							deckId: deck
						}),
						headers: {
							'Content-type': 'application/json; charset=UTF-8',
							Authorization: 'Bearer ' + token,
						},
					},
				);
				await fetch(
					`${req.protocol}://${req.hostname}:${process.env.PORT}/quiz/result?player=${token}`,
				)
			}
		}, (deckData.timer + 1) * 1000 * 60);
	},

	/**
	 * Deletes the Player instance on quiz completion and saves the score
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async delete(App, req, res) {
		const token = req.get('Authorization')?.split(' ')[1];
		if (!token || !App.players.has(token)) res.sendStatus(401);

		const { timeEnded, deckId } = req.body;

		const deck = App.decks.get(deckId).questions;
		const userAnswers = App.players.get(token).savedOptions;

		let score = 0;

		userAnswers.forEach((ans, id) => {
			const question = deck.get(id);
			score =
				question.answer === ans ? (score += question.points) : score;
		});

		updatePlayer(App, token, [
			{ name: 'timeEnded', value: timeEnded },
			{ name: 'score', value: score }
		]);
		res.sendStatus(200);
	},
};
