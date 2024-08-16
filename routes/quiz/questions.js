const { updatePlayer } = require('../../modules/Util');

module.exports = {
	name: 'questions',

	/**
	 * Fetches questions for initialising the quiz
	 * or
	 * Fetches a user's saved option for a particular question
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async get(App, req, res) {
		const token = req.get('Authorization')?.split(' ')[1];
		if (!token || !App.players.has(token)) res.sendStatus(401);

		if (req.query.question) {
			const data = App.players
				.get(token)
				.savedOptions.get(req.query.question);
			await res.json(data ? data : '');
		} else {
			const deck = App.players.get(token).deck;
			const questionsData = deck.questions;
			let questions = [];

			for (const questionData of questionsData) {
				questions.push({
					question: questionData.question,
					id: questionData.id,
					options: questionData.options,
				});
			}

			await res.json(questions);
		}
	},

	async put(App, req, res) {
		const token = req.get('Authorization')?.split(' ')[1];
		if (!token || !App.players.has(token)) res.sendStatus(401);

		updatePlayer(App, token, [
			{
				name: 'savedOptions',
				value: App.players
					.get(token)
					.savedOptions.set(req.body.id, req.body.option),
			},
		]);

		res.sendStatus(200);
	}
};
