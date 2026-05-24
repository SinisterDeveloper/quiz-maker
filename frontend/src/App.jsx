import { useEffect, useMemo, useState } from 'react'

const apiBase = `${window.location.protocol}//${window.location.host}`

const request = async (path, options = {}) => {
const response = await fetch(`${apiBase}${path}`, options)
return response
}

const toPages = (items, limit) => {
if (!items.length) return [[]]
const pages = []
for (let i = 0; i < items.length; i += limit) {
pages.push(items.slice(i, i + limit))
}
return pages
}

const trimUpper = (value) => value.trim().toUpperCase()

function DashboardPage() {
const [password, setPassword] = useState('')
const [loginError, setLoginError] = useState('')
const [adminToken, setAdminToken] = useState('')
const [activeTab, setActiveTab] = useState('dashboard')
const [decks, setDecks] = useState([])
const [results, setResults] = useState([])
const [selectedDeckForQuestion, setSelectedDeckForQuestion] = useState('')
const [viewDeckQuestions, setViewDeckQuestions] = useState([])
const [viewQuestionPage, setViewQuestionPage] = useState(0)
const [displayQuestionData, setDisplayQuestionData] = useState(null)
const [deckPage, setDeckPage] = useState(0)
const [resultPage, setResultPage] = useState(0)
const [deckStatus, setDeckStatus] = useState('')
const [questionStatus, setQuestionStatus] = useState('')
const [questionLoading, setQuestionLoading] = useState(false)
const [uploadedImage, setUploadedImage] = useState(null)
const [deckForm, setDeckForm] = useState({
name: '',
timer: '',
conclusion: '',
email: 'No',
shuffle: 'No',
})
const [questionForm, setQuestionForm] = useState({
question: '',
option1: '',
option2: '',
option3: '',
option4: '',
points: '',
answer: '',
})

const deckPages = useMemo(() => toPages(decks, 6), [decks])
const resultPages = useMemo(() => toPages(results, 6), [results])
const questionPages = useMemo(() => toPages(viewDeckQuestions, 15), [viewDeckQuestions])

const fetchDecks = async (token = adminToken) => {
if (!token) return
const response = await request('/admin/deck', {
headers: { Authorization: `Bearer ${token}` },
})
if (!response.ok) return
const data = await response.json()
setDecks(Array.isArray(data) ? data : [])
setDeckPage(0)
}

const fetchResults = async (token = adminToken) => {
if (!token) return
const response = await request('/admin/result', {
headers: { Authorization: `Bearer ${token}` },
})
if (!response.ok) return
const data = await response.json()
setResults(Array.isArray(data) ? data : [])
setResultPage(0)
}

const handleLogin = async (event) => {
event.preventDefault()
setLoginError('')
const response = await request('/admin/login', {
headers: { Authorization: password },
})
if (!response.ok) {
setLoginError('Invalid Password')
return
}
const data = await response.json()
setAdminToken(data.token)
await Promise.all([fetchDecks(data.token), fetchResults(data.token)])
}

const openTab = (tab) => {
setActiveTab(tab)
setDeckStatus('')
setQuestionStatus('')
}

const getQuestionList = (deck) => {
if (!deck?.questions) return []
return Object.values(deck.questions)
}

const askToDeleteDeck = async (deck) => {
if (
!window.confirm(
`This will delete the Deck "${deck.name}" and all of it's questions and results. This action cannot be undone.`,
)
) {
return
}

await request('/admin/deck', {
method: 'DELETE',
body: JSON.stringify({ type: 'deck', value: deck.id }),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${adminToken}`,
},
})
await request('/admin/result', {
method: 'PUT',
body: JSON.stringify({ id: deck.id }),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${adminToken}`,
},
})

await Promise.all([fetchDecks(), fetchResults()])
}

const shareDeck = async (deck) => {
const url = `${apiBase}/quiz?deck=${deck.id}`
try {
if (navigator.share) {
await navigator.share({ url })
return
}
throw new Error('Share API unavailable')
} catch {
window.alert(
'Your browser demands the resource must be either a localhost or be served over https:// to share. Proceeding to open the link so you can copy it manually',
)
window.open(`/quiz?deck=${deck.id}`)
}
}

const viewQuestions = (deck) => {
const questions = getQuestionList(deck)
if (!questions.length) {
window.alert('This deck does not contain any questions yet!')
return
}
setViewDeckQuestions(questions)
setViewQuestionPage(0)
setActiveTab('viewquestions-option')
}

const deleteQuestion = async (questionId, deckId) => {
if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
return
}
await request('/admin/question', {
method: 'DELETE',
body: JSON.stringify({ question: questionId, deck: deckId }),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${adminToken}`,
},
})
setDisplayQuestionData(null)
await fetchDecks()
setActiveTab('deck-container')
}

const handleDeckCreate = async (event) => {
event.preventDefault()
setDeckStatus('')

const response = await request('/admin/deck', {
method: 'POST',
body: JSON.stringify({
data: {
name: deckForm.name.trim(),
conclusion: deckForm.conclusion.trim(),
timer: deckForm.timer.trim(),
email: deckForm.email === 'Yes' ? 'Yes' : '',
shuffle: deckForm.shuffle === 'Yes' ? 'Yes' : '',
},
}),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${adminToken}`,
},
})
const data = await response.json()

