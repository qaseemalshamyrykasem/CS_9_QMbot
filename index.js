const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const express = require('express');

// استبدل بتوكن البوت الخاص بك
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const channel_id = '@Dev_Qm_Start';  // ضع هنا معرف القناة

// المتغيرات لحفظ اختيارات المستخدم
let currentMajor = '';
let currentYear = '';
let currentTerm = '';
let currentSubject = '';

// بيانات المواد لكل تخصص
const subjects = {
    'أمن سيبراني': ['مادة1', 'مادة2', 'مادة3', 'مادة4', 'مادة5', 'مادة6', 'مادة7'],
    'علوم حاسوب': ['مادة1', 'مادة2', 'مادة3', 'مادة4', 'مادة5', 'مادة6', 'مادة7'],
    'نظم معلومات': ['مادة1', 'مادة2', 'مادة3', 'مادة4', 'مادة5', 'مادة6', 'مادة7']
};

// دالة لجلب الملفات من القناة
async function fetchFilesFromChannel() {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${bot.token}/getUpdates`);
        const messages = response.data.result;

        // فلترة الرسائل التي تحتوي على ملفات
        const files = messages.filter(msg => msg.message && msg.message.document);

        // استخراج معرفات الملفات
        const fileDetails = files.map(file => ({
            file_id: file.message.document.file_id,
            file_name: file.message.document.file_name
        }));

        return fileDetails;
    } catch (error) {
        console.error('Error fetching updates:', error);
    }
}

// عند بدء المحادثة، عرض قائمة التخصصات
bot.start((ctx) => {
    ctx.reply('مرحبًا! اختر التخصص:', 
        Markup.keyboard([['أمن سيبراني'], ['علوم حاسوب'], ['نظم معلومات']]).oneTime().resize());
});

// اختيار التخصص
bot.hears(['أمن سيبراني', 'علوم حاسوب', 'نظم معلومات'], (ctx) => {
    currentMajor = ctx.message.text;
    ctx.reply(`لقد اخترت تخصص: ${currentMajor}. اختر السنة الدراسية:`,
        Markup.keyboard([['السنة الأولى'], ['السنة الثانية'], ['السنة الثالثة'], ['السنة الرابعة']]).oneTime().resize());
});

// اختيار السنة
bot.hears(['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة'], (ctx) => {
    currentYear = ctx.message.text;
    ctx.reply(`لقد اخترت: ${currentYear}. اختر الترم:`,
        Markup.keyboard([['الترم الأول'], ['الترم الثاني']]).oneTime().resize());
});

// اختيار الترم
bot.hears(['الترم الأول', 'الترم الثاني'], (ctx) => {
    currentTerm = ctx.message.text;
    ctx.reply(`لقد اخترت: ${currentTerm}. اختر المادة:`,
        Markup.keyboard(subjects[currentMajor]).oneTime().resize());
});

// اختيار المادة وجلب الملفات
bot.hears(subjects['أمن سيبراني'].concat(subjects['علوم حاسوب'], subjects['نظم معلومات']), async (ctx) => {
    currentSubject = ctx.message.text;
    ctx.reply(`لقد اخترت المادة: ${currentSubject}. يتم الآن جلب الملفات...`);

    // جلب الملفات من القناة
    const files = await fetchFilesFromChannel();

    if (files.length > 0) {
        files.forEach(file => {
            ctx.replyWithDocument(file.file_id, { caption: file.file_name });
        });
    } else {
        ctx.reply('لم يتم العثور على ملفات لهذه المادة.');
    }
});

// تشغيل البوت باستخدام webhook
app.use(bot.webhookCallback('/telegram-bot'));
bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/telegram-bot`);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('بوت تليجرام يعمل!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});