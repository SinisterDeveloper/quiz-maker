let token;

window.onload = async () => {
	document.addEventListener(
		'contextmenu',
		function (e) {
			e.preventDefault();
		},
		false,
	);

	window.console.log = function () {
		console.error('The developer console is forbidden during the quiz!');
		window.console.log = function () {
			return false;
		}
	}

	async function end() {
		const endQuizRequest = await fetch(
			`${window.location.protocol}//${window.location.host}/quiz/update`,
			{
				method: 'DELETE',
				body: JSON.stringify({
					timeEnded: Date.now(),
					deckId: deck
				}),
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
					Authorization: 'Bearer ' + playerInfo.token,
				},
			},
		);
		if (!endQuizRequest.ok) return alert('Unable to save answers!');

		window.clearTimeout(timer);
		window.location = `${window.location.protocol}//${window.location.host}/result?player=${playerInfo.token}`;
	}

	const params = new URL(window.location.href).searchParams;
	const deck = params.get('deck');
	let timer;
	const quizPage = document.getElementById('container');
	const detailsPage = document.getElementById('details');
	const instructionsPage = document.getElementById('instructions');
	const quizBox = document.getElementById('quiz-box');

	if (!deck)
		window.location.assign(
			`${window.location.protocol}//${window.location.host}/`,
		);

	const info = await (
		await fetch(
			`${window.location.protocol}//${window.location.host}/quiz/metadata?deck=${deck}`,
		)
	).json();

	document.title = info.name;
	document.getElementById('quiz-name').textContent = info.name;

	// -----------------------DETAILS INPUT CONTAINER ---------------------------------

	let playerName;
	let playerEmail;
	let playerInfo;

	if (info.background !== 'default') {
		detailsPage.classList.remove('bg-gray-950');
		detailsPage.style.backgroundImage = `url(../img/BG_${deck}.jpeg)`;
		detailsPage.style.backgroundSize = 'contain';

		quizPage.classList.remove('bg-gray-950');
		quizPage.style.backgroundImage = `url(../img/BG_${deck}.jpeg)`;
		quizPage.style.backgroundSize = 'contain';
	}

	const container = document.getElementById('details-container');
	const form = document.createElement('form');
	form.id = 'details-input';

	const nameInput = document.createElement('input');
	nameInput.classList.add('w-full', 'rounded-lg', 'p-2', 'mb-4');
	nameInput.name = 'name';
	nameInput.required = true;
	nameInput.placeholder = 'Enter Name';
	form.appendChild(nameInput);

	if (info.email) {
		const emailInput = document.createElement('input');
		emailInput.classList.add('w-full', 'rounded-lg', 'p-2', 'mb-4');
		emailInput.name = 'email';
		emailInput.type = 'email';
		emailInput.placeholder = 'Enter Email';
		emailInput.required = true;
		form.appendChild(emailInput);
	}

	const detailsSubmitButton = document.createElement('button');
	detailsSubmitButton.classList.add(
		'w-full',
		'rounded-lg',
		'p-2',
		'text-blue-300',
	);
	detailsSubmitButton.textContent = 'Submit';
	detailsSubmitButton.type = 'submit';
	form.appendChild(detailsSubmitButton);
	container.appendChild(form);

	const instructionsButton = document.getElementById('instructions-button');
	instructionsButton.onclick = () => {
		quizBox.style.display = 'none';
		instructionsPage.style.display = 'block';
	};
	document.getElementById('instruction-ok').onclick = () => {
		quizBox.style.display = 'block';
		instructionsPage.style.display = 'none';
	};

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const formData = new FormData(form);

		playerName = formData.get('name').trim().toUpperCase();
		playerEmail =
			formData.get('email') ?
				formData.get('email').trim().toUpperCase()
			:	'';

		playerInfo = await (
			await fetch(
				`${window.location.protocol}//${window.location.host}/quiz/update`,
				{
					method: 'POST',
					body: JSON.stringify({ deck: deck }),
					headers: {
						'Content-type': 'application/json; charset=UTF-8',
					},
				},
			)
		).json();

		token = playerInfo.token;

		await fetch(
			`${window.location.protocol}//${window.location.host}/quiz/metadata`,
			{
				method: 'POST',
				body: JSON.stringify({
					name: playerName,
					email: playerEmail,
				}),
				headers: {
					Authorization: 'Bearer ' + token,
					'Content-type': 'application/json; charset=UTF-8',
				},
			},
		);

		let status = document.createElement('p');
		status.classList.add('text-green-400', 'text-base', 'mt-2');
		status.textContent =
			'Logged in as ' +
			formData.get('name').trim().toUpperCase() +
			'! Redirecting...';
		container.appendChild(status);

		setTimeout(() => {
			detailsPage.style.display = 'none';
			quizPage.style.display = 'flex';
		}, 1000);
		let countDownDate = new Date().getTime() + playerInfo.timer * 60 * 1000;

		function updateTimer() {
			let now = new Date().getTime();
			let duration = countDownDate - now;

			if (duration <= 0) {
				clearInterval(timerInterval);
				document.getElementById('timer').innerHTML = '0m 0s';
				return;
			}

			let minutes = Math.floor(
				(duration % (1000 * 60 * 60)) / (1000 * 60),
			);
			let seconds = Math.floor((duration % (1000 * 60)) / 1000);

			document.getElementById('timer').innerHTML =
				minutes + 'm ' + seconds + 's ';
		}

		let timerInterval = setInterval(updateTimer, 1000);

		updateTimer();

		timer = setTimeout(
			async () => {
				await end();
			},
			1000 * 60 * playerInfo.timer,
		);

		document.getElementById('submit').onclick = () => {
			let confirmation = confirm(
				'Are you sure you want to submit the quiz?',
			);
			if (confirmation) end();
		};
		await quiz();
	});

	async function quiz() {
		const questionElement = document.getElementById('question');
		const answerButtons = document.getElementsByClassName('answer-button');
		const qNumberElement = document.getElementById('status');
		const previousButton = document.getElementById('previous-question');
		const nextButton = document.getElementById('next-question');
		const clearButton = document.getElementById('clear-selected');

		let qNumber = 1;
		previousButton.disabled = true;

		const questions = await (
			await fetch(
				`${window.location.protocol}//${window.location.host}/quiz/questions`,
				{
					headers: { Authorization: 'Bearer ' + token },
				},
			)
		).json();
		if (!questions || !questions.length)
			return console.error('Error in fetching questions');

		async function displayQuestion(number) {
			previousButton.disabled = qNumber === 1;
			nextButton.disabled = qNumber === questions.length;

			const currentQuestion = questions[number - 1];

			questionElement.textContent = currentQuestion.question;
			let chosen = document.getElementsByClassName('chosen-answer')[0];
			if (chosen) chosen.classList.remove('chosen-answer');

			const choiceData = await (
				await fetch(
					`${window.location.protocol}//${window.location.host}/quiz/questions?question=${currentQuestion.id}`,
					{
						headers: {
							Authorization: 'Bearer ' + playerInfo.token,
						},
					},
				)
			).json();
			clearButton.style.display = choiceData ? 'flex' : 'none';

			for (let i = 0; i < currentQuestion.options.length; i++) {
				const option = currentQuestion.options[i];
				const answerButton = answerButtons[i];

				answerButton.textContent = option;
				if (option === choiceData)
					answerButton.classList.add('chosen-answer');

				answerButton.onclick = async () => {
					const res = await save(currentQuestion.id, option);
					if (!res) console.error('Error in saving question');
					let chosen =
						document.getElementsByClassName('chosen-answer')[0];
					if (chosen) chosen.classList.remove('chosen-answer');
					answerButton.classList.add('chosen-answer');
					clearButton.style.display = 'flex';
				};
			}
			qNumberElement.textContent = `Question ${qNumber} of ${questions.length}`;
			clearButton.onclick = async () => {
				await save(currentQuestion.id, '');
				document
					.getElementsByClassName('chosen-answer')[0]
					.classList.remove('chosen-answer');
				clearButton.style.display = 'none';
			};
		}

		async function save(id, option) {
			const res = await fetch(
				`${window.location.protocol}//${window.location.host}/quiz/questions`,
				{
					method: 'PUT',
					body: JSON.stringify({ id: id, option: option }),
					headers: {
						'Content-type': 'application/json; charset=UTF-8',
						Authorization: 'Bearer ' + playerInfo.token,
					},
				},
			);
			return res.ok;
		}

		await displayQuestion(qNumber);

		function buttonHandler(type) {
			type === previousButton ? qNumber-- : qNumber++;
			displayQuestion(qNumber);
		}

		previousButton.onclick = () => buttonHandler(previousButton);
		nextButton.onclick = () => buttonHandler(nextButton);
	}
};
