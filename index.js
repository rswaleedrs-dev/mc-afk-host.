const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ActivityType } = require('discord.js');
const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

let bot = null;
let features = { autoEat: true, autoMove: true, autoDefense: true, autoReconnect: true, danceAfk: false };
let botStatus = { connected: false, health: 20, food: 20, log: 'في انتظار التشغيل...' };

function startMcBot(ip, port, username) {
    if (bot) { try { bot.quit(); } catch(e){} }
    bot = mineflayer.createBot({ host: ip, port: parseInt(port) || 25565, username: username || 'ZX_Royal_AFK' });

    bot.on('spawn', () => {
        botStatus.connected = true;
        botStatus.log = 'تم الدخول وإتاحة الحماية الملكية 🟢';
    });

    bot.on('health', () => {
        botStatus.health = Math.round(bot.health);
        botStatus.food = Math.round(bot.food);
    });

    bot.on('end', () => {
        botStatus.connected = false;
        botStatus.log = 'تم الانفصال من السيرفر 🔴';
        if (features.autoReconnect) setTimeout(() => startMcBot(ip, port, username), 5000);
    });

    bot.on('error', (err) => { botStatus.log = 'خطأ: ' + err.message; });
}

app.post('/api/action', (req, res) => {
    const { type, ip, port, username, feature, status, msg } = req.body;
    if (type === 'start') { startMcBot(ip, port, username); return res.json({ success: true }); }
    if (type === 'stop') { features.autoReconnect = false; if (bot) bot.quit(); botStatus.connected = false; return res.json({ success: true }); }
    if (type === 'toggle') { 
        features[feature] = status; 
        if (bot && botStatus.connected && feature === 'danceAfk') bot.setControlState('jump', status);
        return res.json({ success: true }); 
    }
    if (type === 'chat' && bot && botStatus.connected) { bot.chat(msg); return res.json({ success: true }); }
    res.json({ success: false });
});

app.get('/api/status', (req, res) => res.json({ botStatus, features }));

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZX Royal Cyber Dashboard V4</title>
    <style>
        :root { --p: #00f0ff; --purple: #a855f7; --bg: #030712; --card: rgba(15, 23, 42, 0.85); --danger: #ff0055; --green: #00ffcc; }
        body { background: radial-gradient(circle at top, #0f172a 0%, #030712 100%); color: #fff; font-family: system-ui, sans-serif; padding: 12px; margin: 0; display: flex; justify-content: center; }
        .box { width: 100%; max-width: 460px; background: var(--card); backdrop-filter: blur(12px); padding: 20px; border-radius: 20px; border: 1px solid rgba(0, 240, 255, 0.3); box-shadow: 0 0 30px rgba(0,240,255,0.15); display: flex; flex-direction: column; gap: 12px; }
        h1 { background: linear-gradient(90deg, var(--p), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; font-size: 22px; margin: 0; font-weight: 900; }
        .badge { background: rgba(3,7,18,0.9); border: 1px solid #1e293b; padding: 10px; border-radius: 12px; font-size: 12px; text-align: center; }
        .sec { background: rgba(3,7,18,0.6); border: 1px solid #1e293b; padding: 12px; border-radius: 14px; display: flex; flex-direction: column; gap: 8px; }
        .sec-t { font-size: 11px; font-weight: bold; color: var(--p); }
        input { padding: 9px; background: #030712; border: 1px solid #1e293b; border-radius: 8px; color: #fff; font-size: 12px; width: 100%; box-sizing: border-box; }
        .btn { padding: 11px; border: none; border-radius: 10px; font-weight: bold; font-size: 12px; cursor: pointer; }
        .btn-green { background: linear-gradient(90deg, var(--p), var(--purple)); color: #000; }
        .btn-red { background: rgba(255,0,85,0.2); border: 1px solid var(--danger); color: var(--danger); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tgl { background: #030712; border: 1px solid #1e293b; padding: 10px; border-radius: 10px; color: #94a3b8; font-size: 10px; font-weight: bold; cursor: pointer; text-align: center; }
        .tgl.active { border-color: var(--green); color: var(--green); background: rgba(0, 255, 204, 0.1); }
    </style>
</head>
<body>
    <div class="box">
        <h1>👑 ZX ROYAL CYBER V4</h1>
        <div class="badge" id="st">حالة البوت: <b style="color:var(--danger)">منفصل 🛑</b></div>
        <div class="sec">
            <div class="sec-t">📟 أحدث الأحداث الحية:</div>
            <div id="log" style="font-size:11px; color:#a855f7;">في انتظار التشغيل...</div>
        </div>
        <div class="sec">
            <div class="sec-t">🎮 بيانات الخادم</div>
            <input type="text" id="ip" placeholder="Server IP (مثال: play.server.com)">
            <input type="number" id="port" value="25565">
            <input type="text" id="user" placeholder="اسم البوت">
            <button class="btn btn-green" onclick="control('start')">🚀 تشغيل وبدء الاستضافة</button>
            <button class="btn btn-red" onclick="control('stop')">🛑 إيقاف البوت</button>
        </div>
        <div class="sec">
            <div class="sec-t">⚡ الميزات الأسطورية الحية</div>
            <div class="grid">
                <button class="tgl active" id="m-autoEat" onclick="toggle('autoEat')">🍖 أكل تلقائي</button>
                <button class="tgl active" id="m-autoDefense" onclick="toggle('autoDefense')">⚔️ حماية وحراس</button>
                <button class="tgl active" id="m-autoReconnect" onclick="toggle('autoReconnect')">🔄 إعادة اتصال 24/7</button>
                <button class="tgl" id="m-danceAfk" onclick="toggle('danceAfk')">🕺 مود الرقص والقفز</button>
            </div>
            <div style="display:flex; gap:5px; margin-top:5px;">
                <input type="text" id="chatMsg" placeholder="أرسل رسالة للعبة...">
                <button class="btn btn-green" style="width:70px;" onclick="sendChat()">إرسال</button>
            </div>
        </div>
    </div>
    <script>
        async function control(act) {
            await fetch('/api/action', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ type: act, ip: document.getElementById('ip').value, port: document.getElementById('port').value, username: document.getElementById('user').value })
            });
        }
        async function toggle(feat) {
            const el = document.getElementById('m-' + feat);
            const status = !el.classList.contains('active');
            el.classList.toggle('active', status);
            await fetch('/api/action', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type: 'toggle', feature: feat, status }) });
        }
        async function sendChat() {
            const msg = document.getElementById('chatMsg').value;
            await fetch('/api/action', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type: 'chat', msg }) });
            document.getElementById('chatMsg').value = '';
        }
        setInterval(async () => {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                document.getElementById('st').innerHTML = data.botStatus.connected 
                    ? 'حالة البوت: <b style="color:var(--green)">متصل بالماب 🟢 (❤️ ' + data.botStatus.health + ' | 🍖 ' + data.botStatus.food + ')</b>'
                    : 'حالة البوت: <b style="color:var(--danger)">منفصل 🛑</b>';
                document.getElementById('log').innerText = data.botStatus.log;
            } catch(e){}
        }, 3000);
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`[Express] Port: ${port}`));

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const CATEGORY_NAME = '👑 | ZX ROYAL HOSTING';
const CHANNEL_NAME = 'zx-royal-hosting';

