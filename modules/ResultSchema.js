const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
	id: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	email: { type: String },
	score: { type: Number, required: true },
	timeStarted: { type: String, required: true },
	timeEnded: { type: String, required: true },
	deck: { type: String, required: true },
	answers: { type: Map, required: true },
});

module.exports = mongoose.model('Result', ResultSchema);
