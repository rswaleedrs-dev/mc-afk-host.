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
    <body style="background:#0b0f19; color:white; font-family:sans-serif; text-align:center; padding-top:100px;" dir="rtl">
        <h1 style="color:#38bdf8; font-size:35px;">👑 استضافة زد إكس رويال | ZX Royal</h1>
        <p style="color:#94a3b8; font-size:18px;">المنصة السحابية تعمل بنجاح! توجه إلى سيرفر الديسكورد واضغط على الأزرار لفتح لوحة التحكم الخاصة بك.</p>
        <br>
        <a href="https://discord.com{CLIENT_ID}&permissions=8&integration_type=0&scope=bot" target="_blank" style="background:#5865F2; color:white; padding:12px 25px; border-radius:8px; text-decoration:none; font-weight:bold;">🔮 دعوة البوت وتفعيل الأزرار تلقائياً</a>
    </body>
    `);
});

app.get('/dashboard/:token', (req, res) => {
    const token = req.params.token;
    const session = userSessions[token];

    if (!session) {
        return res.status(403).send("<h1>❌ عذراً، هذا الرابط غير صالح أو انتهت صلاحيته!</h1>");
    }

    const botKey = session.userId;
    const bot = activeBots[botKey];
    const isBotRunning = bot && bot.spawned;

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>لوحة تحكم ZX Royal - ${session.userName}</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; background: #070a13; color: #f8fafc; margin: 0; padding: 20px; }
            .panel { max-width: 700px; margin: auto; background: #0f172a; padding: 25px; border-radius: 15px; border: 1px solid #1e293b; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e293b; padding-bottom: 15px; }
            .status { padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; }
            .online { background: #16a34a; color: white; }
            .offline { background: #dc2626; color: white; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
            .card { background: #1e293b; padding: 15px; border-radius: 10px; border: 1px solid #334155; }
            input, button { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; box-sizing: border-box; font-size: 15px; font-weight:bold; }
            input { background: #070a13; color: white; border: 1px solid #334155; }
            button { background: #38bdf8; color: #070a13; border: none; cursor: pointer; transition: 0.2s; }
            button:hover { background: #bae6fd; transform: translateY(-2px); }
            .btn-danger { background: #ef4444; color: white; }
            .btn-danger:hover { background: #f87171; }
            .btn-action { background: #475569; color: white; }
            .btn-action:hover { background: #64748b; }
            .chat-box { background: #070a13; height: 150px; overflow-y: auto; padding: 10px; border-radius: 8px; border: 1px solid #334155; text-align: right; font-family: monospace; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="panel">
            <div class="header">
                <h2>👑 لوحة تحكم البوت: <span style="color:#38bdf8;">${session.botName}</span></h2>
                <span class="status ${isBotRunning ? 'online' : 'offline'}">${isBotRunning ? 'شغال داخل اللعبة 🟢' : 'منفصل حالياً 🔴'}</span>
            </div>
            <div class="grid">
                <div class="card">
                    <h3>🚀 تشغيل/إعادة تشغيل البوت</h3>
                    <form action="/api/start/${token}" method="POST">
                        <input type="text" name="ip" placeholder="IP السيرفر" value="${session.ip || ''}" required>
                        <input type="number" name="port" placeholder="المنفذ (Port)" value="${session.port || 25565}">
                        <input type="text" name="name" placeholder="اسم البوت في اللعبة" value="${session.botName}">
                        <button type="submit">إطلاق البوت لـ ماين كرافت ⚡</button>
                    </form>
                </div>
                <div class="card">
                    <h3>🛑 إيقاف البوت وفصله</h3>
                    <p style="font-size:13px; color:#94a3b8;">سيتم سحب اللاعب فوراً من سيرفر الماين كرافت وحفظ موارد الاستضافة.</p>
                    <a href="/api/stop/${token}"><button class="btn-danger">إخراج البوت فوراً ❌</button></a>
                </div>
            </div>
            <div class="card" style="margin-top:20px;">
                <h3>🕹️ حركات حية خارقة (تفاعل فوري)</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
                    <a href="/api/action/${token}/jump"><button class="btn-action">🦘 قفز مستمر</button></a>
                    <a href="/api/action/${token}/swing"><button class="btn-action">⚔️ ضرب وتفاعل</button></a>
                    <a href="/api/action/${token}/sneak"><button class="btn-action">🧎 تسلل (Shift)</button></a>
                </div>
            </div>
            <div class="card" style="margin-top:20px;">
                <h3>💬 شات سيرفر الماين كرافت الحي</h3>
                <div class="chat-box" id="chatBox">
                    ${session.logs.map(log => `<div>${log}</div>`).join('')}
                </div>
                <form action="/api/send-chat/${token}" method="POST" style="margin-top:10px; display:flex; gap:10px;">
                    <input type="text" name="msg" placeholder="اكتب رسالة ليتحدث بها البوت داخل اللعبة..." required style="margin:0;">
                    <button type="submit" style="width:120px; margin:0;">إرسال للشات 📣</button>
                </form>
            </div>
            <p style="text-align:center; font-size:12px; color:#475569; margin-top:20px;">استضافة ZX Royal المشفرة والمحمية بالكامل © 2026</p>
        </div>
        <script>
            var cb = document.getElementById('chatBox');
            cb.scrollTop = cb.scrollHeight;
        </script>
    </body>
    </html>
    `);
});

