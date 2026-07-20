const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, ActivityType } = require('discord.js');
const express = require('express');

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
        :root { --primary: #00ffcc; --dark-bg: #040712; --card-bg: #0b132b; --text: #f3f4f6; }
        body { background: var(--dark-bg); color: var(--text); font-family: sans-serif; text-align: right; padding: 15px; display: flex; justify-content: center; }
        .box { width: 100%; max-width: 520px; background: var(--card-bg); padding: 22px; border-radius: 24px; border: 1px solid rgba(0,255,204,0.15); box-shadow: 0 0 30px rgba(0,255,204,0.08); }
        h2 { color: var(--primary); font-size: 20px; text-align: center; }
        .status-badge { background: rgba(0,255,204,0.1); border: 1px solid var(--primary); padding: 10px; border-radius: 14px; font-size: 12px; display: flex; justify-content: space-between; }
    </style>
</head>
<body>
    <div class="box">
        <h2>زد إكس رويال | منصة استضافة النخبة V3</h2>
        <div class="status-badge">
            <span>حالة اتصال نظام الاستضافة:</span>
            <strong style="color: var(--primary);">متصل بالخادم الرئيسي 🟢</strong>
        </div>
        <p style="text-align: center; font-size: 14px; margin-top: 20px; color: #a855f7;">✨ نظام الحماية والإدارات متصل ويعمل 24/7</p>
    </div>
</body>
</html>
    `);
});

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

// اسم الكاتيجوري واسم القناة المخصصة
const CATEGORY_NAME = '⚙️ | ZX ROYAL HOSTING';
const CHANNEL_NAME = '🌐-لوحة-التحكم';

// دالة الإنشاء والتأكد التلقائي من القنوات
async function setupHostingCategoryAndChannel(guild) {
    try {
        // 1. البحث عن الكاتيجوري أو إنشائه
        let category = guild.channels.cache.find(c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory);
        if (!category) {
            category = await guild.channels.create({
                name: CATEGORY_NAME,
                type: ChannelType.GuildCategory,
            });
            console.log(`[تلقائي] تم إنشاء القسم: ${CATEGORY_NAME}`);
        }

        // 2. البحث عن القناة المخصصة أو إنشاؤها داخل الكاتيجوري
        let channel = guild.channels.cache.find(c => c.name === CHANNEL_NAME && c.parentId === category.id);
        if (!channel) {
            channel = await guild.channels.create({
                name: CHANNEL_NAME,
                type: ChannelType.GuildType ? ChannelType.GuildText : 0,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.id, // @everyone
                        deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions], // منع الرسائل والتفاعلات
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], // رؤية القناة وقراءة التاريخ
                    },
                    {
                        id: client.user.id, // البوت نفسه
                        allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.ManageMessages],
                    }
                ],
            });

            // إرسال رسالة اللوحة الأساسية مع الزر
            const embed = new EmbedBuilder()
                .setTitle('👑 منصة زد إكس رويال | ZX Royal Hosting V3')
                .setDescription('مرحباً بك في نظام استضافة خوادم الماينكرافت الذكي 24/7!\n\n🔒 **هذه القناة مخصصة ومحمية بالكامل.**\nاضغط على الزر أدناه للوصول المباشر والآمن إلى لوحة التحكم الخاصة بك.')
                .setColor('#00ffcc')
                .setThumbnail(guild.iconURL({ dynamic: true }) || null)
                .setFooter({ text: 'ZX Royal Elite Protection System • 24/7 Active' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('get_dashboard')
                        .setLabel('دخول لوحة التحكم 🚀')
                        .setStyle(ButtonStyle.Success)
                );

            await channel.send({ embeds: [embed], components: [row] });
            console.log(`[تلقائي] تم إنشاء القناة المخصصة بنجاح: ${CHANNEL_NAME}`);
        }
    } catch (err) {
        console.error('[خطأ التجهيز التلقائي]:', err.message);
    }
}

client.once('ready', () => {
    console.log(`[الديسكورد] تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
    
    // وضع حالة البوت (Status)
    client.user.setActivity('24/7 Hosting Dashboard 👑', { type: ActivityType.Watching });

    // فحص جميع السيرفرات والتأكد من وجود الكاتيجوري والقناة تلقائياً
    client.guilds.cache.forEach(guild => {
        setupHostingCategoryAndChannel(guild);
    });
});

// عند إضافة البوت لسيرفر جديد يتم إنشاء القناة تلقائياً
client.on('guildCreate', (guild) => {
    setupHostingCategoryAndChannel(guild);
});

// 🛡️ حماية القناة: مسح أي رسالة يحاول شخص كتابتها بالخطأ لإبقاء القناة نظيفة ومخصصة للوحة فقط
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.name === CHANNEL_NAME) {
        try {
            await message.delete(); // مسح الرسالة التخريبية تلقائياً
        } catch (e) {
            console.error('تعذر مسح الرسالة:', e.message);
        }
    }
});

// 🖱️ التفاعل عند الضغط على زر اللوحة
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'get_dashboard') {
        const renderUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
        
        await interaction.reply({
            content: `✨ **أهلاً بك يا بطل!**\n\nإليك رابط لوحة التحكم الخاصة بك للتحكم بالاستضافة وحمايتها:\n🔗 **${renderUrl}**\n\n*(ملاحظة: هذا الرابط آمن ومخفي ولا يراه أحد غيرك)*`,
            ephemeral: true // رسالة مخفية وخصيصة للمستخدم فقط
        });
    }
});

// تسجيل الدخول
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
if (DISCORD_TOKEN) {
    client.login(DISCORD_TOKEN);
} else {
    console.log('[تنبيه] يرجى إدخال DISCORD_TOKEN في إعدادات Render.');
}

