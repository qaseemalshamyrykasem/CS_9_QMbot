const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const app = express();

const API_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(API_TOKEN, { polling: true });

// 📢 معلومات المطور
const developerInfo = `
👨‍💻 مطور البوت: قاسم الشميري
✉️ للتواصل: @DEV_QM

🔧 بوت ملخصات جامعية شامل ومتكامل يساعدك في الوصول إلى المواد الدراسية بسهولة وسرعة. قم باختيار المادة المناسبة، ثم اختر الأستاذ للحصول على الملخصات المرتبطة بالمواد.`;


// 🖥️ معرفات القنوات لكل أستاذ في كل مادة
const channels = {
    '🖥️ علوم الحاسوب': {
        '📚 السنة الأولى': {
            '📖 الفصل الأول': {
                '📐 رياضيات': {
                    '📘 د. مالك الجبري': '@Dev_Qm_Start',
                    '📗 أ. علياء الشميري': '@math_aly_channel'
                },
                '💻 برمجة': {
                    '📘 د. مالك الجبري': '@programming_malek_channel',
                    '📗 أ. علياء الشميري': '@programming_aly_channel'
                }
            },
            '📖 الفصل الثاني': {
                '🔬 فيزياء': {
                    '📘 د. مالك الجبري': '@physics_malek_channel',
                    '📗 أ. علياء الشميري': '@physics_aly_channel'
                },
                '🧪 كيمياء': {
                    '📘 د. مالك الجبري': '@chemistry_malek_channel',
                    '📗 أ. علياء الشميري': '@chemistry_aly_channel'
                }
            }
        },
        // يمكنك متابعة باقي السنوات والتخصصات بنفس النمط
    }
};

// ✨ التعامل مع أمر /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `🌟 أهلاً وسهلاً بك في بوت الملخصات الجامعية 🎓\n\n${developerInfo}`;

    bot.sendMessage(chatId, welcomeText, {
        reply_markup: {
            keyboard: [
                [{ text: '🖥️ علوم الحاسوب' }, { text: '🔐 الأمن السيبراني' }],
                [{ text: '⬅️ الرجوع إلى القائمة الرئيسية' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
});

// 🗂️ التعامل مع اختيار التخصص
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // 🔙 زر الرجوع
    if (text === '⬅️ الرجوع إلى القائمة الرئيسية') {
        bot.sendMessage(chatId, '🔙 تم العودة إلى القائمة الرئيسية', {
            reply_markup: {
                keyboard: [
                    [{ text: '🖥️ علوم الحاسوب' }, { text: '🔐 الأمن السيبراني' }],
                    [{ text: '⬅️ الرجوع إلى القائمة الرئيسية' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        });
        return;
    }

    // 🖥️ التخصصات
    if (channels[text]) {
        const years = Object.keys(channels[text]);
        const yearButtons = years.map(year => [{ text: year }]);
        yearButtons.push([{ text: '⬅️ الرجوع إلى القائمة الرئيسية' }]);

        bot.sendMessage(chatId, `📅 اختر السنة الدراسية لمادة ${text}:`, {
            reply_markup: {
                keyboard: yearButtons,
                resize_keyboard: true,
                one_time_keyboard: false
            }
        });
        return;
    }

    // 📚 السنوات
    for (const major in channels) {
        if (channels[major][text]) {
            const terms = Object.keys(channels[major][text]);
            const termButtons = terms.map(term => [{ text: term }]);
            termButtons.push([{ text: '⬅️ الرجوع إلى القائمة الرئيسية' }]);

            bot.sendMessage(chatId, `📆 اختر الفصل الدراسي للسنة ${text} في ${major}:`, {
                reply_markup: {
                    keyboard: termButtons,
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            });
            return;
        }
    }

    // 📖 الفصول
    for (const major in channels) {
        for (const year in channels[major]) {
            if (channels[major][year][text]) {
                const subjects = Object.keys(channels[major][year][text]);
                const subjectButtons = subjects.map(subject => [{ text: subject }]);
                subjectButtons.push([{ text: '⬅️ الرجوع إلى القائمة الرئيسية' }]);

                bot.sendMessage(chatId, `📚 اختر المادة للفصل ${text} في ${major}:`, {
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

    // 📁 بعد اختيار المادة - اختيار الأستاذ
    for (const major in channels) {
        for (const year in channels[major]) {
            for (const term in channels[major][year]) {
                if (channels[major][year][term][text]) {
                    const professors = Object.keys(channels[major][year][term][text]);
                    const professorButtons = professors.map(prof => [{ text: prof }]);
                    professorButtons.push([{ text: '⬅️ الرجوع إلى القائمة الرئيسية' }]);

                    bot.sendMessage(chatId, `👨‍🏫 اختر الأستاذ للمادة ${text}:`, {
                        reply_markup: {
                            keyboard: professorButtons,
                            resize_keyboard: true,
                            one_time_keyboard: false
                        }
                    });
                    return;
                }
            }
        }
    }

    // 📄 جلب الملفات بعد اختيار الأستاذ
    for (const major in channels) {
        for (const year in channels[major]) {
            for (const term in channels[major][year]) {
                for (const subject in channels[major][year][term]) {
                    if (channels[major][year][term][subject][text]) {
                        const channelUsername = channels[major][year][term][subject][text];
                        const pdfFiles = await getPDFFilesFromChannel(channelUsername);

                        if (pdfFiles.length > 0) {
                            for (const file of pdfFiles) {
                                // 📄 إرسال الملف مباشرة
                                bot.sendDocument(chatId, file);
                            }
                        } else {
                            bot.sendMessage(chatId, '⚠️ لم يتم العثور على ملفات PDF في القناة.');
                        }
                        return;
                    }
                }
            }
        }
    }
});

// 📄 دالة لجلب ملفات PDF من قناة معينة
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
                    pdfFiles.push(update.channel_post.document.file_id); // 🗂️ حفظ file_id للملفات PDF
                }
            }
        }

        return pdfFiles;
    } catch (error) {
        console.error('⚠️ حدث خطأ أثناء جلب التحديثات:', error);
    }

    return [];
}

// 🌐 إعداد نقطة نهاية لمراقبة حالة الخادم
app.get('/', (req, res) => {
    res.send("<b>telegram @DEV_QM</b>");
});

// 🚀 بدء الخادم
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${port}`);
});
