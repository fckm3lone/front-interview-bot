// bot.js - main file of a project (start point)

import env from 'dotenv';
env.config();
import express from 'express';
import { Bot, Keyboard, GrammyError, HttpError, InlineKeyboard, webhookCallback } from 'grammy';
import { getRandomQuestion, getCorrectAnswer } from './utils.js';

const bot = new Bot(process.env.BOT_API_KEY);
const app = express();

// Обработчик /start
bot.command('start', async (ctx) => {
    const startKeyboard = new Keyboard()
        .text('HTML')
        .text('CSS')
        .row()
        .text('JavaScript')
        .text('React')
        .row()
        .text('Случайный вопрос')
        .resized();

    await ctx.reply('Салют! Я твой личный Interview Study Bot 🤖\nЯ буду помогать тебе готовиться к собеседованию!');
    await ctx.reply('С чего начнём? Выбери тему вопросов в меню 👇', {
        reply_markup: startKeyboard,
    });
});

// Обработка выбора темы
bot.hears(['HTML', 'CSS', 'JavaScript', 'React', 'Случайный вопрос'], async (ctx) => {
    const topic = ctx.message.text.toLowerCase();
    const { question, questionTopic } = getRandomQuestion(topic);

    let inlineKeyboard;
    if (question.hasOptions) {
        const buttonRows = question.options.map(option => [
            InlineKeyboard.text(
                option.text,
                JSON.stringify({
                    questionId: question.id,
                    type: `${questionTopic}-option`,
                    isCorrect: option.isCorrect,
                })
            ),
        ]);

        inlineKeyboard = InlineKeyboard.from(buttonRows);
    } else {
        inlineKeyboard = new InlineKeyboard().text('Узнать ответ', JSON.stringify({
            type: `${questionTopic}`,
            questionId: question.id,
        }));
    }

    await ctx.reply(question.text, {
        reply_markup: inlineKeyboard,
    });
});

// Обработка кликов по кнопкам
bot.on('callback_query:data', async (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);

    if (!callbackData.type.includes('option')) {
        const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
        await ctx.reply(answer, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });
        await ctx.answerCallbackQuery();
        return;
    }

    if (callbackData.isCorrect) {
        await ctx.reply('Верно ✅');
        await ctx.answerCallbackQuery();
        return;
    }

    const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.questionId);
    await ctx.reply(`Неверно ❌. Правильный ответ: ${answer}`);
    await ctx.answerCallbackQuery();
});

// Обработка ошибок
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error('Error in request:', e.description);
    } else if (e instanceof HttpError) {
        console.error('Could not contact Telegram:', e);
    } else {
        console.error('Unknown error:', e);
    }
});

// === Важно для деплоя на Railway ===

// Превращаем бота в обработчик webhook
app.use(express.json());
app.use(webhookCallback(bot, 'express'));

// Railway автоматически подставит PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Bot is running on port ${port}`));