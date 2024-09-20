const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const app = express();

const API_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(API_TOKEN, { polling: true });

const channels = {
    'رياضيات': {
        'د. مالك الجبري': '@Dev_Qm_Start',
        'أ. علياء الشميري': '@math_alya_channel'
    },
    'فيزياء': {
        'د. مالك الجبري': '@physics_malek_channel',
        'أ. علياء الشميري': '@physics_alya_channel'
    },
    'كيمياء': {
        'د. مالك الجبري': '@chemistry_malek_channel',
        'أ. علياء الشميري': '@chemistry_alya_channel'
    },
    'برمجة': {
        'د. مالك الجبري': '@programming_malek_channel',
        'أ. علياء الشميري': '@programming_alya_channel'
    }
};

// التعامل مع أمر /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `✨🌟 مرحباً بك في بوت الملخصات الجامعية 🌟✨\n\nاختر القسم المطلوب باستخدام الأزرار أدناه.`;

    bot.sendMessage(chatId, welcomeText, {
        reply_markup: {
            keyboard: [
                [{ text: '🖥️ قسم علوم الحاسوب' }, { text: '🔬 قسم الكيمياء' }],
                [{ text: '🔭 قسم الفيزياء' }, { text: '🧮 قسم الرياضيات' }],
                [{ text: '🔙 العودة إلى القائمة الرئيسية' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
});

// التعامل مع اختيار المادة وإرسال الأزرار للأستاذين
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (channels[text]) {
        bot.sendMessage(chatId, `اختر أستاذ المادة:`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'د. مالك الجبري', callback_data: `${text}_مالك` }],
                    [{ text: 'أ. علياء الشميري', callback_data: `${text}_علياء` }],
                    [{ text: '🔙 العودة إلى القائمة الرئيسية', callback_data: 'back' }]
                ]
            }
        });
    } else if (text === '🔙 العودة إلى القائمة الرئيسية') {
        bot.sendMessage(chatId, 'تم الرجوع إلى القائمة الرئيسية.', {
            reply_markup: {
                keyboard: [
                    [{ text: '🖥️ قسم علوم الحاسوب' }, { text: '🔬 قسم الكيمياء' }],
                    [{ text: '🔭 قسم الفيزياء' }, { text: '🧮 قسم الرياضيات' }],
                    [{ text: '🔙 العودة إلى القائمة الرئيسية' }]
                ],
                resize_keyboard: true
            }
        });
    }
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
                // تحقق إذا كانت الرسالة تحتوي على ملف (وثيقة PDF)
                if (update.message.document) {
                    files.push({
                        file_id: update.message.document.file_id,
                        caption: update.message.caption || 'بدون عنوان'
                    });
                }
            }
        }

        return files;
    } catch (error) {
        console.error('Error fetching updates:', error);
    }

    return [];
}

// التعامل مع ضغط زر الأستاذ وجلب الملفات من قناة الأستاذ
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data.split('_'); // تجزئة النص لمعرفة المادة والأستاذ

    if (data[1] === 'مالك' || data[1] === 'علياء') {
        const subject = data[0];
        const professor = data[1] === 'مالك' ? 'د. مالك الجبري' : 'أ. علياء الشميري';
        const channelUsername = channels[subject][professor];

        const files = await getAllFilesFromChannel(channelUsername);
        if (files.length > 0) {
            for (const file of files) {
                // إرسال كل ملف مباشرة بدلاً من إعادة توجيه الرسالة
                bot.sendDocument(chatId, file.file_id, { caption: file.caption });
            }
        } else {
            bot.sendMessage(chatId, 'لم يتم العثور على ملفات في القناة.');
        }
    } else if (data[0] === 'back') {
        bot.sendMessage(chatId, 'تم الرجوع إلى القائمة الرئيسية.', {
            reply_markup: {
                keyboard: [
                    [{ text: '🖥️ قسم علوم الحاسوب' }, { text: '🔬 قسم الكيمياء' }],
                    [{ text: '🔭 قسم الفيزياء' }, { text: '🧮 قسم الرياضيات' }],
                    [{ text: '🔙 العودة إلى القائمة الرئيسية' }]
                ],
                resize_keyboard: true
            }
        });
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