const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ⚡ الجسر البرمجي لاستقبال الأوامر من اللوحة
app.post('/api/toggle-feature', (req, res) => {
    const { feature, status } = req.body;
    console.log(`[نظام الحماية] تغيير حالة ميزة: (${feature}) <- ${status ? 'مفعل 🟢' : 'معطل 🔴'}`);
    res.json({ success: true });
});

// 🔮 صفحة لوحة التحكم (Dashboard)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
    <title>ZX Royal Elite Hosting Dashboard v3</title>
    <style>
        :root { 
            --primary: #00ffcc; 
            --secondary: #0099ff; 
            --dark-bg: #040712; 
            --card-bg: #0b132b; 
            --text: #f3f4f6; 
            --purple: #a855f7;
            --danger: #ef4444;
            --warning: #f59e0b;
        }
        body { 
            background: var(--dark-bg); 
            color: var(--text); 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            text-align: right; 
            margin: 0; 
            padding: 15px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
        }
        .box { 
            width: 100%; 
            max-width: 520px; 
            background: var(--card-bg); 
            padding: 22px; 
            border-radius: 24px; 
            border: 1px solid rgba(0, 255, 204, 0.15);
            box-shadow: 0 0 30px rgba(0, 255, 204, 0.08);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        h2 { color: var(--primary); margin: 5px 0; font-size: 20px; text-shadow: 0 0 15px rgba(0, 255, 204, 0.4); text-align: center; font-weight: bold; }
        .subtitle { text-align: center; font-size: 11px; color: #6b7280; margin-top: -10px; margin-bottom: 5px; }
        
        .status-badge { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            background: rgba(0, 255, 204, 0.1); 
            border: 1px solid var(--primary); 
            padding: 10px 14px; 
            border-radius: 14px; 
            font-size: 12px;
        }

        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .metric-card { background: #060913; border: 1px solid #1f2937; padding: 8px 6px; border-radius: 12px; text-align: center; }
        .metric-value { font-size: 13px; font-weight: bold; color: var(--primary); }
        .metric-label { font-size: 10px; color: #6b7280; margin-top: 2px; }
    </style>
</head>
<body>
    <div class="box">
        <h2>زد إكس رويال | منصة استضافة النخبة V3</h2>
        <div class="subtitle">نظام حماية وإبقاء خوادم الماينكرافت متصلة 24/7</div>
        
        <div class="status-badge">
            <span>حالة اتصال نظام الاستضافة:</span>
            <strong style="color: var(--primary);">متصل بالخادم الرئيسي 🟢</strong>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">5%</div>
                <div class="metric-label">ضغظ الـ CPU</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">140 MB</div>
                <div class="metric-label">استهلاك الـ RAM</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">12ms</div>
                <div class="metric-label">استجابة الـ Ping</div>
            </div>
        </div>
    </div>
</body>
</html>
    `);
});

// تشغيل الخادم
app.listen(port, () => {
    console.log(`[السيرفر] يعمل بنجاح على المنفذ: ${port}`);
});

// 🤖 تشغيل بوت الديسكورد
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.once('ready', () => {
    console.log(`[الديسكورد] تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
});

// ربط توكين الديسكورد
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
if (DISCORD_TOKEN) {
    client.login(DISCORD_TOKEN);
} else {
    console.log('[تنبيه] يرجى إدخال DISCORD_TOKEN في إعدادات البيئة (Environment Variables) على Render.');
}

