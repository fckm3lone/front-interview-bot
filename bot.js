// bot.js - main file of a project (start point)

import env from 'dotenv'
env.config()
import {Bot, Keyboard, GrammyError, HttpError, InlineKeyboard} from 'grammy'
import {getRandomQuestion, getCorrectAnswer} from './utils.js'

const bot = new Bot(process.env.BOT_API_KEY)

bot.command('start', async (ctx, message) => {
    const startKeyboard = new Keyboard()
        .text('HTML')
        .text('CSS')
        .row()
        .text('JavaScript')
        .text('React')
        .row()
        .text('Случайный вопрос')
        .resized()
    await ctx.reply('Салют! Я твой личный Interview Study Bot 🤖\n' +
        'Я буду помогать тебе готовиться к собеседованию!')
    await ctx.reply('С чего начнём? Выбери тему вопросов в меню 👇', {
        reply_markup: startKeyboard,
    })
})

bot.hears(['HTML', 'CSS', 'JavaScript', 'React', 'Случайный вопрос'], async (ctx, message) => {

    let topic = ctx.message.text.toLowerCase()
    const {question, questionTopic} = getRandomQuestion(topic)
    let inlineKeyboard;

    if (question.hasOptions) {
        const buttonRows = question.options.map(option => [
            InlineKeyboard.text(
                option.text, JSON.stringify({
                    questionId: question.id,
                    type: `${questionTopic}-option`,
                    isCorrect: option.isCorrect,
                    })
            )
        ])

        inlineKeyboard = InlineKeyboard.from(buttonRows)
    } else {
        inlineKeyboard = new InlineKeyboard()
            .text('Узнать ответ', JSON.stringify({
                type: `${questionTopic}`,
                questionId: question.id,
            }))

    }

    await ctx.reply(question.text, {
        reply_markup: inlineKeyboard,
    })
})

bot.on('callback_query:data', async (ctx, message) => {

    const callbackData = JSON.parse(ctx.callbackQuery.data)

    if (!callbackData.type.includes('option')) {
        const answer = getCorrectAnswer(callbackData.type, callbackData.questionId)
        await ctx.reply(answer, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        })
        await cxt.answerCallbackQuery()
        return
    }

    if (callbackData.isCorrect) {
        await ctx.reply('Верно ✅')
        await cxt.answerCallbackQuery()
        return
    }

    const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.questionId)
    await ctx.reply(`Неверно ❌. Правильный ответ: ${answer}`)
    await ctx.answerCallbackQuery()
})

// Обработка ошибок
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
});

bot.start()
