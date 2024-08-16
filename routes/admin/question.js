const { Question, Deck } = require('../../modules/Structure');
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 5 });

module.exports = {
	name: 'question',

	/**
	 * PUT request to edit a question
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<*>}
	 */
	async put(App, req, res) {
		const data = req.body;
		let status;
		if (!parseInt(data.points))
			return res.json({
				success: false,
				errorMessage:
					'Enter an integer value for the "Points/Marks Value" field!',
			});

		if (!App.decks.has(data.deck))
			return res.json({
				success: false,
				errorMessage:
					'Unable to fetch the Deck - Possible Solution: Relogin/Reload',
			});

		const question = App.decks.get(data.deck).questions.get(data.id);
		const body = {
			id: data.id,
			question: data.question,
			options: [data.option1, data.option2, data.option3, data.option4],
			answer: data.answer,
			points: parseInt(data.points),
			deck: data.deck,
			timestamp: data.timestamp,
		};
		status = await question.update(body);

		if (!status.success)
			return res.json({
				success: false,
				errorMessage: status.error,
			});

		App.decks.get(data.deck).questions.set(data.id, status.question);

		res.json({
			success: true,
		});
	},

	/**
	 * POST request to create a question
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

		if (!parseInt(data.points))
			return res.json({
				success: false,
				errorMessage:
					'Enter an integer value for the "Points/Marks Value" field!',
			});

		if (!App.decks.get(data.deck))
			return res.json({
				success: false,
				errorMessage:
					'Unable to fetch the Deck - Possible Solution: Relogin/Reload',
			});

		const question = new Question({
			id: id,
			question: data.question,
			options: [data.option1, data.option2, data.option3, data.option4],
			answer: data.answer,
			points: parseInt(data.points),
			deck: data.deck,
		});

		status = await question.create();

		App.decks.get(data.deck).questions.set(id, question);

		if (!status.success)
			return res.json({
				success: false,
				errorMessage: status.error,
			});

		res.json({
			success: true,
		});
	},

	/**
	 * DELETE request to delete a question
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async delete(App, req, res) {
		const data = req.body;
		await App.decks.get(data.deck).questions.get(data.question).delete();
		App.decks.get(data.deck).questions.delete(data.question);
		res.sendStatus(200);
	},
};