app.post('/api/start/:token', (req, res) => {
    const token = req.params.token;
    const session = userSessions[token];
    if (!session) return res.status(403).send("رابط غير صالح.");

    const { ip, port, name } = req.body;
    session.ip = ip;
    session.port = parseInt(port) || 25565;
    session.botName = name || "ZX_Royal_Bot";

    startMinecraftBot(session.userId, token);
    setTimeout(() => res.redirect(`/dashboard/${token}`), 2000);
});

app.get('/api/stop/:token', (req, res) => {
    const token = req.params.token;
    const session = userSessions[token];
    if (!session) return res.status(403).send("رابط غير صالح.");

    if (activeBots[session.userId]) {
        activeBots[session.userId].quit();
        delete activeBots[session.userId];
    }
    res.redirect(`/dashboard/${token}`);
});

app.post('/api/send-chat/:token', (req, res) => {
    const token = req.params.token;
    const session = userSessions[token];
    const bot = activeBots[session?.userId];

    if (bot && bot.spawned && req.body.msg) {
        bot.chat(req.body.msg);
        session.logs.push(`[أنت]: ` + req.body.msg);
    }
    res.redirect(`/dashboard/${token}`);
});

app.get('/api/action/:token/:type', (req, res) => {
    const token = req.params.token;
    const session = userSessions[token];
    const bot = activeBots[session?.userId];
    const type = req.params.type;

    if (bot && bot.spawned) {
        if (type === 'jump') {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 1000);
        } else if (type === 'swing') {
            bot.swingHand('right');
        } else if (type === 'sneak') {
            bot.setControlState('sneak', true);
            setTimeout(() => bot.setControlState('sneak', false), 1000);
        }
    }
    res.redirect(`/dashboard/${token}`);
});

function startMinecraftBot(userId, token) {
    const session = userSessions[token];
    if (!session) return;

    if (activeBots[userId]) {
        try { activeBots[userId].quit(); } catch(e){}
    }

    const bot = mineflayer.createBot({
        host: session.ip,
        port: session.port,
        username: session.botName,
        version: false
    });

    bot.on('spawn', () => {
        session.logs.push("<span style='color:#16a34a;'>🟢 دخل البوت إلى السيرفر بنجاح!</span>");
        const loop = setInterval(() => {
            if (!activeBots[userId]) { return clearInterval(loop); }
            bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI);
            const dirs = ['forward', 'back', 'left', 'right'];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            bot.setControlState(d, true);
            setTimeout(() => bot.setControlState(d, false), 400);
        }, 5000);
    });

    bot.on('message', (jsonMsg) => {
        session.logs.push(jsonMsg.toString());
        if (session.logs.length > 40) session.logs.shift();
    });

    bot.on('end', () => {
        session.logs.push("<span style='color:#ef4444;'>🔴 انقطع الاتصال بالسيرفر! جاري إعادة الاتصال...</span>");
    });

    activeBots[userId] = bot;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('ready', () => {

