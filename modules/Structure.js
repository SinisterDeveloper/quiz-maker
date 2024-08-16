const DeckSchema = require('./DeckSchema');
const { err, success } = require('./Util');

class Question {
	constructor(obj) {
		this.id = obj.id;
		this.question = obj.question;
		this.options = obj.options;
		this.answer = obj.answer;
		this.deck = obj.deck;
		this.points = obj.points;
		this.timestamp = obj.timestamp || Date.now();
	}

	async update(data) {
		try {
			const question = new Question(data);
			await this.delete(true);
			await question.create(true);
			success(
				`Question with id: "${this.id}" in Deck: "${this.deck}" successfully edited.`,
			);
			return {
				success: true,
				question: question,
			};
		} catch (e) {
			err(`${e}`);
			return {
				status: false,
				error: `${e}`,
			};
		}
	}

	async delete(self = false) {
		try {
			const deck = await DeckSchema.findOne({ id: this.deck });
			deck.questions.pull({ id: this.id });

			await deck.save();
			if (!self)
				success(
					`Question with id: "${this.id}" successfully deleted from Deck: "${this.deck}"`,
				);

			return {
				success: true,
				deck: deck,
			};
		} catch (e) {
			err(`${e}`);
			return {
				error: `${e}`,
			};
		}
	}

	async create(self = false) {
		try {
			const deck = await DeckSchema.findOne({ id: this.deck });
			deck.questions.push({
				id: this.id,
				question: this.question,
				options: this.options,
				answer: this.answer,
				deck: this.deck,
				points: this.points,
				timestamp: this.timestamp,
			});
			deck.questions.sort((a, b) => a.timestamp - b.timestamp);
			await deck.save();
			if (!self)
				success(
					`Question with id: "${this.id}" successfully created in Deck: "${this.deck}"`,
				);

			return {
				success: true,
				deck: deck,
			};
		} catch (e) {
			err(`${e}`);
			return {
				status: false,
				error: `${e}`,
			};
		}
	}
}

class Deck {
	constructor(obj, parsed = false) {
		this.id = obj.id;
		this.name = obj.name;
		this.shuffle = obj.shuffle;
		this.conclusion = obj.conclusion || '';
		this.timer = obj.timer;
		this.email = obj.email;
		this.questions =
			parsed ? this.convertMapToObj(obj.questions) : new Map();
	}

	async create() {
		try {
			const deck = new DeckSchema({
				id: this.id,
				name: this.name,
				shuffle: this.shuffle,
				email: this.email,
				questions: [],
				conclusion: this.conclusion,
				timer: this.timer,
			});

			await deck.save();
			success(
				`Deck with id: "${this.id}" and name "${this.name}" successfully created!`,
			);

			return {
				success: true,
				deck: deck,
			};
		} catch (e) {
			err(`${e}`);
			return {
				status: false,
				error: `${e}`,
			};
		}
	}

	async delete() {
		try {
			let DeckObject = await DeckSchema.findOneAndDelete({ id: this.id });
			success(
				`Deck with id: "${this.id}" and name "${this.name}" successfully deleted!`,
			);
			return DeckObject;
		} catch (e) {
			err(`${e}`);
		}
	}

	/**
	 * Adds question to Deck in memory without creating one in the database
	 *
	 * @param question
	 */
	addQuestion(question) {
		this.questions.set(question.id, question);
	}

	initialise(shuffle = false) {
		let questions = [];

		this.questions.forEach((q, i) => {
			questions.push(q);
		});

		questions.sort((a, b) => a.timestamp - b.timestamp);
		if (shuffle) {
			let size = this.getQuestionCount();
			for (let i = 0; i < size; i++) {
				let number = Math.floor(Math.random() * size);
				let temp = questions[i];
				questions[i] = questions[number];
				questions[number] = temp;
			}
		}
		return questions;
	}

	convertMapToObj(map) {
		const obj = {};
		for (const [key, value] of map.entries()) {
			obj[key] = value;
		}

		return obj;
	}

	getQuestionCount() {
		return this.questions.size || this.initialise().length;
	}
}

module.exports = { Deck, Question };
