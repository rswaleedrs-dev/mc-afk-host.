const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, ActivityType } = require('discord.js');
const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// 🤖 متغيرات حالة بوت الماينكرافت والميزات
let bot = null;
let features = { autoEat: true, autoMove: false, antiAfk: true };
let botStatus = { connected: false, health: 20, food: 20 };

// 🎮 دالة تشغيل بوت الماينكرافت عند الطلب من اللوحة
function startMcBot(ip, port, username) {
    if (bot) { try { bot.quit(); } catch(e){} }
    
    bot = mineflayer.createBot({
        host: ip,
        port: parseInt(port) || 25565,
        username: username || 'ZX_AFK_Bot'
    });

    bot.on('spawn', () => {
        botStatus.connected = true;
        console.log(`[Mineflayer] دخل البوت إلى السيرفر: ${ip}`);
    });

    bot.on('health', () => {
        botStatus.health = Math.round(bot.health);
        botStatus.food = Math.round(bot.food);
    });

    bot.on('end', () => {
        botStatus.connected = false;
        console.log('[Mineflayer] انفصل البوت عن السيرفر');
    });

    bot.on('error', (err) => console.log('[Mineflayer Error]:', err.message));
}

// ⚡ استقبال أوامر الأزرار من اللوحة
app.post('/api/action', (req, res) => {
    const { type, ip, port, username, feature, status } = req.body;

    if (type === 'start') {
        startMcBot(ip, port, username);
        return res.json({ success: true, message: 'جاري الاتصال بالسيرفر...' });
    }

    if (type === 'stop') {
        if (bot) { bot.quit(); bot = null; }
        botStatus.connected = false;
        return res.json({ success: true, message: 'تم إيقاف البوت' });
    }

    if (type === 'toggle') {
        features[feature] = status;
        if (bot && botStatus.connected) {
            // التحكم بالحركة داخل اللعبة
            if (feature === 'autoMove') {
                bot.setControlState('forward', status);
            }
        }
        return res.json({ success: true });
    }

    res.json({ success: false });
});

// 📊 إرسال بيانات الحالة الحية للوحة
app.get('/api/status', (req, res) => {
    res.json({ botStatus, features });
});

