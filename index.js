const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const app = express();

const API_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(API_TOKEN, { polling: true });

// معرفات القنوات الخاصة بكل مادة
const channelIDs = {
    'رياضيات': '@math_channel',
    'فيزياء': '@physics_channel',
    'كيمياء': '@chemistry_channel',
    'برمجة': '@programming_channel'
};

// التعامل مع أمر /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `🌟 مرحباً بك في بوت الملخصات الجامعية 🌟\n\n🔹 مطور البوت: قاسم الشميري\n\nاختر المادة المطلوبة من الأزرار أدناه.`;

    bot.sendMessage(chatId, welcomeText, {
        reply_markup: {
            keyboard: [
                [{ text: 'رياضيات' }, { text: 'فيزياء' }],
                [{ text: 'كيمياء' }, { text: 'برمجة' }],
                [{ text: '📄 العودة إلى القائمة الرئيسية' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
});

// دالة لجلب ملفات PDF من قناة معينة
async function getPDFFilesFromChannel(channelUsername) {
    const url = `https://api.telegram.org/bot${API_TOKEN}/getUpdates`;

    try {
        const response = await axios.get(url);
        const updates = response.data.result;

        const pdfFiles = [];

        // البحث عن جميع الرسائل التي تحتوي على ملفات PDF من القناة المطلوبة
        for (let i = 0; i < updates.length; i++) {
            const update = updates[i];
            if (update.message && update.message.chat && update.message.chat.username === channelUsername) {
                // تحقق إذا كانت الرسالة تحتوي على وثيقة PDF
                if (update.message.document && update.message.document.mime_type === 'application/pdf') {
                    pdfFiles.push(update.message.message_id);
                }
            }
        }

        return pdfFiles;
    } catch (error) {
        console.error('Error fetching updates:', error);
    }

    return [];
}

// التعامل مع اختيار المادة وإرسال ملفات PDF من القناة
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (['رياضيات', 'فيزياء', 'كيمياء', 'برمجة'].includes(text)) {
        const channelUsername = channelIDs[text];
        if (channelUsername) {
            const pdfMessageIds = await getPDFFilesFromChannel(channelUsername);
            if (pdfMessageIds.length > 0) {
                for (const messageId of pdfMessageIds) {
                    // إعادة توجيه كل رسالة تحتوي على ملف PDF من القناة الخاصة
                    bot.forwardMessage(chatId, channelUsername, messageId);
                }
            } else {
                bot.sendMessage(chatId, 'لم يتم العثور على ملفات PDF في القناة.');
            }
        } else {
            bot.sendMessage(chatId, 'القناة غير موجودة.');
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
