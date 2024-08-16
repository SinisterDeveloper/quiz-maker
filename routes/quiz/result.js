const ResultSchema = require('../../modules/ResultSchema');
const { misc } = require('../../modules/Util');

async function save(App, data) {
	data.conclusion = App.decks.get(data.deck).conclusion;
	data.answers = App.players.get(data.id).savedOptions;
	const Result = new ResultSchema(data);

	await Result.save();
	App.players.delete(data.id);
	misc(`Player with id: ${data.id} has completed the quiz!`);
}

module.exports = {
	name: 'result',
	/**
	 * GET request to fetch a result, or to create a new one if it doesn't exist
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<*>}
	 */
	async get(App, req, res) {
		const player = req.query['player'];
		let response = {};
		let userAnswers;

		if (App.players.has(player)) {
			const currentPlayer = App.players.get(player);
			response.stats = {
				id: player,
				name: currentPlayer.name || '',
				email: currentPlayer.email || '',
				timeStarted: currentPlayer.timeStarted,
				timeEnded: currentPlayer.timeEnded,
				score: currentPlayer.score,
				deck: currentPlayer.deck.id,
			};
			userAnswers = currentPlayer.savedOptions;
		} else {
			let result = await ResultSchema.findOne({ id: player });
			if (result) {
				const { answers, ...res } = result.toObject();
				response.stats = res;
				userAnswers = answers;
			} else return res.sendStatus(404);
		}
		let answers = [];

		let deck = App.decks.get(response.stats.deck);
		let questions = deck.initialise();
		response.stats.conclusion = deck.conclusion || '';

		for (const question of questions) {
			if (!userAnswers.has(question.id))
				answers.push({
					question: question.question,
					correctAnswer: question.answer,
					userAnswer: '',
					pointsAwarded: 0,
				});
			else if (userAnswers.get(question.id) === question.answer)
				answers.push({
					question: question.question,
					correctAnswer: question.answer,
					userAnswer: question.answer,
					pointsAwarded: question.points,
				});
			else
				answers.push({
					question: question.question,
					correctAnswer: question.answer,
					userAnswer: userAnswers.get(question.id),
					pointsAwarded: 0,
				});
		}
		response.answers = answers;

		await res.json(response);

		if (App.players.has(player)) await save(App, response.stats);
	},
};
