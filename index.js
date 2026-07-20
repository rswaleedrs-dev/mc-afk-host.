const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ActivityType } = require('discord.js');
const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// 🛡️ حماية حاسمة لمنع انهيار السيرفر نهائياً
process.on('uncaughtException', (err) => console.log('[Crash Prevented]:', err.message));
process.on('unhandledRejection', (err) => console.log('[Rejection Prevented]:', err));

let bot = null;
let loopInterval = null;
let features = { 
    autoEat: true, autoMove: false, autoDefense: true, autoReconnect: true, 
    danceAfk: false, lookAtPlayers: true, autoMine: false, lowHpFlee: true, 
    smartAiPilot: true, humanLook: true 
};
let botStatus = { connected: false, health: 20, food: 20, ping: 0, ram: '0 MB', log: 'في انتظار التشغيل...' };

function forceDisconnectBot() {
    features.autoReconnect = false;
    if (loopInterval) clearInterval(loopInterval);
    if (bot) {
        try { bot.end(); bot.removeAllListeners(); } catch (e) {}
        bot = null;
    }
    botStatus.connected = false;
    botStatus.log = 'تم طرد البوت وتنظيف الجلسة بنجاح 🛑';
}

function handleBotLoop() {
    if (!bot || !botStatus.connected) return;
    if (loopInterval) clearInterval(loopInterval);

    let angle = 0;
    loopInterval = setInterval(() => {
        if (!bot || !botStatus.connected) return;

        // update system metrics
        botStatus.ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1) + ' MB';
        botStatus.ping = bot.player ? bot.player.ping : 0;

        // 1. 🛡️ حركة الرأس البشرية التكيفية (Humanoid Look Anti-AFK)
        if (features.humanLook) {
            angle += 0.2;
            const pitch = Math.sin(angle) * 0.2;
            bot.look(bot.entity.yaw + 0.05, pitch, true).catch(() => {});
        }

        // 2. ⚔️ دفاع ذكي عن النفس
        if (features.autoDefense) {
            const target = bot.nearestEntity(e => (e.type === 'mob' || e.type === 'player') && e !== bot.entity && bot.entity.position.distanceTo(e.position) < 3.5);
            if (target) { bot.attack(target); botStatus.log = `⚔️ قتال: ${target.displayName || target.name}`; }
        }

        // 3. 🚶 المشي والاستكشاف
        if (features.autoMove) {
            bot.setControlState('forward', true);
            setTimeout(() => { if (bot) bot.setControlState('forward', false); }, 1000);
        }

        // 4. 🕺 القفز والرقص
        if (features.danceAfk) {
            bot.setControlState('jump', true);
            setTimeout(() => { if (bot) bot.setControlState('jump', false); }, 400);
        }

        // 5. 👁️ النظر للاعبين
        if (features.lookAtPlayers && !features.humanLook) {
            const player = bot.nearestEntity(e => e.type === 'player' && e !== bot.entity);
            if (player) bot.lookAt(player.position.offset(0, player.height, 0)).catch(() => {});
        }

        // 6. ⛏️ التعدين
        if (features.autoMine) {
            const block = bot.blockAt(bot.entity.position.offset(0, 0, 1));
            if (block && block.diggable) bot.dig(block).catch(() => {});
        }

        // 7. 🏃 الهروب عند خطورة الدم
        if (features.lowHpFlee && bot.health <= 6) {
            bot.setControlState('back', true);
            setTimeout(() => { if (bot) bot.setControlState('back', false); }, 1500);
            botStatus.log = '⚠️ صحة منخفضة! جاري الهروب تلقائياً...';
        }

    }, 1500);
}

function startMcBot(ip, port, username) {
    forceDisconnectBot();
    features.autoReconnect = true;
    botStatus.log = 'جاري الاتصال... ⏳';

    bot = mineflayer.createBot({ host: ip, port: parseInt(port) || 25565, username: username || 'ZX_Cyber_V8', checkTimeoutInterval: 60000 });

    bot.on('spawn', () => {
        botStatus.connected = true;
        botStatus.log = 'تم الدخول واستجابة النظام الأسطوري V8 🟢';
        handleBotLoop();
    });

    bot.on('health', () => {
        botStatus.health = Math.round(bot.health);
        botStatus.food = Math.round(bot.food);

        if (features.autoEat && bot.food < 15) {
            const food = bot.inventory.items().find(i => i.name.includes('cooked') || i.name.includes('apple') || i.name.includes('bread'));
            if (food) bot.equip(food, 'hand').then(() => bot.consume()).catch(() => {});
        }
    });

    // 💬 الرد التكيفي الذكي في شات اللعبة
    bot.on('chat', (u, m) => {
        if (u === bot.username) return;
        botStatus.log = `💬 ${u}: ${m.substring(0, 25)}`;
        if (m.toLowerCase().includes(bot.username.toLowerCase()) || m.includes('البوت')) {
            bot.chat(`أهلاً يا ${u}! أنا البوت الملكي ZX V8 يعمل بالذكاء الاصطناعي 👑`);
        }
    });

    bot.on('end', () => {
        botStatus.connected = false;
        botStatus.log = 'انفصل عن السيرفر 🔴';
        if (loopInterval) clearInterval(loopInterval);
        if (features.autoReconnect) setTimeout(() => startMcBot(ip, port, username), 6000);
    });

    bot.on('error', (err) => { botStatus.log = 'خطأ اتصال: ' + err.message; });
}

