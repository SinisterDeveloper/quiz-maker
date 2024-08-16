const ResultSchema = require('../../modules/ResultSchema');
const { success, err } = require('../../modules/Util');

module.exports = {
	name: 'result',

	/**
	 * GET request to fetch all results from database
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async get(App, req, res) {
		const results = await ResultSchema.find();
		await res.json(results);
	},

	/**
	 * PUT request, however, is to delete all results of a particular deck (which has been scheduled for deletion)
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<boolean>}
	 */
	async put(App, req, res) {
		const { id } = req.body;
		if (!id) res.sendStatus(401);
		try {
			await ResultSchema.deleteMany({ deck: id });
			return true;
		} catch (e) {
			req.sendStatus(500);
			return false;
		}
	},

	/**
	 * DELETE request to delete a particular result
	 *
	 * @param App
	 * @param req
	 * @param res
	 * @returns {Promise<void>}
	 */
	async delete(App, req, res) {
		const data = req.body;

		try {
			await ResultSchema.deleteOne({
				id: data.value,
			});
			success(`Result with id: ${data.value} successfully deleted`);
			res.sendStatus(200);
		} catch (e) {
			err(e);
		}
	},
};