if (!data.success) {
setDeckStatus(`Error: ${data.errorMessage}`)
return
}

if (uploadedImage) {
const imageData = new FormData()
imageData.append('image', uploadedImage)
await request(`/admin/deck?deck=${data.deck}`, {
method: 'PUT',
body: imageData,
headers: { Authorization: `Bearer ${adminToken}` },
})
}

setDeckStatus('Deck successfully created!')
setDeckForm({ name: '', timer: '', conclusion: '', email: 'No', shuffle: 'No' })
setUploadedImage(null)
await fetchDecks()
setTimeout(() => {
setDeckStatus('')
setActiveTab('deck-container')
}, 1500)
}

const autofillChoices = async () => {
if (!questionForm.question.trim()) {
window.alert('Enter Question Text to generate choices')
return
}
if (questionLoading) {
window.alert('The system has already begun generating choices')
return
}
setQuestionLoading(true)
const response = await request('/admin/ai', {
method: 'POST',
body: JSON.stringify({ question: questionForm.question }),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${adminToken}`,
},
})
if (!response.ok) {
if (response.status === 401) {
window.alert("You haven't setup the AI Module! Read the documentation to learn how")
setQuestionLoading(false)
return
}
const text = await response.text()
window.alert(`Error: ${text}`)
setQuestionLoading(false)
return
}

const data = await response.json()
setQuestionForm((current) => ({
...current,
option1: data[0] || current.option1,
option2: data[1] || current.option2,
option3: data[2] || current.option3,
option4: data[3] || current.option4,
}))
setQuestionLoading(false)
}

const handleQuestionCreate = async (event) => {
event.preventDefault()
setQuestionStatus('')

if (!selectedDeckForQuestion) {
setQuestionStatus('Error: Pick a deck from Add Question before creating a question')
return
}
if (!questionForm.answer) {
setQuestionStatus('Error: Choose the correct answer option')
return
}

const response = await request('/admin/question', {
method: 'POST',
body: JSON.stringify({
data: {
question: questionForm.question.trim(),
option1: questionForm.option1.trim(),
option2: questionForm.option2.trim(),
option3: questionForm.option3.trim(),
option4: questionForm.option4.trim(),
answer: questionForm[questionForm.answer],
points: questionForm.points.trim(),
deck: selectedDeckForQuestion,
},
}),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${adminToken}`,
},
})
const data = await response.json()

if (!data.success) {
setQuestionStatus(`Error: ${data.errorMessage}`)
return
}

setQuestionStatus('Question successfully created!')
setQuestionForm({
question: '',
option1: '',
option2: '',
option3: '',
option4: '',
points: '',
answer: '',
})
await fetchDecks()
setTimeout(() => setQuestionStatus(''), 1500)
}

