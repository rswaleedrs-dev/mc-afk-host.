const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const mineflayer = require('mineflayer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let userSessions = {}; 
let activeBots = {}; 

const CLIENT_ID = "1528091848042873113"; 
const DISCORD_TOKEN = process.env.DISCORD_TOKEN; 
let RENDER_URL = "http://localhost:" + PORT;

app.get('/', (req, res) => {
    res.send(`
    <body style="background:#090d16;color:white;font-family:sans-serif;text-align:center;padding-top:100px;" dir="rtl">
        <h1 style="color:#38bdf8;font-size:38px;text-shadow:0 0 20px #38bdf8">👑 منصة زد إكس رويال الأسطورية | ZX Royal</h1>
        <p style="color:#94a3b8;font-size:18px;">الأنظمة الجبارة تعمل بنجاح! توجه للديسكورد وتفقد روم الأزرار.</p>
        <br>
        <a href="https://discord.com{CLIENT_ID}&permissions=8&integration_type=0&scope=bot" target="_blank" style="background:#5865F2;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;font-weight:bold;box-shadow:0 0 15px #5865F2">🔮 دعوة البوت الملكي</a>
    </body>
    `);
});

app.get('/dashboard/:token', (req, res) => {
    const token = req.params.token;
    const session = userSessions[token];

    if (!session) {
        return res.status(403).send("<h1>❌ رابط منتهي الصلاحية!</h1>");
    }

    const botKey = session.userId;
    const bot = activeBots[botKey];
    const r = bot && bot.spawned;

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>ZX Royal CyberPanel - ${session.userName}</title>
        <style>
            body { font-family:'Segoe UI',sans-serif; background:#03050a; color:#f8fafc; padding:15px; margin:0; }
            .panel { max-width:800px; margin:10px auto; background:#070c18; padding:25px; border-radius:20px; border:1px solid #1e293b; box-shadow:0 0 30px rgba(56,189,248,0.2); }
            .sect { background:#0d1527; padding:16px; border-radius:12px; margin-top:15px; border:1px solid #1e293b; box-shadow:inset 0 0 10px rgba(0,0,0,0.5); }
            .title-main { font-size:24px; font-weight:bold; color:#38bdf8; text-shadow:0 0 10px rgba(56,189,248,0.5); }
            input, button { width:100%; padding:13px; margin:5px 0; border-radius:10px; box-sizing:border-box; font-weight:bold; font-size:14px; transition:all 0.2s ease; }
            input { background:#03050a; color:#fff; border:1px solid #334155; }
            button { background:#0284c7; color:#fff; border:none; cursor:pointer; }
            button:hover { background:#38bdf8; color:#070a13; transform:translateY(-2px); box-shadow:0 0 15px rgba(56,189,248,0.4); }
            .chat-box { background:#03050a; height:160px; overflow-y:auto; padding:12px; border-radius:10px; border:1px solid #334155; font-family:monospace; font-size:12px; text-align:right; }
            .grid-4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; }
            .dpad { display:grid; grid-template-columns:1fr 1fr 1fr; width:150px; margin:5px auto; }
            .btn-act { background:#1e293b; color:#f8fafc; border:1px solid #334155; }
            .btn-act:hover { background:#334155; border-color:#38bdf8; }
            .btn-cmd { background:#0f766e; color:#fff; }
            .btn-cmd:hover { background:#14b8a6; box-shadow:0 0 10px #14b8a6; }
            .btn-dan { background:#991b1b; color:#fff; }
            .btn-dan:hover { background:#ef4444; box-shadow:0 0 10px #ef4444; }
            .stats { display:flex; justify-content:space-around; background:#111827; padding:10px; border-radius:10px; margin-top:10px; font-size:12px; font-weight:bold; border:1px solid #1e293b; }
        </style>
    </head>
    <body>
        <div class="panel">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1e293b;padding-bottom:12px">
                <span class="title-main">🔥 لوحة التحكم الأسطورية لـ ZX Royal</span>
                <span style="background:${r ? '#16a34a' : '#dc2626'};padding:6px 14px;border-radius:20px;font-size:12px;font-weight:bold;box-shadow:0 0 10px ${r ? '#16a34a' : '#dc2626'}">${r ? 'متصل ونظامي 🟢' : 'منفصل 🔴'}</span>
            </div>
            
            ${r ? `<div class="stats"><span style="color:#ef4444">❤️ الصحة: ${session.hp}</span><span style="color:#f59e0b">🍖 الجوع: ${session.food}</span><span style="color:#a855f7">🏹 صيد وحوش: ${session.hunterActive ? 'ON' : 'OFF'}</span><span style="color:#10b981">🚶 الحركة: ${session.move ? 'نشطة' : 'مجمدة'}</span></div>` : ''}
            
            <div class="sect">
                <h3>🚀 بوابة إطلاق البوت السحابية السريعة</h3>
                <form action="/api/start/${token}" method="POST">
                    <input type="text" name="ip" placeholder="IP السيرفر" value="${session.ip || ''}" required>
                    <input type="number" name="port" placeholder="Port البورت" value="${session.port || 25565}" required>
                    <input type="text" name="name" value="${session.botName}">
                    <button type="submit">تفعيل مصفوفة التشغيل الأسطورية ⚡</button>
                </form>
                <a href="/api/stop/${token}"><button class="btn-dan">قطع المصفوفة وفصل البوت ❌</button></a>
            </div>
            
            <div class="sect">
                <h3>🚶 التحكم الحركي واليدوي الفوري</h3>
                <div class="grid-4">
                    <a href="/api/toggle/${token}/move"><button style="background:${session.move ? '#d97706' : '#059669'};color:white;font-size:11px">${session.move ? '🛑 تجميد الحركة الآلية' : '▶️ تشغيل الحركة الآلية'}</button></a>
                    <a href="/api/action/${token}/jump"><button class="btn-act">🦘 قفز</button></a>
                    <a href="/api/action/${token}/sneak"><button class="btn-act">🧎 تسلل (Shift)</button></a>
                    <a href="/api/action/${token}/sprint"><button class="btn-act">🏃 ركض سريع</button></a>
                </div>
                <div class="dpad">
                    <div></div><a href="/api/move/${token}/forward"><button class="btn-act">🔼</button></a><div></div>
                    <a href="/api/move/${token}/left"><button class="btn-act">⬅️</button></a><button style="background:#070c18;color:#38bdf8;cursor:default">🕹️</button><a href="/api/move/${token}/right"><button class="btn-act">➡️</button></a>
                    <div></div><a href="/api/move/${token}/back"><button class="btn-act">🔽</button></a><div></div>
                </div>
            </div>
            
            <div class="sect">
                <h3>⚔️ وضع تدمير الأهداف والترفيه والقتال الخنفشاري</h3>
                <div class="grid-4">
                    <a href="/api/toggle/${token}/killaura"><button style="background:${session.killaura ? '#b91c1c' : '#047857'};color:white;font-size:11px">⚔️ وضع السفاح: ${session.killaura ? 'ON' : 'OFF'}</button></a>
                    <a href="/api/toggle/${token}/hunter"><button style="background:${session.hunterActive ? '#ef4444' : '#10b981'};color:white;font-size:11px">🏹 وضع صياد الوحوش: ${session.hunterActive ? 'ON' : 'OFF'}</button></a>
                    <a href="/api/toggle/${token}/magnet"><button style="background:${session.magnetMode ? '#a855f7' : '#4b5563'};color:white;font-size:11px">🧲 مغناطيس الموارد: ${session.magnetMode ? 'ON' : 'OFF'}</button></a>
                    <a href="/api/toggle/${token}/stare"><button style="background:${session.stareMode ? '#ec4899' : '#4b5563'};color:white;font-size:11px">👀 تثبيت النظر: ${session.stareMode ? 'ON' : 'OFF'}</button></a>
                    <a href="/api/action/${token}/kamikaze"><button class="btn-dan" style="font-size:11px">🧨 وضع الانتحاري</button></a>
                    <a href="/api/action/${token}/farm"><button class="btn-cmd">⛏️ مزارع آلي</button></a>
                    <a href="/api/action/${token}/spin"><button class="btn-cmd">🔄 رقصة الدوران</button></a>
                    <a href="/api/action/${token}/twerk"><button class="btn-cmd">🧎 رقصة Crouch</button></a>
                    <a href="/api/action/${token}/wave"><button class="btn-cmd">👋 تلوير اليد</button></a>
                    <a href="/api/action/${token}/party"><button class="btn-cmd">🎇 وضع الحفلة</button></a>
                    <a href="/api/action/${token}/coords"><button class="btn-cmd">🗺️ رصد الإحداثيات</button></a>
                    <a href="/api/action/${token}/radar"><button class="btn-cmd">📡 رادار اللاعبين</button></a>
                    <a href="/api/action/${token}/inv"><button class="btn-cmd">📦 فحص الحقيبة</button></a>
                    <a href="/api/action/${token}/fish"><button class="btn-cmd">🎣 صيد آلي</button></a>
                    <a href="/api/action/${token}/sleep"><button class="btn-cmd">🛌 سرير نوم آلي</button></a>
                    <a href="/api/toggle/${token}/chat"><button style="background:#4338ca;color:white">💬 رد ذكي: ${session.autoChat ? 'ON' : 'OFF'}</button></a>
                </div>
                <form action="/api/stalk/${token}" method="POST" style="display:flex;gap:10px;margin-top:8px">
                    <input type="text" name="target" placeholder="اكتب اسم لاعب لتتبعه وملاحقته فوراً..." required>
                    <button type="submit" style="width:140px;background:#b45309;color:white">🏃‍♂️ تتبع وحماية</button>
                </form>
            </div>
            
            <div class="sect">
                <h3>🛠️ ترسانة حقن الأوامر والكونسول السريع (Admin Tools)</h3>
                <div class="grid-4">