function parseAiCommand(text) {
    const t = text.toLowerCase();
    if (t.includes('اطرد') || t.includes('اخرج') || t.includes('طفي') || t.includes('انقلع')) {
        forceDisconnectBot();
        return 'تم إخراج البوت وإلغاء الجلسة بنجاح 🛑';
    }
    if (t.includes('مشي') || t.includes('تحرك') || t.includes('امشي')) {
        features.autoMove = true;
        return 'تم تفعيل نمط المشي الذكي 🚶';
    }
    if (t.includes('وقف') || t.includes('اثبت')) {
        features.autoMove = false;
        return 'تم إيقاف الحركة 🛑';
    }
    if (t.includes('ارقص') || t.includes('نط') || t.includes('اقفز')) {
        features.danceAfk = true;
        return 'تم تشغيل نمط القفز والرقص AFK 🕺';
    }
    if (t.includes('احمي') || t.includes('دافع') || t.includes('قاتل')) {
        features.autoDefense = true;
        return 'تم تشغيل الدفاع والقتال الذاتي ⚔️';
    }
    if (t.includes('اكل') || t.includes('كل')) {
        features.autoEat = true;
        return 'تم تفعيل التغذية التلقائية 🍖';
    }
    return 'فهمت طلبك وجاري تحسين الاستجابة! (أمثلة: اطرد البوت، شغل المشي، ارقص، احميني...)';
}

app.post('/api/action', (req, res) => {
    const { type, ip, port, username, feature, status, msg, aiText } = req.body;
    if (type === 'start') { startMcBot(ip, port, username); return res.json({ success: true }); }
    if (type === 'stop') { forceDisconnectBot(); return res.json({ success: true }); }
    if (type === 'toggle') { features[feature] = status; return res.json({ success: true }); }
    if (type === 'chat' && bot && botStatus.connected) { bot.chat(msg); botStatus.log = `تم إرسال: ${msg}`; return res.json({ success: true }); }
    if (type === 'ai') { 
        const reply = parseAiCommand(aiText); 
        botStatus.log = `🤖 AI Engine: ${reply}`;
        return res.json({ success: true, reply }); 
    }
    res.json({ success: false });
});

