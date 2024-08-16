const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
	id: { type: Schema.Types.String, required: true },
	question: { type: String, required: true },
	options: { type: [String], required: true },
	answer: { type: String, required: true },
	deck: { type: Schema.Types.String, required: true },
	points: { type: Number, required: true },
	timestamp: { type: Schema.Types.Number, default: Date.now() },
});

const DeckSchema = new Schema({
	id: {
		type: Schema.Types.String,
		required: true,
		unique: true,
	},
	name: {
		type: Schema.Types.String,
		required: true,
		unique: true,
	},
	shuffle: {
		type: Boolean,
		required: true,
	},
	email: {
		type: Boolean,
		required: true,
	},
	questions: {
		type: [QuestionSchema],
		required: true,
	},
	conclusion: {
		type: Schema.Types.String,
		required: true,
	},
	timer: {
		type: Schema.Types.Number,
		required: true,
	},
});

module.exports = mongoose.model('Deck', DeckSchema);
