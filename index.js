const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const app = express();

const API_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(API_TOKEN, { polling: true });

// قاعدة بيانات مؤقتة لتخزين معرفات الملفات (File IDs)
const files = {
    'تخصص1': {
        'ترم1': {
            'مادة1': {
                'دكتور1': 'FILE_ID_1', // استخدم File ID الخاص بالملف هنا
                'دكتور2': 'FILE_ID_2'
            },
            'مادة2': {
                'دكتور1': 'FILE_ID_3'
            }
        },
        'ترم2': {
            'مادة1': {
                'دكتور1': 'FILE_ID_4'
            }
        }
    }
};

// المتغيرات لحفظ الاختيارات
let currentMajor = '';
let currentTerm = '';
let currentSubject = '';

// قائمة التخصصات
const majors = Object.keys(files);

// عند بدء المحادثة
bot.start((ctx) => {
    ctx.reply('مرحبًا! اختر التخصص:', Markup.keyboard(majors).oneTime().resize());
});

// اختيار التخصص
bot.hears(majors, (ctx) => {
    currentMajor = ctx.message.text;
    const terms = Object.keys(files[currentMajor]);
    ctx.reply('اختر الترم:', Markup.keyboard(terms).oneTime().resize());
});

// اختيار الترم
bot.hears((ctx) => Object.keys(files[currentMajor]), (ctx) => {
    currentTerm = ctx.message.text;
    const subjects = Object.keys(files[currentMajor][currentTerm]);
    ctx.reply('اختر المادة:', Markup.keyboard(subjects).oneTime().resize());
});

// اختيار المادة
bot.hears((ctx) => Object.keys(files[currentMajor][currentTerm]), (ctx) => {
    currentSubject = ctx.message.text;
    const doctors = Object.keys(files[currentMajor][currentTerm][currentSubject]);
    ctx.reply('اختر الدكتور:', Markup.keyboard(doctors).oneTime().resize());
});

// اختيار الدكتور وإرسال الملف
bot.hears((ctx) => Object.keys(files[currentMajor][currentTerm][currentSubject]), (ctx) => {
    const doctor = ctx.message.text;
    const fileId = files[currentMajor][currentTerm][currentSubject][doctor];
    
    // إرسال الملف باستخدام File ID من القناة
    ctx.replyWithDocument(fileId);
});

// تشغيل البوت
bot.launch();