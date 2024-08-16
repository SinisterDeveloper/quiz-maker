module.exports = {
	name: 'login',

	/**
	 * Admin login endpoint
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async get(App, req, res) {
		process.env.PASSWORD === req.get('Authorization') ?
			res.json({ token: App.admin })
		:	res.sendStatus(401);
	},
};
