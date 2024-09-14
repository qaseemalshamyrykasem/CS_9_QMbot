const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const app = express();

const API_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(API_TOKEN, { polling: true });

// معرفات القنوات الخاصة بكل مادة
const channels = {
    'علوم الحاسوب': {
        'السنة الأولى': {
            'الفصل الأول': {
                'رياضيات': '@Dev_Qm_Start',
                'برمجة': '@programming_channel'
            },
            'الفصل الثاني': {
                'فيزياء': '@physics_channel',
                'كيمياء': '@chemistry_channel'
            }
        },
        'السنة الثانية': {
            'الفصل الأول': {
                'شبكات': '@network_channel',
                'هندسة البرمجيات': '@software_engineering_channel'
            },
            'الفصل الثاني': {
                'ذكاء اصطناعي': '@ai_channel',
                'قواعد البيانات': '@db_channel'
            }
        }
    },
    'الأمن السيبراني': {
        'السنة الأولى': {
            'الفصل الأول': {
                'أمن الشبكات': '@network_security_channel',
                'تشغيل أنظمة': '@os_channel'
            },
            'الفصل الثاني': {
                'تحليل البيانات': '@data_analysis_channel',
                'أمن المعلومات': '@info_security_channel'
            }
        }
    }
};

// التعامل مع أمر /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `🌟 مرحباً بك في بوت الملخصات الجامعية 🌟\n\nاختر التخصص باستخدام الأزرار أدناه.`;

    bot.sendMessage(chatId, welcomeText, {
        reply_markup: {
            keyboard: [
                ['علوم الحاسوب', 'الأمن السيبراني'],
                ['⬅️ الرجوع']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
});

// التعامل مع اختيار التخصص
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // زر الرجوع
    if (text === '⬅️ الرجوع') {
        bot.sendMessage(chatId, 'تم العودة إلى القائمة الرئيسية', {
            reply_markup: {
                keyboard: [
                    ['علوم الحاسوب', 'الأمن السيبراني'],
                    ['⬅️ الرجوع']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        });
        return;
    }

    // التخصصات
    if (channels[text]) {
        const years = Object.keys(channels[text]);
        const yearButtons = years.map(year => [year]);
        yearButtons.push(['⬅️ الرجوع']);

        bot.sendMessage(chatId, `اختر السنة الدراسية لمادة ${text}:`, {
            reply_markup: {
                keyboard: yearButtons,
                resize_keyboard: true,
                one_time_keyboard: false
            }
        });
        return;
    }

    // السنوات
    for (const major in channels) {
        if (channels[major][text]) {
            const terms = Object.keys(channels[major][text]);
            const termButtons = terms.map(term => [term]);
            termButtons.push(['⬅️ الرجوع']);

            bot.sendMessage(chatId, `اختر الفصل الدراسي للسنة ${text} في ${major}:`, {
                reply_markup: {
                    keyboard: termButtons,
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            });
            return;
        }
    }

    // الفصول
    for (const major in channels) {
        for (const year in channels[major]) {
            if (channels[major][year][text]) {
                const subjects = Object.keys(channels[major][year][text]);
                const subjectButtons = subjects.map(subject => [subject]);
                subjectButtons.push(['⬅️ الرجوع']);

                bot.sendMessage(chatId, `اختر المادة للفصل ${text} في ${major}:`, {
                    reply_markup: {
                        keyboard: subjectButtons,
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                });
                return;
            }
        }
    }

    // جلب الملفات من القناة المختارة
    for (const major in channels) {
        for (const year in channels[major]) {
            for (const term in channels[major][year]) {
                if (channels[major][year][term][text]) {
                    const channelUsername = channels[major][year][term][text];
                    const pdfFiles = await getPDFFilesFromChannel(channelUsername);
                    if (pdfFiles.length > 0) {
                        for (const file of pdfFiles) {
                            bot.sendDocument(chatId, file);
                        }
                    } else {
                        bot.sendMessage(chatId, 'لم يتم العثور على ملفات PDF في القناة.');
                    }
                    return;
                }
            }
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

        for (let i = 0; i < updates.length; i++) {
            const update = updates[i];
            if (update.channel_post && update.channel_post.chat && update.channel_post.chat.username === channelUsername) {
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
