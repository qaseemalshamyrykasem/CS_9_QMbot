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

// التعامل مع أمر /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `🌟 مرحباً بك في بوت الملخصات الجامعية 🌟\n\n🔹 مطور البوت: قاسم الشميري\n\nاختر المادة المطلوبة باستخدام الأزرار أدناه.`;

    bot.sendMessage(chatId, welcomeText, {
        reply_markup: {
            keyboard: [
                ['رياضيات', 'فيزياء'],
                ['كيمياء', 'برمجة'],
                ['⬅️ الرجوع']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
});

// التعامل مع الرسائل من المستخدم
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // زر الرجوع
    if (text === '⬅️ الرجوع') {
        bot.sendMessage(chatId, 'تم العودة إلى القائمة الرئيسية', {
            reply_markup: {
                keyboard: [
                    ['رياضيات', 'فيزياء'],
                    ['كيمياء', 'برمجة'],
                    ['⬅️ الرجوع']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        });
        return;
    }

    if (['رياضيات', 'فيزياء', 'كيمياء', 'برمجة'].includes(text)) {
        const channelUsername = channelIDs[text];
        if (channelUsername) {
            const pdfFiles = await getPDFFilesFromChannel(channelUsername);
            if (pdfFiles.length > 0) {
                for (const file of pdfFiles) {
                    // إعادة توجيه كل رسالة تحتوي على ملف PDF من القناة الخاصة
                    bot.sendDocument(chatId, file);
                }
            } else {
                bot.sendMessage(chatId, 'لم يتم العثور على ملفات PDF في القناة.');
            }
        } else {
            bot.sendMessage(chatId, 'القناة غير موجودة.');
        }
    }
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
            if (update.channel_post && update.channel_post.chat && update.channel_post.chat.username === channelUsername) {
                // تحقق إذا كانت الرسالة تحتوي على وثيقة PDF
                if (update.channel_post.document && update.channel_post.document.mime_type === 'application/pdf') {
                    pdfFiles.push(update.channel_post.document.file_id);
                }
            }
        }

        return pdfFiles;
    } catch (error) {
        console.error('Error fetching updates:', error);
    }

    return [];
}

// إعداد نقطة نهاية لمراقبة حالة الخادم
app.get('/', (req, res) => {
    res.send("<b>telegram @DEV_QM</b>");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
