window.onload = async function () {
	const timeStartedElement = document.getElementById('timeStarted');
	const timeEndedElement = document.getElementById('timeEnded');
	const durationElement = document.getElementById('duration');
	const scoreElement = document.getElementById('score');
	const nameElement = document.getElementById('name');
	const emailElement = document.getElementById('email');
	const conclusionElement = document.getElementById('conclusion');
	const questionList = document.getElementById('question-list');

	const params = new URL(window.location.href).searchParams;
	const player = params.get('player');

	const { stats, answers } = await (
		await fetch(
			`${window.location.protocol}//${window.location.host}/quiz/result?player=${player}`,
		)
	).json();

	if (!stats) return console.error('Error while fetching results');

	let rawDuration = stats.timeEnded - stats.timeStarted;
	let min = Math.trunc(rawDuration / 60000);
	let sec = Math.trunc(rawDuration / 1000 - 60 * min);
	let duration = `${min} minutes, ${sec} seconds`;

	nameElement.textContent = stats.name;
	emailElement.textContent = stats.email;
	timeStartedElement.textContent = new Date(parseInt(stats.timeStarted))
		.toLocaleTimeString()
		.toLocaleUpperCase();
	timeEndedElement.textContent = new Date(parseInt(stats.timeEnded))
		.toLocaleTimeString()
		.toLocaleUpperCase();
	durationElement.textContent = duration;
	scoreElement.textContent = `${stats.score}`;
	conclusionElement.textContent = stats.conclusion;

	// ------------------------- QUESTION - WISE - PERFORMANCE ----------------------------------------------------------------------------
	for (const answer of answers) {
		const row = document.createElement('tr');
		const fields = [
			'question',
			'correctAnswer',
			'userAnswer',
			'pointsAwarded',
		];

		fields.forEach((ele) => {
			const field = document.createElement('td');
			field.textContent = answer[ele];
			field.classList.add(
				'w-1/4',
				'border',
				'border-gray-600',
				'p-4',
				'text-gray-200',
			);
			row.appendChild(field);
		});

		questionList.appendChild(row);
	}
};
