let decks;
let questionAddCounter;
let currentPage;
let adminToken;

window.onload = async () => {
	function openTab(tab) {
		let i;
		let x = document.getElementsByClassName('webpage');
		for (i = 0; i < x.length; i++) {
			x[i].style.display = 'none';
		}
		document.getElementById(tab).style.display = 'block';
		currentPage = tab;
		if (tab !== 'addquestion-option') questionAddCounter = '';
		const options = ['Email', 'Shuffle', 'Answer'];
		for (const option of options)
			if (document.getElementsByClassName(`chosen-${option}`).length)
				Array.from(
					document.getElementsByClassName(`chosen-${option}`),
				)[0].classList.remove(`chosen-${option}`);
	}

	function convertObjToMap(obj) {
		const map = new Map();
		for (const key in obj) {
			map.set(key, obj[key]);
		}
		return map;
	}

	function convertToPages(entities, limit) {
		let pages = [];
		let currentPage = [];

		entities.forEach((entity) => {
			if (currentPage.length < limit) {
				currentPage.push(entity);
			} else {
				pages.push(currentPage);
				currentPage = [entity];
			}
		});
		if (currentPage) pages.push(currentPage);

		return pages;
	}

	async function login() {
		const loginForm = document.getElementById('loginForm');
		loginForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const formData = new FormData(loginForm);
			const password = formData.get('password');
			const res = await fetch(
				`${window.location.protocol}//${window.location.host}/admin/login`,
				{
					headers: { Authorization: password },
				},
			);
			if (!res.ok) {
				let statusText = document.createElement('p');
				statusText.textContent = 'Invalid Password';
				statusText.classList.add('text-red-300');
				loginForm.appendChild(statusText);
			} else {
				document.getElementById('login-page').style.display = 'none';
				document.getElementById('dashboard-page').style.display =
					'flex';
				adminToken = (await res.json()).token;
				await displayDecks();
				await displayResults();
				await creator('Question', [
					{ name: 'Question' },
					{ name: 'Option1', formalName: 'Option 1' },
					{ name: 'Option2', formalName: 'Option 2' },
					{ name: 'Option3', formalName: 'Option 3' },
					{ name: 'Option4', formalName: 'Option 4' },
					{
						name: 'Points',
						formalName: 'Points/Marks Value',
						type: 'line',
					},
					{
						name: 'Answer',
						options: [
							'Option 1',
							'Option 2',
							'Option 3',
							'Option 4',
						],
						type: 'button',
					},
				]);

				await creator('Deck', [
					{ name: 'Deck', formalName: 'Deck Name' },
					{ name: 'Timer', formalName: 'Time Limit (in minutes)' },
					{ name: 'Conclusion', formalName: 'Conclusion Message' },
					{
						name: 'Email',
						formalName: 'Require Email',
						type: 'button',
						options: ['Yes', 'No'],
					},
					{
						name: 'Shuffle',
						formalName: 'Shuffle Questions',
						type: 'button',
						options: ['Yes', 'No'],
					},
					{
						name: 'Background',
						formalName: 'Quiz Background Image (Optional, BETA)',
						type: 'upload',
					},
				]);
			}
		});
	}

	async function displayDecks() {
		decks = await (
			await fetch(
				`${window.location.protocol}//${window.location.host}/admin/deck`,
				{
					headers: { Authorization: `Bearer ${adminToken}` },
				},
			)
		).json();

		const newDeckButton = document.getElementById('new-deck');
		newDeckButton.onclick = () => openTab('adddeck-option');

		const deckListContainer = document.getElementById('decks');
		deckListContainer.replaceChildren();

		function generateDeck(deck) {
			const questions = convertObjToMap(deck.questions);
			const deckContainer = document.createElement('div');
			deckContainer.classList.add(
				'bg-zinc-800',
				'text-white',
				'p-4',
				'rounded-lg',
				'relative',
				'deck-container',
			);

			const idContainer = document.createElement('p');
			idContainer.classList.add(
				'absolute',
				'top-2',
				'right-2',
				'bg-zinc-700',
				'px-2',
				'py-1',
				'rounded',
			);
			idContainer.textContent = `#${deck.id}`;

			deckContainer.appendChild(idContainer);

			const titleContainer = document.createElement('div');
			titleContainer.classList.add(
				'flex',
				'justify-between',
				'items-center',
				'mb-4',
			);
			const titleText = document.createElement('p');
			titleText.textContent = deck.name;
			titleText.classList.add(
				'text-lg',
				'font-semibold',
				'text-blue-300',
				'w-full',
			);
			titleContainer.appendChild(titleText);

			const deckOptionsContainer = document.createElement('div');
			deckOptionsContainer.classList.add('space-y-2');

			const DeckOptions = [
				'Add Question',
				'View Questions',
				'Delete',
				'Share',
			];

			DeckOptions.forEach((DeckOption) => {
				const button = document.createElement('button');
				button.textContent = DeckOption;
				button.classList.add(
					'deck-option-button',
					'bg-zinc-700',
					'p-3',
					'rounded-lg',
					'w-full',
					'hover:bg-gray-900',
					'text-blue-200',
				);

				button.onclick = async () => {
					switch (button.textContent) {
						case 'Share':
							if (!questions.size)
								return alert(
									'This deck does not contain any questions yet!',
								);
							try {
								await navigator.share({
									url: `${window.location.protocol}//${window.location.host}/quiz?deck=${deck.id}`
								});
							} catch (error) {
								alert('Your browser demands the resource must be either a localhost or be served over https:// to share. Proceeding to open the link so you can copy it manually')
								window.open(`/quiz?deck=${deck.id}`);
							}
							break;
						case 'Add Question':
							questionAddCounter = deck.id;
							openTab('addquestion-option');
							break;

						case 'View Questions':
							if (!questions.size)
								return alert(
									'This deck does not contain any questions yet!',
								);
							function generate(question) {
								const questionContainer =
									document.getElementById('questions');
								const questionButton =
									document.createElement('button');
								questionButton.classList.add(
									'bg-zinc-700',
									'text-blue-200',
									'p-4',
									'rounded-lg',
									'relative',
									'h-24',
								);
								questionButton.textContent = question.question;
								questionButton.onclick = () => {
									creator(
										'Display',
										[
											{
												name: 'Question',
												value: question.question,
												disabled: true,
											},
											{
												name: 'Option1',
												formalName: 'Option 1',
												value: question.options[0],
												disabled: true,
											},
											{
												name: 'Option2',
												formalName: 'Option 2',
												value: question.options[1],
												disabled: true,
											},
											{
												name: 'Option3',
												formalName: 'Option 3',
												value: question.options[2],
												disabled: true,
											},
											{
												name: 'Option4',
												formalName: 'Option 4',
												value: question.options[3],
												disabled: true,
											},
											{
												name: 'Points',
												formalName:
													'Points/Marks Value',
												type: 'line',
												value: question.points,
												disabled: true,
											},
											{
												name: 'Answer',
												options: [
													'Option 1',
													'Option 2',
													'Option 3',
													'Option 4',
												],
												value: `${question.options.findIndex((ele) => ele === question.answer) + 1}`,
												type: 'button',
												disabled: true,
											},
										],
										`${question.id} ${question.deck}`,
									);
									openTab('adddisplay-option');
									// viewQuestion(question, deck);
								};

								questionContainer.appendChild(questionButton);
							}
							let questionList = [];
							convertObjToMap(deck.questions).forEach(
								(question) => questionList.push(question),
							);
							paginate('q', 15, questionList, generate);
							openTab('viewquestions-option');
							break;

						case 'Delete':
							if (
								confirm(
									`This will delete the Deck "${deck.name}" and all of it's questions and results. This action cannot be undone.`,
								)
							) {
								await fetch(
									`${window.location.protocol}//${window.location.host}/admin/deck`,
									{
										method: 'DELETE',
										body: JSON.stringify({
											type: 'deck',
											value: deck.id,
										}),
										headers: {
											'Content-type':
												'application/json; charset=UTF-8',
											Authorization: `Bearer ${adminToken}`,
										},
									},
								);
								await displayDecks();
								await displayResults();
								await fetch(
									`${window.location.protocol}//${window.location.host}/admin/result`,
									{
										method: 'PUT',
										body: JSON.stringify({
											id: deck.id,
										}),
										headers: {
											'Content-type':
												'application/json; charset=UTF-8',
											Authorization: `Bearer ${adminToken}`,
										},
									},
								);
							}
							break;
					}
				};
				deckOptionsContainer.appendChild(button);
			});

			deckContainer.appendChild(titleContainer);
			deckContainer.appendChild(deckOptionsContainer);

			deckListContainer.appendChild(deckContainer);
		}
		paginate('d', 6, decks, generateDeck);
	}

	function paginate(type, limit, src, exec) {
		let pages = convertToPages(src, limit);
		let currentPage = 0;
		let container;
		switch (type) {
			case 'r':
				container = document.getElementById('results');
				break;
			case 'd':
				container = document.getElementById('decks');
				break;
			case 'q':
				container = document.getElementById('questions');
		}
		container.replaceChildren();
		document.getElementById(type + '-page-count').textContent =
			`Page 1 of ${pages.length}`;

		const prevPage = document.getElementById('prev-' + type);
		const nextPage = document.getElementById('next-' + type);
		prevPage.disabled = true;
		nextPage.disabled = currentPage + 1 === pages.length;

		const pageButtons = [prevPage, nextPage];

		for (const pageButton of pageButtons) {
			pageButton.onclick = () => {
				container.replaceChildren();
				if (pageButton === prevPage) currentPage--;
				else currentPage++;

				nextPage.disabled = currentPage + 1 === pages.length;
				prevPage.disabled = currentPage === 0;
				for (const entity of pages[currentPage]) {
					exec(entity);
				}
				document.getElementById(type + '-page-count').textContent =
					`Page ${currentPage + 1} of ${pages.length}`;
			};
		}

		for (const entity of pages[currentPage]) exec(entity);
	}

	async function displayResults() {
		document.getElementById('result-refresh').onclick = () =>
			displayResults();

		const resultListContainer = document.getElementById('results');
		resultListContainer.replaceChildren();

		const results = await (
			await fetch(
				`${window.location.protocol}//${window.location.host}/admin/result`,
				{
					headers: { Authorization: `Bearer ${adminToken}` },
				},
			)
		).json();

		function generateResult(result) {
			const resultContainer = document.createElement('div');
			resultContainer.classList.add(
				'bg-zinc-800',
				'text-white',
				'p-4',
				'rounded-lg',
				'relative',
				'deck-container',
			);

			const idContainer = document.createElement('p');
			idContainer.classList.add(
				'absolute',
				'top-2',
				'right-2',
				'bg-zinc-700',
				'px-2',
				'py-1',
				'rounded',
			);
			idContainer.textContent = `#${result.id}`;

			resultContainer.appendChild(idContainer);

			const detailsContainer = document.createElement('div');
			detailsContainer.classList.add(
				'flex',
				'flex-col',
				'items-center',
				'text-blue-200',
			);

			const titleContainer = document.createElement('p');
			titleContainer.textContent = `Name: ${result.name}`;
			titleContainer.classList.add(
				'px-2',
				'py-1',
				'rounded',
				'w-full',
				'mb-2',
			);

			detailsContainer.appendChild(titleContainer);
			// titleContainer.appendChild(title);

			const emailContainer = document.createElement('p');
			emailContainer.classList.add(
				'px-2',
				'py-1',
				'rounded',
				'w-full',
				'mb-2',
			);
			emailContainer.textContent = `Email: ${result.email || `N/A`}`;
			detailsContainer.appendChild(emailContainer);

			const scoreContainer = document.createElement('p');
			scoreContainer.classList.add(
				'px-2',
				'py-1',
				'rounded',
				'w-full',
				'mb-2',
			);
			scoreContainer.textContent = `Score: ${result.score}`;
			detailsContainer.appendChild(scoreContainer);

			const resultOptionsContainer = document.createElement('div');
			resultOptionsContainer.classList.add('space-y-2');

			const ResultOptions = ['View Detailed Result', 'Delete Result'];

			ResultOptions.forEach((ResultOption) => {
				const button = document.createElement('button');
				button.textContent = ResultOption;
				button.classList.add(
					'result-option-button',
					'bg-zinc-700',
					'p-3',
					'rounded-lg',
					'w-full',
					'hover:bg-gray-900',
					'text-blue-200',
				);
				button.id = `${ResultOption.replace(' ', '-').toLowerCase()}-${result.id}`;

				button.onclick = async () => {
					if (button.textContent === 'View Detailed Result')
						window.open(`/result?player=${result.id}`);
					else if (button.textContent === 'Delete Result') {
						if (confirm('This action cannot be undone.')) {
							await fetch(
								`${window.location.protocol}//${window.location.host}/admin/result`,
								{
									method: 'DELETE',
									body: JSON.stringify({
										type: 'result',
										value: result.id,
									}),
									headers: {
										'Content-type':
											'application/json; charset=UTF-8',
										Authorization: `Bearer ${adminToken}`,
									},
								},
							);
							await displayResults();
						}
					}
				};
				resultOptionsContainer.appendChild(button);
			});

			resultContainer.appendChild(detailsContainer);
			resultContainer.appendChild(resultOptionsContainer);

			resultListContainer.appendChild(resultContainer);
		}
		paginate('r', 6, results, generateResult);
	}

	async function creator(page, fields = [], token = '') {
		const CreatorPage = document.getElementById(
			`add${page.toLowerCase()}-option`,
		);
		let existingContainer = document.getElementById(
			page + '-creator-container',
		);
		if (existingContainer) CreatorPage.removeChild(existingContainer);

		const CreatorContainer = document.createElement('div');
		CreatorContainer.classList.add('space-y-4');
		CreatorContainer.id = page + '-creator-container';

		const form = document.createElement('form');
		form.id = `${page.toLowerCase()}-creator-form`;
		let uploadedFile;

		const submitContainer = document.createElement('div');
		submitContainer.classList.add('flex', 'justify-center');

		const closeButton = document.createElement('button');
		closeButton.classList.add(
			'mt-4',
			'p-2',
			'bg-zinc-700',
			'rounded',
			'text-yellow-400',
			'mr-4',
		);
		closeButton.textContent = 'Close';
		closeButton.onclick = () => openTab('deck-container');

		const submitButton = document.createElement('button');
		submitButton.classList.add(
			'mt-4',
			'p-2',
			'bg-zinc-700',
			'rounded',
			'ml-4',
		);
		if (page.toLowerCase() === 'display') {
			submitButton.textContent = 'Delete';
			submitButton.type = 'button';
			submitButton.classList.add('text-red-500');

			submitButton.onclick = async () => {
				if (
					confirm(
						'Are you sure you want to delete this question? This action cannot be undone.',
					)
				) {
					await fetch(
						`${window.location.protocol}//${window.location.host}/admin/question`,
						{
							method: 'DELETE',
							body: JSON.stringify({
								question: token.split(' ')[0],
								deck: token.split(' ')[1],
							}),
							headers: {
								'Content-type':
									'application/json; charset=UTF-8',
								Authorization: `Bearer ${adminToken}`,
							},
						},
					);
					await displayDecks();
					openTab('deck-container');
				}
			};
		} else {
			submitButton.textContent = 'Add';
			submitButton.type = 'submit';
			submitButton.setAttribute('form', form.id);
			submitButton.classList.add('text-green-400');
		}

		submitContainer.appendChild(closeButton);
		submitContainer.appendChild(submitButton);
		let aiFields;
		function addField(
			name,
			formalName = name,
			type,
			options = [],
			value = '',
			disabled = false,
		) {
			const fieldContainer = document.createElement('div');
			fieldContainer.classList.add('flex', 'items-center');

			const label = document.createElement('label');
			label.textContent = formalName;
			label.classList.add('w-1/3', 'text-blue-200');
			fieldContainer.appendChild(label);

			if (type === 'button') {
				const optionContainer = document.createElement('div');
				optionContainer.classList.add('flex', 'space-x-2');

				for (const option of options) {
					let optionButton = document.createElement('button');
					optionButton.classList.add(
						'option-buttons',
						'w-32',
						'h-10',
						'flex',
						'items-center',
						'justify-center',
						'border',
						'rounded',
						'bg-zinc-700',
						'text-white',
						'mt-4',
					);
					optionButton.textContent = `${option}`;
					optionButton.type = 'button';
					optionButton.disabled = disabled;
					if ('Option ' + value === option)
						optionButton.classList.replace(
							'text-white',
							'text-green-500',
						);

					optionButton.onclick = () => {
						if (
							document.getElementsByClassName(`chosen-${name}`)
								.length
						)
							Array.from(
								document.getElementsByClassName(
									`chosen-${name}`,
								),
							)[0].classList.remove(`chosen-${name}`);
						optionButton.classList.add(`chosen-${name}`);
					};
					optionContainer.appendChild(optionButton);
				}

				fieldContainer.appendChild(optionContainer);
			} else if (type === 'upload') {
				const optionContainer = document.createElement('div');
				optionContainer.classList.add('flex', 'space-x-2');

				let uploadButton = document.createElement('button');
				uploadButton.classList.add(
					'option-buttons',
					'w-20',
					'h-10',
					'flex',
					'items-center',
					'justify-center',
					'border',
					'rounded',
					'bg-zinc-700',
					'text-zinc-100',
					'mt-4',
				);
				uploadButton.textContent = `Upload`;
				uploadButton.type = 'button';
				uploadButton.id = `upload${name}`;

				let uploadFile = document.createElement('input');
				uploadFile.type = 'file';
				uploadFile.id = `uploadFile${name}`;
				uploadFile.accept = 'image/*';
				uploadFile.style.display = 'none';

				uploadButton.onclick = () => uploadFile.click();
				uploadFile.onchange = () => {
					uploadedFile = uploadFile.files[0];
					uploadButton.textContent = `Uploaded`;
					uploadButton.classList.replace(
						'text-zinc-100',
						'text-green-500',
					);
					alert(
						'Image uploaded successfully! Please note that this feature is currently in BETA. We recommend testing the image by playing the quiz before using it in a live event.',
					);
				};

				optionContainer.appendChild(uploadButton);
				fieldContainer.appendChild(optionContainer);
			} else {
				let textArea;
				if (type === 'line') {
					textArea = document.createElement('input');
					textArea.type = 'number';
					textArea.autocomplete = 'off';
				} else {
					textArea = document.createElement('textarea');
				}
				textArea.classList.add(
					'mb-3',
					'w-2/3',
					'p-2',
					'border',
					'rounded',
					'bg-zinc-700',
					'text-zinc-100',
					`${page.toLowerCase()}-field`,
				);
				textArea.required = true;
				textArea.name = `insert${name}`;
				if (value)
					textArea[type === 'line' ? 'value' : 'textContent'] = value;
				textArea.disabled = disabled;
				textArea.placeholder =
					formalName === 'Conclusion Message' ?
						'Message on Completion of Quiz'
					:	`Insert "${formalName}" text here`;

				if (name.toLowerCase() === 'question') {
					textArea.isLoading = false;
					textArea.oninput = async (event) => {
						if (event.target.value === '') return;
						if (document.getElementById('autofill')) return;

						const autofillButton = document.createElement('button');
						autofillButton.textContent = 'Autofill Choices (Beta)';
						autofillButton.classList.add(
							'mt-4',
							'p-2',
							'bg-zinc-700',
							'rounded',
							'ml-4',
							'text-blue-400',
						);
						autofillButton.id = 'autofill';
						submitContainer.appendChild(autofillButton);
						autofillButton.onclick = async () => {
							if (event.target.value === '')
								return alert(
									'Enter Question Text to generate choices',
								);
							if (textArea.isLoading)
								return alert(
									'The system has already begun generating choices',
								);
							textArea.isLoading = true;
							autofillButton.classList.add('animate-pulse');
							aiFields = Array.from(
								document.getElementsByClassName(
									`${page.toLowerCase()}-field`,
								),
							);
							aiFields = aiFields.filter(
								(ele) =>
									ele.name !==
									('insertQuestion' || 'insertPoints'),
							);
							let data = await fetch(
								`${window.location.protocol}//${window.location.host}/admin/ai`,
								{
									method: 'POST',
									body: JSON.stringify({
										question: `${event.target.value}`,
									}),
									headers: {
										'Content-type':
											'application/json; charset=UTF-8',
										Authorization: `Bearer ${adminToken}`,
									},
								},
							);
							if (!data.ok) {
								if (data.status === 401)
									return alert(
										"You haven't setup the AI Module! Read the documentation to learn how",
									);
								data = await data.text();
								if (
									data.toLowerCase() ===
									'authentication error'
								)
									return alert(
										'Error: Invalid Cloudfare credentials',
									);
								else alert('Error: ' + data);
							} else {
								data = await data.json();
								for (let i = 0; i < aiFields.length; i++) {
									aiFields[i].textContent = data[i];
								}
							}
							textArea.isLoading = false;
							autofillButton.classList.remove('animate-pulse');
						};
					};
				}
				fieldContainer.appendChild(textArea);
			}

			form.appendChild(fieldContainer);
		}

		fields.forEach((field) => {
			if (!field.type) field.type = '';
			switch (field.type.toLowerCase()) {
				case 'button':
					addField(
						field.name,
						field.formalName,
						'button',
						field.options,
						field.value,
						field.disabled,
					);
					break;
				case 'line':
					addField(
						field.name,
						field.formalName,
						'line',
						[],
						field.value,
						field.disabled,
					);
					break;
				case 'upload':
					addField(field.name, field.formalName, 'upload');
					break;
				default:
					addField(
						field.name,
						field.formalName,
						field.type,
						[],
						field.value,
						field.disabled,
					);
					break;
			}
		});

		CreatorContainer.appendChild(form);
		CreatorContainer.appendChild(submitContainer);

		CreatorPage.appendChild(CreatorContainer);

		form.addEventListener('submit', async (event) => {
			// Check whether the Option buttons were indeed selected
			event.preventDefault();
			const formData = new FormData(form);
			let body;
			if (page.toLowerCase() === 'question')
				body = {
					question: formData.get('insertQuestion').trim(),
					option1: formData.get('insertOption1').trim(),
					option2: formData.get('insertOption2').trim(),
					option3: formData.get('insertOption3').trim(),
					option4: formData.get('insertOption4').trim(),
					answer: formData
						.get(
							`insert${Array.from(document.getElementsByClassName('chosen-Answer'))[0].textContent.trim().replace(' ', '')}`,
						)
						.trim(),
					points: formData.get('insertPoints').trim(),
					deck: questionAddCounter,
				};
			else if (page.toLowerCase() === 'deck')
				body = {
					name: formData.get('insertDeck').trim(),
					conclusion: formData.get('insertConclusion').trim(),
					timer: formData.get('insertTimer').trim(),
					email:
						(
							Array.from(
								document.getElementsByClassName('chosen-Email'),
							)[0].textContent === 'No'
						) ?
							''
						:	'Yes',
					shuffle:
						(
							Array.from(
								document.getElementsByClassName(
									'chosen-Shuffle',
								),
							)[0].textContent === 'No'
						) ?
							''
						:	'Yes',
				};

			const data = await (
				await fetch(
					`${window.location.protocol}//${window.location.host}/admin/${page.toLowerCase()}`,
					{
						method: 'POST',
						body: JSON.stringify({
							data: body,
						}),
						headers: {
							'Content-type': 'application/json; charset=UTF-8',
							Authorization: `Bearer ${adminToken}`,
						},
					},
				)
			).json();

			if (page.toLowerCase() === 'deck' && uploadedFile) {
				const imageFormData = new FormData();
				imageFormData.append('image', uploadedFile);
				await fetch(
					`${window.location.protocol}//${window.location.host}/admin/deck?deck=${data.deck}`,
					{
						method: 'PUT',
						body: imageFormData,
						headers: { Authorization: `Bearer ${adminToken}` },
					},
				);
				const uploadButton = document.getElementById(`uploadBackground`)
				uploadButton.textContent = `Upload`;
				uploadButton.classList.replace(
					'text-green-500',
					'text-zinc-100'
				);
			}

			const statusContainer = document.createElement('div');
			statusContainer.classList.add('flex', 'justify-center');

			if (data.success) {
				await displayDecks();
				const successText = document.createElement('p');
				successText.innerText = page + ' successfully created!';
				successText.classList.add(
					'mt-4',
					'p-2',
					'bg-zinc-700',
					'rounded',
					'text-green-400',
				);
				statusContainer.appendChild(successText);
			} else {
				const errorText = document.createElement('p');
				errorText.innerText = `Error: ${data.errorMessage}`;
				errorText.classList.add(
					'mt-4',
					'p-2',
					'bg-zinc-700',
					'rounded',
					'text-red-400',
				);
				statusContainer.appendChild(errorText);
			}
			form.reset();
			// reset() does not reset values of elements whose attributes have been changed manually (in this case, during the autofill process)
			if (page.toLowerCase() === 'question')
				for (let i = 0; i < aiFields.length; i++)
					aiFields[i].textContent = '';

			CreatorContainer.appendChild(statusContainer);

			setTimeout(async () => {
				if (page.toLowerCase() === 'deck') openTab('deck-container');
				statusContainer.replaceChildren();
			}, 2000);
		});
	}

	await login();
};

window.addEventListener('beforeunload', function (e) {
	if (currentPage === 'addquestion-option') e.preventDefault();
	questionAddCounter = '';
});