app.get('/api/status', (req, res) => res.json({ botStatus, features }));

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZX Royal Cyber AI V8</title>
    <style>
        :root { --p: #00f0ff; --purple: #a855f7; --bg: #030712; --card: rgba(15, 23, 42, 0.92); --danger: #ff0055; --green: #00ffcc; }
        body { background: radial-gradient(circle at top, #0f172a 0%, #030712 100%); color: #fff; font-family: system-ui, sans-serif; padding: 12px; margin: 0; display: flex; justify-content: center; }
        .box { width: 100%; max-width: 480px; background: var(--card); backdrop-filter: blur(15px); padding: 20px; border-radius: 22px; border: 1px solid rgba(0, 240, 255, 0.4); box-shadow: 0 0 40px rgba(0,240,255,0.25); display: flex; flex-direction: column; gap: 12px; }
        h1 { background: linear-gradient(90deg, var(--p), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; font-size: 22px; margin: 0; font-weight: 900; }
        .badge { background: rgba(3,7,18,0.9); border: 1px solid #1e293b; padding: 10px; border-radius: 12px; font-size: 11px; text-align: center; display:flex; justify-content:space-around; }
        .sec { background: rgba(3,7,18,0.7); border: 1px solid #1e293b; padding: 12px; border-radius: 14px; display: flex; flex-direction: column; gap: 8px; }
        .sec-t { font-size: 11px; font-weight: bold; color: var(--p); }
        input { padding: 9px; background: #030712; border: 1px solid #1e293b; border-radius: 8px; color: #fff; font-size: 12px; width: 100%; box-sizing: border-box; }
        .btn { padding: 11px; border: none; border-radius: 10px; font-weight: bold; font-size: 12px; cursor: pointer; }
        .btn-green { background: linear-gradient(90deg, var(--p), var(--purple)); color: #000; }
        .btn-red { background: rgba(255,0,85,0.2); border: 1px solid var(--danger); color: var(--danger); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tgl { background: #030712; border: 1px solid #1e293b; padding: 10px; border-radius: 10px; color: #94a3b8; font-size: 10px; font-weight: bold; cursor: pointer; text-align: center; }
        .tgl.active { border-color: var(--green); color: var(--green); background: rgba(0, 255, 204, 0.12); box-shadow: 0 0 10px rgba(0,255,204,0.2); }
    </style>
</head>
<body>
    <div class="box">
        <h1>👑 ZX CYBER AI ENGINE V8</h1>
        
        <div class="badge" id="st">
            <span>الحالة: <b style="color:var(--danger)">منفصل 🛑</b></span>
            <span>الرام: <b style="color:var(--p)" id="ram">0 MB</b></span>
            <span>البينج: <b style="color:var(--green)" id="ping">0 ms</b></span>
        </div>
        
        <div class="sec">
            <div class="sec-t">📟 أحداث الشات والماب الحية:</div>
            <div id="log" style="font-size:11px; color:#a855f7;">النظام جاهز ومستقر 100% ⚡</div>
        </div>

        <div class="sec">
            <div class="sec-t">🤖 محرك الذكاء الاصطناعي الأسطوري</div>
            <div style="display:flex; gap:5px;">
                <input type="text" id="aiInput" placeholder="أمر الذكاء (مثال: اطرد البوت، شغل المشي، ارقص...)">
                <button class="btn btn-green" style="width:85px;" onclick="sendAi()">تنفيذ AI</button>
            </div>
        </div>

        <div class="sec">
            <div class="sec-t">🎮 بيانات السيرفر والتحكم الحاسم</div>
            <input type="text" id="ip" placeholder="Server IP (مثال: play.server.com)">
            <input type="number" id="port" value="25565">
            <input type="text" id="user" placeholder="اسم البوت">
            <button class="btn btn-green" onclick="control('start')">🚀 دخول واستضافة 24/7</button>
            <button class="btn btn-red" onclick="control('stop')">💥 طرد وإخراج البوت قسرياً</button>
        </div>

        <div class="sec">
            <div class="sec-t">⚡ الميزات الأسطورية الحية</div>
            <div class="grid">
                <button class="tgl active" id="m-humanLook" onclick="toggle('humanLook')">🧠 رأس بشري (Anti-AFK)</button>
                <button class="tgl active" id="m-autoEat" onclick="toggle('autoEat')">🍖 أكل تلقائي</button>
                <button class="tgl active" id="m-autoDefense" onclick="toggle('autoDefense')">⚔️ حماية وقتال</button>
                <button class="tgl" id="m-autoMove" onclick="toggle('autoMove')">🚶 مشي وتوجيه</button>
                <button class="tgl active" id="m-lookAtPlayers" onclick="toggle('lookAtPlayers')">👁️ نظر للاعبين</button>
                <button class="tgl" id="m-autoMine" onclick="toggle('autoMine')">⛏️ تعدين تلقائي</button>
                <button class="tgl active" id="m-lowHpFlee" onclick="toggle('lowHpFlee')">🏃 هروب عند خطر</button>
                <button class="tgl" id="m-danceAfk" onclick="toggle('danceAfk')">🕺 مود الرقص AFK</button>
                <button class="tgl active" id="m-autoReconnect" onclick="toggle('autoReconnect')">🔄 اتصال 24/7</button>
            </div>
            
            <div style="display:flex; gap:5px; margin-top:5px;">
                <input type="text" id="chatMsg" placeholder="إرسال رسالة لشات اللعبة...">
                <button class="btn btn-green" style="width:75px;" onclick="sendChat()">إرسال</button>
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
        async function sendAi() {
            const text = document.getElementById('aiInput').value;
            await fetch('/api/action', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type: 'ai', aiText: text }) });
            document.getElementById('aiInput').value = '';
        }
        setInterval(async () => {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                document.getElementById('st').children[0].innerHTML = data.botStatus.connected 
                    ? 'الحالة: <b style="color:var(--green)">متصل 🟢 (❤️ ' + data.botStatus.health + ' | 🍖 ' + data.botStatus.food + ')</b>'
                    : 'الحالة: <b style="color:var(--danger)">منفصل 🛑</b>';
                document.getElementById('ram').innerText = data.botStatus.ram;
                document.getElementById('ping').innerText = data.botStatus.ping + ' ms';
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
                .setTitle('👑 **ZX CYBER AI HOSTING V8**')
                .setDescription('━━━━━━━━━━━━━━━━━━━━━━\n\n✨ **أقوى نظام استضافة وتحكم بالذكاء الاصطناعي 24/7**\n\n🔒 **القناة مخصصة ومحمية.**\nاضغط على الزر للوصول المباشر للوحة التحكم الاسطورية V8!\n\n━━━━━━━━━━━━━━━━━━━━━━')
                .setColor('#00f0ff')
                .setFooter({ text: 'ZX Cyber AI • Zero Error System' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('get_dash').setLabel('🚀 دخول لوحة Cyber AI V8').setStyle(ButtonStyle.Primary)
            );

            await ch.send({ embeds: [embed], components: [row] });
        }
    } catch (e) {}
}

client.once('ready', () => {
    client.user.setActivity('👑 ZX Cyber AI Engine V8', { type: ActivityType.Watching });
    client.guilds.cache.forEach(g => setupChannels(g));
});

client.on('interactionCreate', async (i) => {
    if (i.isButton() && i.customId === 'get_dash') {
        const url = process.env.RENDER_EXTERNAL_URL || 'https://mc-afk-host.onrender.com';
        await i.reply({ content: `✨ **مرحباً بك يا بطل!**\n\nرابط اللوحة الأسطورية V8:\n🔗 **${url}**`, ephemeral: true });
    }
});

if (process.env.DISCORD_TOKEN) client.login(process.env.DISCORD_TOKEN);

