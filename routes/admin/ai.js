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
		if (!process.env.CLOUDFARE_API_KEY || !process.env.CLOUDFARE_USER_ID)
			return res.sendStatus(401);

		const { question } = req.body;
		const model = '@cf/google/gemma-2b-it-lora';
		const requestMessage = `Question: '${question}'`;
		const body = {
			messages: [
				{
					role: 'system',
					content:
						'You are an assistant who answers fact-based questions and responds accurately to the question the user asks',
				},
				{
					role: 'assistant',
					content:
						"Return only a JSON array containing 4 string elements. One element should be the correct answer to the question I provide, and the other three should be incorrect yet plausible and popularly known options that could trick someone into picking the wrong answer. The array should be in this format: ['correct answer', 'very close yet wrong answer 1', 'close yet wrong answer 2', 'wrong answer 3']. Whatever you respond to the user must only be in the form of a JSON array containing 4 string elements.  Do not include any other text or explanation, only the JSON array and definitely not as an object. Nothing else",
				},
				{
					role: 'user',
					content: requestMessage,
				},
			],
		};

		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFARE_USER_ID}/ai/run/${model}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${process.env.CLOUDFARE_API_KEY}`,
				},
				body: JSON.stringify(body),
			},
		);
		const content = await response.json();
		if (!response.ok) {
			res.status(400).send(content.errors[0].message);
		} else {
			let choices;
			try {
				choices = JSON.parse(
					content['result']['response'].replaceAll(`'`, `"`),
				);
			} catch (e) {
				return this.post(App, req, res);
			}

			/**
			 * 	Despite best efforts, sometimes the AI responses are of the format
			 * [{
			 *   'correct answer': '',
			 *   'very close yet wrong answer 1': '',
			 *   'close yet wrong answer 2': '',
			 *   'wrong answer 3': ''
			 *  }]
			 *  or
			 *  {
			 *   'correct answer': '',
			 *   'very close yet wrong answer 1': '',
			 *   'close yet wrong answer 2': '',
			 *   'wrong answer 3': ''
			 *  }
			 */

			if (!Array.isArray(choices)) {
				choices = [
					`${choices['correct answer']}`,
					`${choices['very close yet wrong answer 1']}`,
					`${choices['close yet wrong answer 2']}`,
					`${choices['wrong answer 3']}`,
				];
			}
			if (choices.length === 1) {
				if (typeof choices[0] === 'string')
					choices = choices[0].replaceAll(' ', '').split(',');
				else
					choices = [
						choices[0]['correct answer'],
						choices[0]['very close yet wrong answer 1'],
						choices[0]['close yet wrong answer 2'],
						choices[0]['wrong answer 3'],
					];
			}
			let size = choices.length;
			if (size !== 4 || choices[0] === undefined)
				return await this.post(App, req, res);
			for (let i = 0; i < size; i++) {
				let number = Math.floor(Math.random() * size);
				let temp = choices[i].trim();
				choices[i] = choices[number].trim();
				choices[number] = temp;
			}
			res.json(choices);
		}
	},
};
