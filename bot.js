const express = require('express'), { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js'), mineflayer = require('mineflayer'), crypto = require('crypto'), app = express(), PORT = process.env.PORT || 3000;
app.use(express.json()); app.use(express.urlencoded({ extended: true }));
let userSessions = {}, activeBots = {}; const CLIENT_ID = "1528091848042873113", DISCORD_TOKEN = process.env.DISCORD_TOKEN; let RENDER_URL = "http://localhost:" + PORT;

app.get('/', (q, s) => { s.send(`<body style="background:#090d16;color:white;font-family:sans-serif;text-align:center;padding-top:100px;" dir="rtl"><h1 style="color:#38bdf8;font-size:35px;">👑 منصة زد إكس رويال | ZX Royal</h1><p>المنصة تعمل بنجاح! توجه للديسكورد واضغط على الأزرار.</p></body>`) });

app.get('/dashboard/:token', (q, s) => {
    const t = q.params.token, e = userSessions[t]; if (!e) return s.status(403).send("رابط منتهي");
    const b = activeBots[e.userId], r = b && b.spawned;
    s.send(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>ZX Royal</title><style>body{font-family:sans-serif;background:#03050a;color:#fff;padding:15px;margin:0}.panel{max-width:700px;margin:auto;background:#070c18;padding:20px;border-radius:15px;border:1px solid #1e293b}input,button{width:100%;padding:12px;margin:5px 0;border-radius:8px;font-weight:bold}input{background:#03050a;color:#fff;border:1px solid #334155}button{background:#0284c7;color:#fff;border:none;cursor:pointer}.chat-box{background:#03050a;height:140px;overflow-y:auto;padding:10px;border-radius:8px;border:1px solid #334155;text-align:right}.grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px}</style></head><body><div class="panel"><h2>👑 لوحة ZX Royal الأسطورية [${r?'شغال 🟢':'منفصل 🔴'}]</h2><h3>❤️ الصحة: ${e.hp} | 🍖 الجوع: ${e.food}</h3><form action="/api/start/${t}" method="POST"><input type="text" name="ip" placeholder="IP السيرفر" value="${e.ip||''}" required><input type="number" name="port" value="${e.port||25565}" required><input type="text" name="name" value="${e.botName}"><button type="submit">تشغيل البوت ⚡</button></form><a href="/api/stop/${t}"><button style="background:#991b1b">إخراج وفصل البوت ❌</button></a><br><h3>🕹️ التحكم والوظائف الخنفشارية</h3><div class="grid"><a href="/api/toggle/${t}/move"><button style="background:#d97706">${e.move?'🛑 تجميد الحركة':'▶️ تشغيل الحركة'}</button></a><a href="/api/toggle/${t}/killaura"><button style="background:#b91c1c">⚔️ وضع السفاح: ${e.killaura?'ON':'OFF'}</button></a><a href="/api/toggle/${t}/hunter"><button style="background:#0f766e">🏹 صياد الوحوش: ${e.hunterActive?'ON':'OFF'}</button></a><a href="/api/action/${t}/party"><button style="background:#4338ca">🎇 وضع الحفلة</button></a><a href="/api/action/${t}/jump"><button style="background:#334155">🦘 قفز</button></a><a href="/api/action/${t}/spin"><button style="background:#334155">🔄 دوران</button></a><a href="/api/action/${t}/twerk"><button style="background:#334155">🧎 رقصة Crouch</button></a><a href="/api/action/${t}/coords"><button style="background:#334155">🗺️ الإحداثيات</button></a></div><h3>💬 شات سيرفر الماين كرافت الحي</h3><div class="chat-box" id="cb">${e.logs.map(l=>`<div>${l}</div>`).join('')}</div><form action="/api/send-chat/${t}" method="POST" style="display:flex;gap:10px;margin-top:5px"><input type="text" name="msg" placeholder="اكتب للعبة..." required><button type="submit" style="width:90px">إرسال</button></form></div><script>var d=document.getElementById('cb');d.scrollTop=d.scrollHeight;</script></body></html>`);
});

app.post('/api/start/:token', (q, s) => { const t = q.params.token, e = userSessions[t]; if (!e) return s.status(403); const { ip, port, name } = q.body; e.ip = ip; e.port = parseInt(port) || 25565; e.botName = name || "ZX_Bot"; startMinecraftBot(e.userId, t); setTimeout(() => s.redirect('/dashboard/' + t), 2000); });
app.get('/api/stop/:token', (q, s) => { const t = q.params.token, e = userSessions[t]; if (e && activeBots[e.userId]) { try { activeBots[e.userId].quit(); } catch(x){} delete activeBots[e.userId]; } s.redirect('/dashboard/' + t); });
app.post('/api/send-chat/:token', (q, s) => { const t = q.params.token, e = userSessions[t], b = activeBots[e?.userId]; if (b && b.spawned && q.body.msg) { b.chat(q.body.msg); e.logs.push(`[أنت]: ` + q.body.msg); } s.redirect('/dashboard/' + t); });
app.get('/api/toggle/:token/:type', (q, s) => { const t = q.params.token, e = userSessions[t]; if (e) { if (q.params.type === 'move') e.move = !e.move; if (q.params.type === 'killaura') e.killaura = !e.killaura; if (q.params.type === 'hunter') e.hunterActive = !e.hunterActive; } s.redirect('/dashboard/' + t); });
app.get('/api/action/:token/:type', (q, s) => { const t = q.params.token, e = userSessions[t], b = activeBots[e?.userId], y = q.params.type; if (b && b.spawned) { if (y === 'jump') { b.setControlState('jump', true); setTimeout(() => b.setControlState('jump', false), 500); } else if (y === 'coords') { e.logs.push(`🗺️ الموقع: X: ${Math.round(b.entity.position.x)} | Y: ${Math.round(b.entity.position.y)} | Z: ${Math.round(b.entity.position.z)}`); } else if (y === 'spin') { let c=0; const l=setInterval(()=>{ if(!b.spawned)return clearInterval(l); b.look(c,0); c+=1.5; if(c>25)clearInterval(l) },50); } else if (y === 'twerk') { let c=0; const l=setInterval(()=>{ if(!b.spawned)return clearInterval(l); b.setControlState('sneak',c%2===0); c++; if(c>12)clearInterval(l) },120); } else if (y === 'party') { let count = 0; const l = setInterval(() => { if (!b.spawned) return clearInterval(l); b.setControlState('jump', count % 2 === 0); b.setControlState('sneak', count % 3 === 0); b.swingHand('right'); count++; if (count > 20) clearInterval(l); }, 150); } } s.redirect('/dashboard/' + t); });

function startMinecraftBot(u, t) {
    const e = userSessions[t]; if (!e) return; if (activeBots[u]) { try { activeBots[u].quit(); } catch(x){} }
    try {
        const b = mineflayer.createBot({ host: e.ip, port: e.port, username: e.botName, hideErrors: true });
        b.on('spawn', () => {
            e.logs.push("🟢 متصل بنجاح ومميزات الـ Plugins والـ GodMode نشطة! 🔥");
            const L = setInterval(() => {
                if (!activeBots[u] || !b.spawned) return clearInterval(L);
                try { e.hp = Math.round(b.health); e.food = Math.round(b.food); if (b.health < 6) { b.quit(); delete activeBots[u]; return; } } catch(x){}
                if (e.hunterActive) { const f = x => x.type === 'mob' && x.position.distanceTo(b.entity.position)  2) { b.setControlState('forward', true); } else { b.setControlState('forward', false); b.attack(g); } } else { b.setControlState('forward', false); } }
                if (e.killaura) { const f = x => x.type === 'mob' || (x.type === 'player' && x.username !== b.username && x.position.distanceTo(b.entity.position) < 5), g = b.nearestEntity(f); if (g) { b.lookAt(g.position.offset(0, 1.5, 0)); b.attack(g); } }
                if (e.move && !e.killaura && !e.hunterActive) { b.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI); const d = ['forward', 'back', 'left', 'right'], m = d[Math.floor(Math.random() * d.length)]; b.setControlState(m, true); setTimeout(() => b.setControlState(m, false), 300); b.setControlState('sneak', true); setTimeout(() => b.setControlState('sneak', false), 200); }
            }, 2000);
        });
        b.on('playerJoined', (p) => { if (p.username !== b.username) b.chat(`Welcome ${p.username}! Protected by ZX Royal V5 👑`) });
        b.on('chat', (username, msg) => { if (username === b.username) return; if (msg === '!help') b.chat(`Commands: !time , !coords`); if (msg === '!time') b.chat(`Server time: ${b.time.timeOfDay}`); if (msg === '!coords') b.chat(`X: ${Math.round(b.entity.position.x)} Y: ${Math.round(b.entity.position.y)}`); });
        b.on('message', (j) => { const txt = j.toString().trim(); if (txt) e.logs.push(txt); if (e.logs.length > 30) e.logs.shift(); });
        b.on('end', () => { e.logs.push("🔴 انقطع الاتصال! جاري إعادة الإنعاش بعد 10 ثوانٍ..."); setTimeout(() => { if (activeBots[u]) startMinecraftBot(u, t); }, 10000); });
        activeBots[u] = b;
    } catch(err) { e.logs.push("⚠️ خطأ: " + err.message); }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.on('ready', () => { client.guilds.cache.forEach(g => { setupHostingChannel(g); }); });
async function setupHostingChannel(g) {
    try {
        let c = g.channels.cache.find(x => x.name === '👑-zx-royal-hosting');
        if (!c) c = await g.channels.create({ name: '👑-zx-royal-hosting', type: ChannelType.GuildText });
        const f = await c.messages.fetch({ limit: 2 });
        if (f.size === 0) {
            const embed = new EmbedBuilder().setTitle('👑 استضافة زد إكس رويال الأسطورية الخارقة').setDescription('اضغط على الزر بالأسفل لتوليد لوحة التحكم والـ Plugins الخنفشارية الخاصة بسيرفرك فوراً! 🔥').setColor('#38bdf8');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('create_dashboard').setLabel('🚀 إنشاء لوحة التحكم الأسطورية').setStyle(ButtonStyle.Primary));
            c.send({ embeds: [embed], components: [row] });
        }
    } catch (e) {}
}

client.on('interactionCreate', async (i) => {
    if (!i.isButton()) return;
    if (i.customId === 'create_dashboard') {
        const t = crypto.randomBytes(12).toString('hex');

