const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env['GEMINI_API_KEY'];
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
	model: 'gemini-2.0-flash',
	systemInstruction:
		"Given a question string, return:\n'correct_ans': Correct answer\n'very_close_wrong': Wrong answer but very close, tricky\n'close_wrong': Wrong answer but close\n'wrong_ans': Wrong Answer",
});

const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 40,
	maxOutputTokens: 8192,
	responseMimeType: 'application/json',
	responseSchema: {
		type: 'object',
		properties: {
			correct_ans: {
				type: 'string',
			},
			very_close_wrong: {
				type: 'string',
			},
			close_wrong: {
				type: 'string',
			},
			wrong: {
				type: 'string',
			},
		},
		required: ['correct_ans', 'very_close_wrong', 'close_wrong', 'wrong'],
	},
};

module.exports = {
	name: 'ai',

	/**
	 *
	 * AI Autofill for Question Uploads
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async post(App, req, res) {

		const chatSession = model.startChat({
			generationConfig,
			history: [],
		});

		const { question } = req.body;
		const requestMessage = `Question: '${question}'`;

		const { response } = await chatSession.sendMessage(requestMessage);
		const content = JSON.parse(response.text());
		console.log(content);
		let choices = [];
		for (const field in content) choices.push(content[field].replaceAll('"', ''));

		// Randomise the order of choices
		for (let i = 0; i < choices.length; i++) {
			let number = Math.floor(Math.random() * choices.length);
			let temp = choices[i].trim();
			choices[i] = choices[number].trim();
			choices[number] = temp;
		}
		res.json(choices);
	},
};