async function setupChannels(guild) {
    try {
        let cat = guild.channels.cache.find(c => c.name === CATEGORY_NAME && c.type === 4);
        if (!cat) cat = await guild.channels.create({ name: CATEGORY_NAME, type: 4 });

        let ch = guild.channels.cache.find(c => c.name === CHANNEL_NAME && c.parentId === cat.id);
        if (!ch) {
            ch = await guild.channels.create({
                name: CHANNEL_NAME,
                type: 0,
                parent: cat.id,
                permissionOverwrites: [{ id: guild.id, deny: [PermissionsBitField.Flags.SendMessages], allow: [PermissionsBitField.Flags.ViewChannel] }]
            });

            const embed = new EmbedBuilder()
                .setTitle('👑 **ZX ROYAL HOSTING CYBER V4**')
                .setDescription('━━━━━━━━━━━━━━━━━━━━━━\n\n✨ **أهلاً بك في نظام الاستضافة والتحكم الملكي 24/7**\n\n🔒 **هذه القناة مخصصة ومحمية بالكامل.**\nاضغط على الزر أدناه للوصول المباشر إلى لوحة التحكم الخاصة بك.\n\n━━━━━━━━━━━━━━━━━━━━━━')
                .setColor('#00f0ff')
                .setFooter({ text: 'ZX Royal Elite Protection • Always Online' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('get_dash').setLabel('🚀 دخول اللوحة الملكية').setStyle(ButtonStyle.Primary)
            );

            await ch.send({ embeds: [embed], components: [row] });
        }
    } catch (e) {}
}

client.once('ready', () => {
    client.user.setActivity('👑 ZX Royal Cyber V4', { type: ActivityType.Watching });
    client.guilds.cache.forEach(g => setupChannels(g));
});

client.on('interactionCreate', async (i) => {
    if (i.isButton() && i.customId === 'get_dash') {
        const url = process.env.RENDER_EXTERNAL_URL || 'https://mc-afk-host.onrender.com';
        await i.reply({ content: `✨ **مرحباً بك يا بطل!**\n\nإليك رابط لوحة التحكم الملكية:\n🔗 **${url}**`, ephemeral: true });
    }
});

if (process.env.DISCORD_TOKEN) client.login(process.env.DISCORD_TOKEN);