const deleteResult = async (result) => {
if (!window.confirm('This action cannot be undone.')) return
await request('/admin/result', {
method: 'DELETE',
body: JSON.stringify({ type: 'result', value: result.id }),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${adminToken}`,
},
})
await fetchResults()
}

if (!adminToken) {
return (
<div className="min-h-screen flex items-center justify-center text-white bg-gray-950" id="login-page">
<form className="place-content-center text-3xl" onSubmit={handleLogin} id="loginForm">
<label>
Password:{' '}
<input
className="text-gray-900"
type="password"
name="password"
required
value={password}
onChange={(event) => setPassword(event.target.value)}
/>
</label>
{loginError ? <p className="text-red-300 mt-2">{loginError}</p> : null}
</form>
</div>
)
}

const deckPageItems = deckPages[deckPage] || []
const resultPageItems = resultPages[resultPage] || []
const questionPageItems = questionPages[viewQuestionPage] || []

return (
<div className="flex h-screen text-white bg-zinc-900" id="dashboard-page">
<div className="w-64 bg-gray-950 p-4 flex flex-col">
<div className="flex items-center mb-6">
<span className="text-xl font-semibold">Administrator Settings</span>
</div>
<div className="flex-grow">
<nav className="space-y-2 select-none">
{[
{ id: 'dashboard', label: 'Dashboard', image: '/img/dashboard.png' },
{ id: 'deck-container', label: 'Questions', image: '/img/question.png' },
{ id: 'result-container', label: 'Results', image: '/img/results.png' },
{ id: 'help-container', label: 'Help', image: '/img/help.png' },
].map((item) => (
<p
key={item.id}
id={`sidebar-${item.id}`}
onClick={() => openTab(item.id)}
className={`flex items-center p-2 hover:bg-zinc-700 rounded sidebar-item cursor-pointer ${activeTab === item.id ? 'text-yellow-400' : ''}`}
>
<img src={item.image} alt={item.label} className="mr-2" />
{item.label}
</p>
))}
</nav>
</div>
</div>

<div className="flex-grow p-4 flex-1 flex">
<div className={`webpage bg-zinc-900 p-6 rounded-lg shadow-lg max-w-screen flex-grow ${activeTab === 'addquestion-option' ? 'block' : 'hidden'}`} id="addquestion-option">
<h1 className="text-xl font-bold mb-4">Add Question</h1>
{selectedDeckForQuestion ? <p className="text-blue-300 mb-4">Deck ID: {selectedDeckForQuestion}</p> : <p className="text-yellow-400 mb-4">Open a deck and click "Add Question" first.</p>}
<form className="space-y-4" onSubmit={handleQuestionCreate}>
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Question</label>
<textarea
className="mb-3 w-2/3 p-2 border rounded bg-zinc-700 text-zinc-100"
required
value={questionForm.question}
onChange={(event) =>
setQuestionForm((current) => ({ ...current, question: event.target.value }))
}
/>
</div>
<div className="flex justify-center">
<button
type="button"
onClick={autofillChoices}
className={`mt-1 p-2 bg-zinc-700 rounded text-blue-400 ${questionLoading ? 'animate-pulse' : ''}`}
>
Autofill Choices
</button>
</div>
{['option1', 'option2', 'option3', 'option4'].map((optionKey, index) => (
<div className="flex items-center" key={optionKey}>
<label className="w-1/3 text-blue-200">Option {index + 1}</label>
<textarea
className="mb-3 w-2/3 p-2 border rounded bg-zinc-700 text-zinc-100"
required
value={questionForm[optionKey]}
onChange={(event) =>
setQuestionForm((current) => ({ ...current, [optionKey]: event.target.value }))
}
/>
</div>
))}
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Points/Marks Value</label>
<input
type="number"
autoComplete="off"
required
className="mb-3 w-2/3 p-2 border rounded bg-zinc-700 text-zinc-100"
value={questionForm.points}
onChange={(event) =>
setQuestionForm((current) => ({ ...current, points: event.target.value }))
}
/>
</div>
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Answer</label>
<div className="flex space-x-2">
{['option1', 'option2', 'option3', 'option4'].map((optionKey, index) => (
<button
key={optionKey}
type="button"
onClick={() =>
setQuestionForm((current) => ({ ...current, answer: optionKey }))
}
className={`option-buttons w-32 h-10 flex items-center justify-center border rounded bg-zinc-700 mt-4 ${questionForm.answer === optionKey ? 'text-green-500 chosen-Answer' : 'text-white'}`}
>
Option {index + 1}
</button>
))}
</div>
</div>
<div className="flex justify-center mt-4">
<button type="button" className="mt-4 p-2 bg-zinc-700 rounded text-yellow-400 mr-4" onClick={() => openTab('deck-container')}>
Close
</button>
<button type="submit" className="mt-4 p-2 bg-zinc-700 rounded ml-4 text-green-400">
Add
</button>
</div>
{questionStatus ? (
<div className="flex justify-center mt-2">
<p className={`mt-4 p-2 bg-zinc-700 rounded ${questionStatus.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>
{questionStatus}
</p>
</div>
) : null}
</form>
</div>

<div className={`webpage bg-zinc-900 p-6 rounded-lg shadow-lg max-w-screen flex-grow ${activeTab === 'adddisplay-option' ? 'block' : 'hidden'}`} id="adddisplay-option">
<h1 className="text-xl font-bold mb-4">Question Viewer</h1>
{displayQuestionData ? (
<div className="space-y-4">
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Question</label>
<textarea className="mb-3 w-2/3 p-2 border rounded bg-zinc-700 text-zinc-100" value={displayQuestionData.question} disabled />
</div>
{displayQuestionData.options.map((option, index) => (
<div className="flex items-center" key={option + index}>
<label className="w-1/3 text-blue-200">Option {index + 1}</label>
<textarea className="mb-3 w-2/3 p-2 border rounded bg-zinc-700 text-zinc-100" value={option} disabled />
</div>
))}
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Points/Marks Value</label>
<input className="mb-3 w-2/3 p-2 border rounded bg-zinc-700 text-zinc-100" value={displayQuestionData.points} disabled />
</div>
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Answer</label>
<div className="flex space-x-2">
{displayQuestionData.options.map((option, index) => (
<button
key={option + index}
type="button"
disabled
className={`option-buttons w-32 h-10 flex items-center justify-center border rounded bg-zinc-700 mt-4 ${option === displayQuestionData.answer ? 'text-green-500 chosen-Answer' : 'text-white'}`}
>
Option {index + 1}
</button>
))}
</div>
</div>
<div className="flex justify-center mt-4">
<button
type="button"
className="mt-4 p-2 bg-zinc-700 rounded text-yellow-400 mr-4"
onClick={() => openTab('deck-container')}
>
Close
</button>
<button
type="button"
className="mt-4 p-2 bg-zinc-700 rounded ml-4 text-red-500"
onClick={() => deleteQuestion(displayQuestionData.id, displayQuestionData.deck)}
>
Delete
</button>
</div>
</div>
) : null}
</div>

<div className={`webpage rounded-lg shadow-lg max-w-screen flex-grow ${activeTab === 'viewquestions-option' ? 'block' : 'hidden'}`} id="viewquestions-option">
<div className="flex justify-between items-center mb-4">
<h1 className="text-xl font-bold">Deck Viewer</h1>
<div className="flex items-center space-x-2">
<button id="prev-q" className="bg-green-500 p-2 rounded" disabled={viewQuestionPage === 0} onClick={() => setViewQuestionPage((page) => Math.max(page - 1, 0))}>
◄
</button>
<span id="q-page-count">Page {questionPages.length ? viewQuestionPage + 1 : 1} of {questionPages.length || 1}</span>
<button
id="next-q"
className="bg-green-500 p-2 rounded"
disabled={viewQuestionPage + 1 >= questionPages.length}
onClick={() =>
setViewQuestionPage((page) => Math.min(page + 1, Math.max(questionPages.length - 1, 0)))
}
>
►
</button>
</div>
<button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={() => openTab('deck-container')}>
Close
</button>
</div>
<hr />
<div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="questions">
{questionPageItems.map((question) => (
<button
key={question.id}
className="bg-zinc-700 text-blue-200 p-4 rounded-lg relative h-24"
onClick={() => {
setDisplayQuestionData(question)
setActiveTab('adddisplay-option')
}}
>
{question.question}
</button>
))}
</div>
</div>

<div className={`webpage rounded-lg shadow-lg max-w-screen inset-0 ${activeTab === 'help-container' ? 'block' : 'hidden'}`} id="help-container">
<p className="mb-2">
Instructions on how to create and share a quiz can be found{' '}
<a className="text-blue-500" target="_blank" rel="noreferrer" href="https://github.com/SinisterDeveloper/quiz-maker/wiki#Documentation">
here
</a>
</p>
<h1 className="text-2xl font-bold my-4">Beta Features</h1>
<h2 className="text-xl font-bold my-4">Quiz Background Image</h2>
<p className="my-4">
The server directly saves the uploaded image <em>without modification (resizing, compression, etc.)</em> to its storage and serves the image file as is to the quiz page.
</p>
<h1 className="text-2xl font-bold my-4">Contact</h1>
<p>
You may email me (<code className="font-mono bg-gray-700 p-1 rounded">thesinisterdev@gmail.com</code>) or{' '}
<em>
<a className="text-blue-500" target="_blank" rel="noreferrer" href="https://github.com/SinisterDeveloper/quiz-maker/issues">
raise an issue
</a>
</em>
</p>
</div>

<div className={`webpage bg-zinc-900 p-6 rounded-lg shadow-lg max-w-screen flex-grow ${activeTab === 'adddeck-option' ? 'block' : 'hidden'}`} id="adddeck-option">
<h1 className="text-xl font-bold mb-4">Add Deck</h1>
<form className="space-y-4" onSubmit={handleDeckCreate}>
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Deck Name</label>
<textarea
className="mb-3 w-2/3 p-2 border rounded bg-zinc-700 text-zinc-100"
required
value={deckForm.name}
onChange={(event) => setDeckForm((current) => ({ ...current, name: event.target.value }))}
/>
</div>
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Time Limit (in minutes)</label>
<input
type="number"
autoComplete="off"
required
className="mb-3 w-2/3 p-2 border rounded bg-zinc-700 text-zinc-100"
value={deckForm.timer}
onChange={(event) => setDeckForm((current) => ({ ...current, timer: event.target.value }))}
/>
</div>
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Conclusion Message</label>
<textarea
className="mb-3 w-2/3 p-2 border rounded bg-zinc-700 text-zinc-100"
required
value={deckForm.conclusion}
onChange={(event) =>
setDeckForm((current) => ({ ...current, conclusion: event.target.value }))
}
/>
</div>
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Require Email</label>
<div className="flex space-x-2">
{['Yes', 'No'].map((value) => (
<button
key={value}
type="button"
onClick={() => setDeckForm((current) => ({ ...current, email: value }))}
className={`option-buttons w-32 h-10 flex items-center justify-center border rounded bg-zinc-700 text-white mt-4 ${deckForm.email === value ? 'chosen-Email text-green-500' : ''}`}
>
{value}
</button>
))}
</div>
</div>
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Shuffle Questions</label>
<div className="flex space-x-2">
{['Yes', 'No'].map((value) => (
<button
key={value}
type="button"
onClick={() => setDeckForm((current) => ({ ...current, shuffle: value }))}
className={`option-buttons w-32 h-10 flex items-center justify-center border rounded bg-zinc-700 text-white mt-4 ${deckForm.shuffle === value ? 'chosen-Shuffle text-green-500' : ''}`}
>
{value}
</button>
))}
</div>
</div>
<div className="flex items-center">
<label className="w-1/3 text-blue-200">Quiz Background Image (Optional, BETA)</label>
<div className="flex space-x-2">
<label className="option-buttons w-20 h-10 flex items-center justify-center border rounded bg-zinc-700 text-zinc-100 mt-4 cursor-pointer">
{uploadedImage ? 'Uploaded' : 'Upload'}
<input
type="file"
accept="image/*"
className="hidden"
onChange={(event) => setUploadedImage(event.target.files?.[0] || null)}
/>
</label>
</div>
</div>
<div className="flex justify-center mt-4">
<button type="button" className="mt-4 p-2 bg-zinc-700 rounded text-yellow-400 mr-4" onClick={() => openTab('deck-container')}>
Close
</button>
<button type="submit" className="mt-4 p-2 bg-zinc-700 rounded ml-4 text-green-400">
Add
</button>
</div>
{deckStatus ? (
<div className="flex justify-center mt-2">
<p className={`mt-4 p-2 bg-zinc-700 rounded ${deckStatus.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>{deckStatus}</p>
</div>
) : null}
</form>
</div>

<div className={`webpage rounded-lg shadow-lg max-w-screen flex-grow ${activeTab === 'deck-container' ? 'block' : 'hidden'}`} id="deck-container">
<div id="DecksContainerTitle" className="flex justify-between items-center mb-4">
<h1 className="text-xl font-bold">Question Decks</h1>
<div className="flex items-center space-x-2">
<button id="prev-d" className="bg-green-500 p-2 rounded" disabled={deckPage === 0} onClick={() => setDeckPage((page) => Math.max(page - 1, 0))}>
◄
</button>
<span id="d-page-count">Page {deckPages.length ? deckPage + 1 : 1} of {deckPages.length || 1}</span>
<button
id="next-d"
className="bg-green-500 p-2 rounded"
disabled={deckPage + 1 >= deckPages.length}
onClick={() => setDeckPage((page) => Math.min(page + 1, Math.max(deckPages.length - 1, 0)))}
>
►
</button>
</div>
<button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" id="new-deck" onClick={() => openTab('adddeck-option')}>
New Deck
</button>
</div>
<hr />
<div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="decks">
{deckPageItems.map((deck) => {
const questionCount = getQuestionList(deck).length
return (
<div key={deck.id} className="bg-zinc-800 text-white p-4 rounded-lg relative deck-container">
<p className="absolute top-2 right-2 bg-zinc-700 px-2 py-1 rounded">#{deck.id}</p>
<div className="flex justify-between items-center mb-4">
<p className="text-lg font-semibold text-blue-300 w-full">{deck.name}</p>
</div>
<div className="space-y-2">
<button
onClick={() => {
setSelectedDeckForQuestion(deck.id)
openTab('addquestion-option')
}}
className="deck-option-button bg-zinc-700 p-3 rounded-lg w-full hover:bg-gray-900 text-blue-200"
>
Add Question
</button>
<button onClick={() => viewQuestions(deck)} className="deck-option-button bg-zinc-700 p-3 rounded-lg w-full hover:bg-gray-900 text-blue-200">
View Questions ({questionCount})
</button>
<button onClick={() => askToDeleteDeck(deck)} className="deck-option-button bg-zinc-700 p-3 rounded-lg w-full hover:bg-gray-900 text-blue-200">
Delete
</button>
<button
onClick={() => {
if (!questionCount) {
window.alert('This deck does not contain any questions yet!')
return
}
shareDeck(deck)
}}
className="deck-option-button bg-zinc-700 p-3 rounded-lg w-full hover:bg-gray-900 text-blue-200"
>
Share
</button>
</div>
</div>
)
})}
</div>
</div>

<div className={`webpage rounded-lg shadow-lg max-w-screen flex-grow ${activeTab === 'result-container' ? 'block' : 'hidden'}`} id="result-container">
<div id="ResultsContainerTitle" className="flex justify-between items-center mb-4">
<h1 className="text-xl font-bold">Results</h1>
<div className="flex items-center space-x-2">
<button id="prev-r" className="bg-green-500 p-2 rounded" disabled={resultPage === 0} onClick={() => setResultPage((page) => Math.max(page - 1, 0))}>
◄
</button>
<span id="r-page-count">Page {resultPages.length ? resultPage + 1 : 1} of {resultPages.length || 1}</span>
<button
id="next-r"
className="bg-green-500 p-2 rounded"
disabled={resultPage + 1 >= resultPages.length}
onClick={() => setResultPage((page) => Math.min(page + 1, Math.max(resultPages.length - 1, 0)))}
>
►
</button>
</div>
<button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" id="result-refresh" onClick={() => fetchResults()}>
Refresh
</button>
</div>
<hr />
<div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="results">
{resultPageItems.map((result) => (
<div key={result.id} className="bg-zinc-800 text-white p-4 rounded-lg relative deck-container">
<p className="absolute top-2 right-2 bg-zinc-700 px-2 py-1 rounded">#{result.id}</p>
<div className="flex flex-col items-center text-blue-200">
<p className="px-2 py-1 rounded w-full mb-2">Name: {result.name}</p>
<p className="px-2 py-1 rounded w-full mb-2">Email: {result.email || 'N/A'}</p>
<p className="px-2 py-1 rounded w-full mb-2">Score: {result.score}</p>
</div>
<div className="space-y-2">
<button className="result-option-button bg-zinc-700 p-3 rounded-lg w-full hover:bg-gray-900 text-blue-200" onClick={() => window.open(`/result?player=${result.id}`)}>
View Detailed Result
</button>
<button className="result-option-button bg-zinc-700 p-3 rounded-lg w-full hover:bg-gray-900 text-blue-200" onClick={() => deleteResult(result)}>
Delete Result
</button>
</div>
</div>
))}
</div>
</div>

<div className={`webpage flex flex-col rounded-lg shadow-lg max-w-screen flex-grow items-center justify-center select-none ${activeTab === 'dashboard' ? 'flex' : 'hidden'}`} id="dashboard">
<div className="absolute top-4 right-4 space-x-2">
<a href="https://github.com/SinisterDeveloper/quiz-maker?tab=readme-ov-file#setup-and-configuration" target="_blank" rel="noreferrer" className="bg-zinc-700 text-white py-2 px-4 rounded-md text-sm">
Watch Demo
</a>
<a href="https://github.com/SinisterDeveloper/quiz-maker/wiki" target="_blank" rel="noreferrer" className="bg-zinc-700 text-white py-2 px-4 rounded-md text-sm">
Guide
</a>
<a href="https://github.com/SinisterDeveloper/quiz-maker" target="_blank" rel="noreferrer" className="bg-zinc-700 text-white py-2 px-4 rounded-md text-sm">
View Repository
</a>
</div>
<h1 className="text-center text-7xl font-bold my-8">Quiz-Maker</h1>
<p className="text-center text-lg mb-8">Lightweight, AI-enhanced platform for effortless quiz creation and sharing with lightning-fast performance</p>
<div className="flex space-x-2">
<img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/SinisterDeveloper/quiz-maker?style=plastic&label=Version&logo=github" />
<img alt="CodeFactor Grade" src="https://img.shields.io/codefactor/grade/github/SinisterDeveloper/quiz-maker?style=plastic&logo=codefactor" />
<img alt="GitHub Issues" src="https://img.shields.io/github/issues/SinisterDeveloper/quiz-maker?style=plastic&logo=github&label=Issues&color=blue" />
<img alt="GitHub License" src="https://img.shields.io/github/license/SinisterDeveloper/quiz-maker?style=plastic&logo=github&color=blue" />
</div>
</div>
</div>
</div>
)
}

function QuizPage() {
const [deckId, setDeckId] = useState('')
const [metadata, setMetadata] = useState(null)
const [playerToken, setPlayerToken] = useState('')
const [playerInfo, setPlayerInfo] = useState(null)
const [playerName, setPlayerName] = useState('')
const [playerEmail, setPlayerEmail] = useState('')
const [submittedDetails, setSubmittedDetails] = useState(false)
const [questions, setQuestions] = useState([])
const [questionIndex, setQuestionIndex] = useState(0)
const [savedOption, setSavedOption] = useState('')
const [showInstructions, setShowInstructions] = useState(false)
const [timeLeft, setTimeLeft] = useState(0)

useEffect(() => {
const params = new URL(window.location.href).searchParams
const deck = params.get('deck')
if (!deck) {
window.location.assign('/')
return
}
setDeckId(deck)
}, [])

useEffect(() => {
if (!deckId) return
let active = true
request(`/quiz/metadata?deck=${deckId}`)
.then((response) => response.ok ? response.json() : null)
.then((data) => {
if (!data || !active) return
setMetadata(data)
document.title = data.name
})
return () => {
active = false
}
}, [deckId])

useEffect(() => {
if (!playerInfo?.timer) return undefined
const endTime = Date.now() + playerInfo.timer * 60 * 1000
setTimeLeft(endTime - Date.now())

const interval = window.setInterval(() => {
setTimeLeft(Math.max(endTime - Date.now(), 0))
}, 1000)

const timeout = window.setTimeout(() => {
submitQuiz()
}, playerInfo.timer * 60 * 1000)

return () => {
window.clearInterval(interval)
window.clearTimeout(timeout)
}
}, [playerInfo])

useEffect(() => {
if (!playerToken) return
const currentQuestion = questions[questionIndex]
if (!currentQuestion) {
setSavedOption('')
return
}
request(`/quiz/questions?question=${currentQuestion.id}`, {
headers: { Authorization: `Bearer ${playerToken}` },
})
.then((response) => response.ok ? response.json() : '')
.then((data) => {
setSavedOption(data || '')
})
}, [playerToken, questions, questionIndex])

const submitQuiz = async () => {
if (!playerToken || !deckId) return
const response = await request('/quiz/update', {
method: 'DELETE',
body: JSON.stringify({ timeEnded: Date.now(), deckId }),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${playerToken}`,
},
})
if (!response.ok) {
window.alert('Unable to save answers!')
return
}
window.location.assign(`/result?player=${playerToken}`)
}

const submitDetails = async (event) => {
event.preventDefault()
if (!deckId) return

const updateResponse = await request('/quiz/update', {
method: 'POST',
body: JSON.stringify({ deck: deckId }),
headers: { 'Content-type': 'application/json; charset=UTF-8' },
})
const updateData = await updateResponse.json()
setPlayerToken(updateData.token)
setPlayerInfo(updateData)

await request('/quiz/metadata', {
method: 'POST',
body: JSON.stringify({
name: trimUpper(playerName),
email: metadata?.email ? trimUpper(playerEmail) : '',
}),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${updateData.token}`,
},
})

const questionResponse = await request('/quiz/questions', {
headers: { Authorization: `Bearer ${updateData.token}` },
})
const questionData = await questionResponse.json()
setQuestions(Array.isArray(questionData) ? questionData : [])
setQuestionIndex(0)
setSubmittedDetails(true)
}

const currentQuestion = questions[questionIndex]
const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
const backgroundStyle =
metadata?.background === 'custom' && deckId ?
{ backgroundImage: `url(/img/BG_${deckId}.jpeg)`, backgroundSize: 'contain' }
: {}

const saveAnswer = async (option) => {
if (!playerToken || !currentQuestion) return
await request('/quiz/questions', {
method: 'PUT',
body: JSON.stringify({ id: currentQuestion.id, option }),
headers: {
'Content-type': 'application/json; charset=UTF-8',
Authorization: `Bearer ${playerToken}`,
},
})
setSavedOption(option)
}

return (
<>
<div id="details" className={`min-h-screen flex items-center justify-center ${metadata?.background === 'custom' ? '' : 'bg-gray-950'}`} style={backgroundStyle}>
<div className="p-8 rounded-lg shadow-lg text-gray-900 items-center" id="details-container">
{submittedDetails ? (
<p className="text-green-400 text-base mt-2">
Logged in as {trimUpper(playerName)}! Redirecting...
</p>
) : (
<form id="details-input" onSubmit={submitDetails}>
<input
className="w-full rounded-lg p-2 mb-4"
name="name"
required
placeholder="Enter Name"
value={playerName}
onChange={(event) => setPlayerName(event.target.value)}
/>
{metadata?.email ? (
<input
className="w-full rounded-lg p-2 mb-4"
name="email"
type="email"
placeholder="Enter Email"
required
value={playerEmail}
onChange={(event) => setPlayerEmail(event.target.value)}
/>
) : null}
<button className="w-full rounded-lg p-2 text-blue-300" type="submit">
Submit
</button>
</form>
)}
</div>
</div>

<div
className={`min-h-screen flex items-center justify-center question-container place-content-center ${metadata?.background === 'custom' ? '' : 'bg-gray-950'}`}
id="container"
style={{ ...backgroundStyle, display: submittedDetails ? 'flex' : 'none' }}
>
{showInstructions ? (
<div className="bg-zinc-900 text-white p-8 rounded-lg shadow-lg w-full max-w-md opacity-75" id="instructions">
<h1 className="text-2xl font-bold mb-4">Instructions</h1>
<hr className="my-4 border-gray-300" />
<ul className="list-none p-0 space-y-4">
<li>
<h3 className="text-lg">Each question is in multiple-choice format with four options. Click on an option to save your answer.</h3>
</li>
<li>
<h3 className="text-lg">To reset a saved answer, click the <code className="font-mono bg-gray-700 p-1 rounded">Clear</code> button.</h3>
</li>
<li>
<h3 className="text-lg">Use the <code className="font-mono bg-gray-700 p-1 rounded">Previous</code> and <code className="font-mono bg-gray-700 p-1 rounded">Next</code> buttons.</h3>
</li>
</ul>
<div className="flex justify-center mt-6">
<button id="instruction-ok" className="bg-gray-700 px-4 py-2 font-semibold rounded-lg shadow-md" onClick={() => setShowInstructions(false)}>
Ok
</button>
</div>
</div>
) : (
<div className="bg-zinc-900 text-white p-8 rounded-lg shadow-lg w-full max-w-md opacity-75" id="quiz-box">
<button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded absolute top-4 right-4" id="submit" onClick={() => {
if (window.confirm('Are you sure you want to submit the quiz?')) submitQuiz()
}}>
Submit
</button>
<button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded absolute top-4 left-4" id="instructions-button" onClick={() => setShowInstructions(true)}>
Instructions
</button>
<h2 className="text-center text-xl mb-4" id="quiz-name">{metadata?.name || 'QUIZ NAME'}</h2>
<hr className="border-t border-zinc-500 mb-4" />
<p className="text-center text-lg font-bold mb-4" id="question">{currentQuestion?.question || 'QUESTION TEXT'}</p>
<div className="space-y-4 answer-buttons" id="options">
{currentQuestion?.options?.map((option) => (
<button
key={option}
className={`bg-zinc-800 text-white p-2 rounded w-full answer-button ${savedOption === option ? 'chosen-answer' : ''}`}
onClick={() => saveAnswer(option)}
>
{option}
</button>
))}
</div>
<hr className="border-t border-zinc-500 mt-4 mb-2" />
<div className="flex justify-between text-sm">
<span id="status">Question {questions.length ? questionIndex + 1 : 0} of {questions.length}</span>
<span id="timer">{minutes}m {seconds}s</span>
</div>
<div className="flex justify-between mt-4">
<button
className="bg-blue-500 text-white px-2 py-2 rounded hover:bg-blue-600"
id="previous-question"
disabled={questionIndex === 0}
onClick={() => setQuestionIndex((index) => Math.max(index - 1, 0))}
>
Previous
</button>
<button
className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
style={{ display: savedOption ? 'flex' : 'none' }}
id="clear-selected"
onClick={() => saveAnswer('')}
>
Clear
</button>
<button
className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
id="next-question"
disabled={questionIndex + 1 >= questions.length}
onClick={() => setQuestionIndex((index) => Math.min(index + 1, Math.max(questions.length - 1, 0)))}
>
Next
</button>
</div>
</div>
)}
</div>
</>
)
}

function ResultPage() {
const [stats, setStats] = useState(null)
const [answers, setAnswers] = useState([])
const [showPerformance, setShowPerformance] = useState(false)

useEffect(() => {
const params = new URL(window.location.href).searchParams
const player = params.get('player')
if (!player) return
request(`/quiz/result?player=${player}`)
.then((response) => response.ok ? response.json() : null)
.then((data) => {
if (!data?.stats) return
setStats(data.stats)
setAnswers(Array.isArray(data.answers) ? data.answers : [])
})
}, [])

const duration = useMemo(() => {
if (!stats) return 'Loading...'
const rawDuration = stats.timeEnded - stats.timeStarted
const min = Math.trunc(rawDuration / 60000)
const sec = Math.trunc(rawDuration / 1000 - 60 * min)
return `${min} minutes, ${sec} seconds`
}, [stats])

return (
<div className="bg-gray-950 min-h-screen">
{!showPerformance ? (
<div className="webpage text-white" id="result-page">
<div style={{ textAlign: 'center' }}>
<h1 className="text-3xl">Results:</h1>
<br />
<hr />
<table className="border-separate border-spacing-2 w-full border border-gray-500 bg-slate-900 text-sm shadow-sm">
<tbody>
<tr>
<th className="bg-gray-700 w-1/6 border border-gray-600 font-semibold p-4 text-gray-200">Name</th>
<td className="w-1/2 border border-gray-600 p-4 text-gray-200" id="name">{stats?.name || 'Loading...'}</td>
</tr>
<tr>
<th className="bg-gray-700 w-1/6 border border-gray-600 font-semibold p-4 text-gray-200">Email</th>
<td className="w-1/2 border border-gray-600 p-4 text-gray-200" id="email">{stats?.email || 'Loading...'}</td>
</tr>
<tr>
<th className="bg-gray-700 w-1/6 border border-gray-600 font-semibold p-4 text-gray-200">Time Started</th>
<td className="w-1/2 border border-gray-600 p-4 text-gray-200" id="timeStarted">
{stats ? new Date(parseInt(stats.timeStarted, 10)).toLocaleTimeString().toUpperCase() : 'Loading...'}
</td>
</tr>
<tr>
<th className="bg-gray-700 w-1/6 border border-gray-600 font-semibold p-4 text-gray-200">Time Ended</th>
<td className="w-1/2 border border-gray-600 p-4 text-gray-200" id="timeEnded">
{stats ? new Date(parseInt(stats.timeEnded, 10)).toLocaleTimeString().toUpperCase() : 'Loading...'}
</td>
</tr>
<tr>
<th className="bg-gray-700 w-1/6 border border-gray-600 font-semibold p-4 text-gray-200">Duration</th>
<td className="w-1/2 border border-gray-600 p-4 text-gray-200" id="duration">{duration}</td>
</tr>
<tr>
<th className="bg-gray-700 w-1/6 border border-gray-600 font-semibold p-4 text-gray-200">Score</th>
<td className="w-1/2 border border-gray-600 p-4 text-gray-200" id="score">{stats ? `${stats.score}` : 'Loading...'}</td>
</tr>
</tbody>
</table>
<button className="bg-zinc-700 p-3 rounded-lg hover:bg-gray-950 text-blue-200 absolute top-1 right-1" onClick={() => setShowPerformance(true)}>
Question-wise Performance
</button>
<p id="conclusion" className="mt-3">{stats?.conclusion || ''}</p>
</div>
</div>
) : (
<div className="webpage flex justify-center items-center relative text-white" id="performance-page">
<div style={{ textAlign: 'center' }}>
<h1 className="text-3xl">Question-Wise Performance:</h1>
<br />
<button className="bg-zinc-700 p-3 rounded-lg hover:bg-gray-950 text-blue-200 mb-3 absolute left-1 top-1" onClick={() => setShowPerformance(false)}>
Back
</button>
<hr />
<table className="border-separate border-spacing-2 w-full border border-gray-500 bg-slate-900 text-sm shadow-sm">
<thead className="bg-gray-700">
<tr>
<th className="w-1/4 border border-gray-600 font-semibold p-4 text-gray-200">Question</th>
<th className="w-1/4 border border-gray-600 font-semibold p-4 text-gray-200">Correct Answer</th>
<th className="w-1/4 border border-gray-600 font-semibold p-4 text-gray-200">User Answer</th>
<th className="w-1/4 border border-gray-600 font-semibold p-4 text-gray-200">Points Awarded</th>
</tr>
</thead>
<tbody id="question-list">
{answers.map((answer, index) => (
<tr key={`${answer.question}-${index}`}>
<td className="w-1/4 border border-gray-600 p-4 text-gray-200">{answer.question}</td>
<td className="w-1/4 border border-gray-600 p-4 text-gray-200">{answer.correctAnswer}</td>
<td className="w-1/4 border border-gray-600 p-4 text-gray-200">{answer.userAnswer}</td>
<td className="w-1/4 border border-gray-600 p-4 text-gray-200">{answer.pointsAwarded}</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)}
</div>
)
}

function App() {
useEffect(() => {
document.addEventListener('contextmenu', (event) => {
event.preventDefault()
})
}, [])

const path = window.location.pathname.toLowerCase()

if (path === '/quiz') return <QuizPage />
if (path === '/result') return <ResultPage />
return <DashboardPage />
}

export default App
