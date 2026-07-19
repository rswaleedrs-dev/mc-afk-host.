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
// قراءة رابط منصة ريندر التلقائي أو اعتماد المنفذ المحلي
let RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// الصفحة الرئيسية لتخطي فحص Render بنجاح
app.get('/', (q, s) => {
    s.send(`<body style="background:#0b0f19;color:white;font-family:sans-serif;text-align:center;padding-top:100px;" dir="rtl">
        <h1 style="color:#38bdf8;font-size:35px;">👑 استضافة زد إكس رويال | ZX Royal</h1>
        <p style="color:#94a3b8;font-size:18px;">المنصة تعمل بنجاح! تفقد سيرفر الديسكورد واضغط على الأزرار.</p><br>
        <a href="https://discord.com{CLIENT_ID}&permissions=8&integration_type=0&scope=bot" target="_blank" style="background:#5865F2;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;font-weight:bold;">🔮 دعوة البوت</a>
    </body>`);
});

// لوحة التحكم الخاصة بالمستخدم
app.get('/dashboard/:token', (q, s) => {
    const t = q.params.token;
    const e = userSessions[t];
    if (!e) return s.status(403).send("<h1>❌ رابط غير صالح!</h1>");
    const b = activeBots[e.userId];
    const r = b && b.spawned;
    s.send(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>ZX Royal - ${e.userName}</title><style>body{font-family:sans-serif;background:#070a13;color:#fff;padding:20px}.panel{max-width:700px;margin:auto;background:#0f172a;padding:25px;border-radius:15px;border:1px solid #1e293b}input,button{width:100%;padding:12px;margin:8px 0;border-radius:8px;box-sizing:border-box;font-weight:bold}input{background:#070a13;color:#fff;border:1px solid #334155}button{background:#38bdf8;color:#070a13;border:none;cursor:pointer}.chat-box{background:#070a13;height:150px;overflow-y:auto;padding:10px;border-radius:8px;border:1px solid #334155}</style></head><body><div class="panel"><h2>👑 بوت: <span style="color:#38bdf8">${e.botName}</span> [${r ? 'شغال 🟢' : 'منفصل 🔴'}]</h2><form action="/api/start/${t}" method="POST"><input type="text" name="ip" placeholder="IP السيرفر" value="${e.ip || ''}" required><input type="number" name="port" value="${e.port || 25565}"><input type="text" name="name" value="${e.botName}"><button type="submit">إطلاق البوت ⚡</button></form><br><a href="/api/stop/${t}"><button style="background:#ef4444;color:#fff">إخراج البوت ❌</button></a><div style="margin-top:20px"><h3>🕹️ تحركات حية</h3><a href="/api/action/${t}/jump"><button style="background:#475569;color:#fff;width:30%">🦘 قفز</button></a><a href="/api/action/${t}/swing"><button style="background:#475569;color:#fff;width:30%">⚔️ ضرب</button></a><a href="/api/action/${t}/sneak"><button style="background:#475569;color:#fff;width:30%">🧎 تسلل</button></a></div><div style="margin-top:20px"><h3>💬 الشات الحي</h3><div class="chat-box">${e.logs.map(l => `<div>${l}</div>`).join('')}</div><form action="/api/send-chat/${t}" method="POST" style="display:flex;gap:10px"><input type="text" name="msg" placeholder="اكتب رسالة للشات..." required><button type="submit" style="width:120px">إرسال</button></form></div></div></body></html>`);
});

// بدء تشغيل بوت الماينكرافت
app.post('/api/start/:token', (q, s) => {
    const t = q.params.token;
    const e = userSessions[t];
    if (!e) return s.status(403);
    const { ip, port, name } = q.body;
    e.ip = ip;
    e.port = parseInt(port) || 25565;
    e.botName = name || "ZX_Bot";
    startMinecraftBot(e.userId, t);
    setTimeout(() => s.redirect('/dashboard/' + t), 2000);
});

// إيقاف بوت الماينكرافت
app.get('/api/stop/:token', (q, s) => {
    const t = q.params.token;
    const e = userSessions[t];
    if (e && activeBots[e.userId]) {
        try { activeBots[e.userId].quit(); } catch(x) {}
        delete activeBots[e.userId];
    }
    s.redirect('/dashboard/' + t);
});

// إرسال رسائل الدردشة داخل اللعبة
app.post('/api/send-chat/:token', (q, s) => {
    const t = q.params.token;
    const e = userSessions[t];
    const b = activeBots[e?.userId];
    if (b && b.spawned && q.body.msg) {
        b.chat(q.body.msg);
        e.logs.push(`[أنت]: ` + q.body.msg);
    }
    s.redirect('/dashboard/' + t);
});

// التحكم في الأفعال (قفز، تسلل، ضرب)
app.get('/api/action/:token/:type', (q, s) => {
    const t = q.params.token;
    const e = userSessions[t];
    const b = activeBots[e?.userId];
    const y = q.params.type;
    if (b && b.spawned) {
        if (y === 'jump') {
            b.setControlState('jump', true);
            setTimeout(() => b.setControlState('jump', false), 1000);
        } else if (y === 'swing') {
            b.swingHand('right');
        } else if (y === 'sneak') {
            b.setControlState('sneak', true);
            setTimeout(() => b.setControlState('sneak', false), 1000);
        }
    }
    s.redirect('/dashboard/' + t);
});

// دالة تشغيل وإدارة حركة بوت الماينكرافت الذكية لمنع الطرد AFK
function startMinecraftBot(u, t) {
    const e = userSessions[t];
    if (!e) return;
    if (activeBots[u]) {
        try { activeBots[u].quit(); } catch (x) {}
    }
    
    const b = mineflayer.createBot({
        host: e.ip,
        port: e.port,
        username: e.botName,
        version: false
    });

    b.on('spawn', () => {
        e.logs.push("<span style='color:#16a34a'>🟢 دخل بنجاح!</span>");
        
        // حلقة ذكية للتحرك العشوائي والالتفات لمنع الـ AFK Kick
        const L = setInterval(() => {
            if (!activeBots[u] || !b.entity) return clearInterval(L);
            
            // الالتفات برأس البوت بشكل عشوائي ومحايد
            b.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI);
            
            // التحرك العشوائي المتناسق
            const d = ['forward', 'back', 'left', 'right'];
            const m = d[Math.floor(Math.random() * d.length)];
            
            // تفعيل نظام الـ Hunter الذكي الآمن إذا أردت تفعيله لاحقاً بدون أخطاء صيغة
            // المقارنة البرمجية هنا تم تصحيحها بإضافة علاقة مقارنة آمنة (أصغر من < 2) لضمان عدم توقف السيرفر
            if (e.hunterActive) {
                const targets = Object.values(b.entities).filter(x => x.type === 'mob' && b.entity.position.distanceTo(x.position) < 2);
                if (targets.length > 0) { b.swingHand('right'); }
            }
            
            b.setControlState(m, true);
            setTimeout(() => { if(activeBots[u]) b.setControlState(m, false); }, 400);
        }, 5000);
    });

    b.on('message', (j) => {
        e.logs.push(j.toString());
        if (e.logs.length > 40) e.logs.shift();
    });

    b.on('end', () => {
        e.logs.push("<span style='color:#ef4444'>🔴 انقطع الاتصال من السيرفر!</span>");
    });
    
    b.on('error', (err) => {
        e.logs.push(`<span style='color:#ef4444'>❌ خطأ: ${err.message}</span>`);
    });

    activeBots[u] = b;
}

// إعدادات بوت الديسكورد والـ Intents المعاصرة
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log("Discord Bot is Ready!");
    client.guilds.cache.forEach(g => { setupHostingChannel(g); });
});

