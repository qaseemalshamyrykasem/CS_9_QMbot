const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const app = express();

const API_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(API_TOKEN, { polling: true });

// معرفات القنوات الخاصة بكل مادة
const channelIDs = {
    'رياضيات': '@Dev_Qm_Start',
    'فيزياء': '@physics_channel',
    'كيمياء': '@chemistry_channel',
    'برمجة': '@programming_channel'
};

// حالة المستخدم لتتبع المستوى الحالي
const userState = {};

// التعامل مع أمر /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `
🌟 *مرحباً بك في بوت الملخصات الجامعية* 🌟

🔹 *مطور البوت*: _قاسم الشميري_ 🛠️

📚 *اختر القسم المطلوب باستخدام الأزرار أدناه*:
    `;

    bot.sendMessage(chatId, welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🖥️ قسم علوم الحاسوب', callback_data: 'cs' }],
                [{ text: '🔐 قسم الأمن السيبراني', callback_data: 'cyber' }]
            ]
        }
    });

    // حفظ حالة المستخدم
    userState[chatId] = 'main_menu';
});

// دالة لجلب جميع الرسائل التي تحتوي على ملفات من قناة معينة
async function getAllFilesFromChannel(channelUsername) {
    const url = `https://api.telegram.org/bot${API_TOKEN}/getUpdates`;

    try {
        const response = await axios.get(url);
        const updates = response.data.result;

        const files = [];

        // البحث عن جميع الرسائل التي تحتوي على ملفات من القناة المطلوبة
        for (let i = 0; i < updates.length; i++) {
            const update = updates[i];
            if (update.message && update.message.chat && update.message.chat.username === channelUsername) {
                // تحقق إذا كانت الرسالة تحتوي على ملف (وثيقة PDF، صورة، فيديو)
                if (update.message.document || update.message.photo || update.message.video) {
                    files.push(update.message.message_id);
                }
            }
        }

        return files;
    } catch (error) {
        console.error('Error fetching updates:', error);
    }

    return [];
}

// التعامل مع الرد على الأزرار
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    // التحقق من القسم المختار
    if (data === 'cs' || data === 'cyber') {
        const department = data === 'cs' ? 'علوم الحاسوب' : 'الأمن السيبراني';
        bot.editMessageText(`📅 *اختر السنة في قسم ${department}*:`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'سنة أولى', callback_data: `year_${data}_1` }, { text: 'سنة ثانية', callback_data: `year_${data}_2` }],
                    [{ text: 'سنة ثالثة', callback_data: `year_${data}_3` }, { text: 'سنة رابعة', callback_data: `year_${data}_4` }],
                    [{ text: '🔙 رجوع', callback_data: 'back_main' }]
                ]
            }
        });

        // حفظ حالة المستخدم
        userState[chatId] = { type: 'department_selection', department };
    }

    // التعامل مع الرجوع
    else if (data === 'back_main') {
        bot.editMessageText(`
🌟 *مرحباً بك في بوت الملخصات الجامعية* 🌟

🔹 *مطور البوت*: _قاسم الشميري_ 🛠️

📚 *اختر القسم المطلوب باستخدام الأزرار أدناه*:
        `, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🖥️ قسم علوم الحاسوب', callback_data: 'cs' }],
                    [{ text: '🔐 قسم الأمن السيبراني', callback_data: 'cyber' }]
                ]
            }
        });

        // تحديث حالة المستخدم
        userState[chatId] = 'main_menu';
    }

    // التعامل مع اختيار السنة
    else if (data.startsWith('year_')) {
        const [_, dept, year] = data.split('_');
        const department = dept === 'cs' ? 'علوم الحاسوب' : 'الأمن السيبراني';

        bot.editMessageText(`📚 *اختر الترم في السنة ${year} في قسم ${department}*:`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📘 ترم أول', callback_data: `term_${dept}_${year}_1` }, { text: '📗 ترم ثاني', callback_data: `term_${dept}_${year}_2` }],
                    [{ text: '🔙 رجوع', callback_data: `back_year_${dept}` }]
                ]
            }
        });

        // تحديث حالة المستخدم
        userState[chatId] = { type: 'year_selection', department, year };
    }

    // التعامل مع اختيار الترم
    else if (data.startsWith('term_')) {
        const [_, dept, year, term] = data.split('_');
        const department = dept === 'cs' ? 'علوم الحاسوب' : 'الأمن السيبراني';

        bot.editMessageText(`📓 *اختر المادة في الترم ${term === '1' ? 'الأول' : 'الثاني'} في السنة ${year} في قسم ${department}*:`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'رياضيات', callback_data: `subject_math_${dept}_${year}_${term}` }, { text: 'فيزياء', callback_data: `subject_physics_${dept}_${year}_${term}` }],
                    [{ text: 'كيمياء', callback_data: `subject_chem_${dept}_${year}_${term}` }, { text: 'برمجة', callback_data: `subject_prog_${dept}_${year}_${term}` }],
                    [{ text: '🔙 رجوع', callback_data: `back_term_${dept}_${year}` }]
                ]
            }
        });

        // تحديث حالة المستخدم
        userState[chatId] = { type: 'term_selection', department, year, term };
    }

    // التعامل مع اختيار المادة وجلب الملفات
    else if (data.startsWith('subject_')) {
        const [_, subject, dept, year, term] = data.split('_');
        const subjectName = subject === 'math' ? 'رياضيات' : subject === 'physics' ? 'فيزياء' : subject === 'chem' ? 'كيمياء' : 'برمجة';
        const channelUsername = channelIDs[subjectName];

        const fileMessageIds = await getAllFilesFromChannel(channelUsername);
        if (fileMessageIds.length > 0) {
            for (const messageId of fileMessageIds) {
                bot.forwardMessage(chatId, channelUsername, messageId);
            }
        } else {
            bot.sendMessage(chatId, `لم يتم العثور على ملفات لمادة ${subjectName}.`);
        }
    }
});

// إعداد نقطة نهاية لمراقبة حالة الخادم
app.get('/', (req, res) => {
    res.send("<b>telegram @DEV_QM</b>");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
