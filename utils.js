import questions from './questions.json' with {type: 'json'}

const getRandomQuestion = (topic) => {
    let questionTopic = topic.toLowerCase()
    if (questionTopic === 'случайный вопрос') {
        questionTopic = Object.keys(questions)[ Math.floor(
            Math.random() * Object.keys(questions).length-1)]
    }
    const randomQuestionIndex = Math.floor(
        Math.random() * questions[questionTopic].length)

    return {
        question: questions[questionTopic][randomQuestionIndex],
        questionTopic,
    }
}

const getCorrectAnswer = (topic, id) => {
    const questionTopic = topic.toLowerCase()
   const question = questions[questionTopic].find(question => question.id === id)

    if (!question.hasOptions) {
        return question.answer
    }

    return question.options.find(option => option.isCorrect).text
}

export  {getRandomQuestion, getCorrectAnswer}