// 🔮 واجهة لوحة التحكم الأسطورية ZX Royal
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZX Royal Hosting Dashboard</title>
    <style>
        :root { --p: #00ffcc; --bg: #040712; --card: #0b132b; --txt: #f3f4f6; --danger: #ef4444; }
        body { background: var(--bg); color: var(--txt); font-family: system-ui, sans-serif; padding: 15px; display: flex; justify-content: center; }
        .box { width: 100%; max-width: 480px; background: var(--card); padding: 20px; border-radius: 20px; border: 1px solid rgba(0,255,204,0.2); box-shadow: 0 0 25px rgba(0,255,204,0.1); }
        h2 { color: var(--p); text-align: center; margin: 5px 0 15px; font-size: 22px; }
        .badge { background: #060913; border: 1px solid #1f2937; padding: 10px; border-radius: 12px; font-size: 13px; text-align: center; margin-bottom: 15px; }
        .group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
        label { font-size: 11px; color: #9ca3af; }
        input { padding: 10px; background: #060913; border: 1px solid #1f2937; border-radius: 8px; color: #fff; font-size: 13px; }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 5px; transition: 0.2s; }
        .btn-green { background: var(--p); color: #000; }
        .btn-red { background: var(--danger); color: #fff; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
        .toggle-btn { background: #060913; border: 1px solid #1f2937; padding: 12px; border-radius: 10px; color: #fff; font-size: 12px; cursor: pointer; text-align: center; }
        .toggle-btn.active { border-color: var(--p); color: var(--p); background: rgba(0,255,204,0.1); }
    </style>
</head>
<body>
    <div class="box">
        <h2>👑 زد إكس رويال | ZX Royal</h2>
        <div class="badge" id="st">حالة البوت: <b style="color:var(--danger)">منفصل 🔴</b></div>
        
        <div class="group"><label>IP السيرفر:</label><input type="text" id="ip" placeholder="play.server.com"></div>
        <div class="group"><label>Port المنفذ:</label><input type="number" id="port" value="25565"></div>
        <div class="group"><label>اسم البوت:</label><input type="text" id="user" placeholder="ZX_AFK_Bot"></div>
        
        <button class="btn btn-green" onclick="control('start')">🚀 دخول السيرفر</button>
        <button class="btn btn-red" onclick="control('stop')">🛑 إخراج البوت</button>

        <div class="grid">
            <button class="toggle-btn" id="m-autoMove" onclick="toggle('autoMove')">🚶 تحريك أوتوماتيكي</button>
            <button class="toggle-btn active" id="m-autoEat" onclick="toggle('autoEat')">🍖 أكل تلقائي</button>
        </div>
    </div>

    <script>
        async function control(act) {
            const ip = document.getElementById('ip').value;
            const port = document.getElementById('port').value;
            const username = document.getElementById('user').value;
            await fetch('/api/action', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ type: act, ip, port, username })
            });
        }

        async function toggle(feat) {
            const el = document.getElementById('m-' + feat);
            const status = !el.classList.contains('active');
            el.classList.toggle('active', status);
            await fetch('/api/action', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ type: 'toggle', feature: feat, status })
            });
        }

        setInterval(async () => {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                document.getElementById('st').innerHTML = data.botStatus.connected 
                    ? 'حالة البوت: <b style="color:var(--p)">متصل بالماب 🟢 (❤️ ' + data.botStatus.health + ')</b>'
                    : 'حالة البوت: <b style="color:var(--danger)">منفصل 🔴</b>';
            } catch(e){}
        }, 3000);
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`[Express] Port: ${port}`));

// 🤖 تشغيل بوت الديسكورد للتجهيز التلقائي
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const CATEGORY_NAME = '⚙️ | ZX ROYAL HOSTING';
const CHANNEL_NAME = '🌐-لوحة-التحكم';

async function setupChannels(guild) {
    try {
        let cat = guild.channels.cache.find(c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory);
        if (!cat) cat = await guild.channels.create({ name: CATEGORY_NAME, type: ChannelType.GuildCategory });

        let ch = guild.channels.cache.find(c => c.name === CHANNEL_NAME && c.parentId === cat.id);
        if (!ch) {
            ch = await guild.channels.create({
                name: CHANNEL_NAME,
                type: 0,
                parent: cat.id,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.SendMessages], allow: [PermissionsBitField.Flags.ViewChannel] }
                ]
            });
            const embed = new EmbedBuilder()
                .setTitle('👑 منصة زد إكس رويال | ZX Royal Hosting V3')
                .setDescription('اضغط الزر بالأسفل للحصول على لوحة التحكم المباشرة للتحكم ببوتك داخل ماينكرافت!')
                .setColor('#00ffcc');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('get_dash').setLabel('دخول لوحة التحكم 🚀').setStyle(ButtonStyle.Success)
            );

            await ch.send({ embeds: [embed], components: [row] });
        }
    } catch (e) {}
}

client.once('ready', () => {
    client.user.setActivity('24/7 ZX Royal Hosting 👑', { type: ActivityType.Watching });
    client.guilds.cache.forEach(g => setupChannels(g));
});

client.on('interactionCreate', async (i) => {
    if (i.isButton() && i.customId === 'get_dash') {
        const url = process.env.RENDER_EXTERNAL_URL || 'https://mc-afk-host.onrender.com';
        await i.reply({ content: `🔗 رابط لوحة تحكم زد إكس رويال الخاص بك:\n${url}`, ephemeral: true });
    }
});

if (process.env.DISCORD_TOKEN) client.login(process.env.DISCORD_TOKEN);