client.on('guildCreate', (g) => { setupHostingChannel(g); });

// إنشاء روم التثبيت التلقائي
async function setupHostingChannel(g) {
    try {
        let c = g.channels.cache.find(x => x.name === '👑-zx-royal-hosting');
        if (!c) {
            c = await g.channels.create({
                name: '👑-zx-royal-hosting',
                type: ChannelType.GuildText,
                topic: 'منصة استضافة زد إكس رويال المجانية لتشغيل البوتات 24 ساعة'
            });
        }
        const f = await c.messages.fetch({ limit: 5 });
        if (f.size === 0) {
            const embed = new EmbedBuilder()
                .setTitle('👑 منصة استضافة زد إكس رويال | ZX Royal Hosting')
                .setDescription('مرحباً بك! نساعدك في حماية سيرفرك من الإغلاق التلقائي عبر إدخال لاعب حقيقي يتحرك 24 ساعة.\n\n👇 **اضغط على الزر بالأسفل لفتح لوحة التحكم الويب السرية الخاصة بك!**')
                .setColor('#38bdf8');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_dashboard')
                    .setLabel('🚀 إنشاء لوحة التحكم الخاصة بي')
                    .setStyle(ButtonStyle.Primary)
            );
            c.send({ embeds: [embed], components: [row] });
        }
    } catch (e) {
        console.log("Channel creation error or missing permissions");
    }
}

// التفاعل عند الضغط على زر إنشاء لوحة التحكم
client.on('interactionCreate', async (i) => {
    if (!i.isButton()) return;
    if (i.customId === 'create_dashboard') {
        const t = crypto.randomBytes(12).toString('hex');
        userSessions[t] = {
            userId: i.user.id,
            userName: i.user.username,
            botName: "ZX_" + i.user.username.substring(0, 5),
            ip: "",
            port: 25565,
            logs: ["🔹 مرحباً بك في لوحة تحكم ZX Royal الحية!"],
            hunterActive: false // افتراضي غير مفعل لتجنب أي تعارض
        };
        
        // تحديث الرابط برابط ريندر الفعلي عند الضغط
        if (process.env.RENDER_EXTERNAL_URL) {
            RENDER_URL = process.env.RENDER_EXTERNAL_URL;
        }
        
        const u = RENDER_URL + "/dashboard/" + t;
        const embed = new EmbedBuilder()
            .setTitle('🔐 تم توليد لوحة التحكم بنجاح!')
