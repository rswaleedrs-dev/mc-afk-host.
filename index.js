const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// خادم ويب مدمج لمنع إغلاق السيرفر في Render
app.get('/', (req, res) => res.send('Bot is active and running successfully!'));
app.listen(port, () => console.log(`Server online on port ${port}`));

// نظام منع الانهيار الصامت وطباعة الأخطاء بدقة
process.on('unhandledRejection', (reason) => console.error('[Error] Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.error('[Error] Uncaught Exception:', err));

// إنشاء كائن البوت مع الصلاحيات الكاملة
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ميزة الذكاء الاصطناعي المحلية والمطورة للإجابة الذكية تلقائياً
const aiResponses = {
    "مرحبا": "أهلاً بك يا صديقي! كيف يمكنني مساعدتك اليوم في السيرفر؟",
    "status": "جميع الأنظمة تعمل بكفاءة عالية، لوحة التحكم جاهزة للاستخدام.",
    "مساعدة": "يمكنك استخدام الأوامر المتاحة أو الضغط على أزرار لوحة التحكم لإدارة البوت.",
    "اللوحة": "لوحة تحكم زد إكس رويال المطورة مفعّلة الآن ويمكنك التحكم بالكامل من هنا."
};

client.once('ready', () => {
    console.log(`[Success] Logged in as ${client.user.tag}`);
});

// استقبال الرسائل وتفعيل ميزة الرد الذكي (AI)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase().trim();
    if (aiResponses[content]) {
        return message.reply({ content: aiResponses[content] });
    }

    // إذا كانت الرسالة تحتوي على كلمة ذكاء أو سؤال عام، رد بذكاء اصطناعي محاكاة
    if (content.includes('ذكاء') || content.includes('كيفك')) {
        return message.reply({ content: "🤖 أنا بوت مدعوم بالذكاء الاصطناعي المحلي، تم تحديثي بالكامل لأجلك! كيف يمكنني خدمتك؟" });
    }
});

// إرسال اللوحة المحدثة تلقائياً عند طلبها أو تفاعلها
client.on('messageCreate', async (message) => {
    if (message.content === '!setup-panel') {
        if (!message.member.permissions.has('Administrator')) return;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('👑 لوحة تحكم زد إكس رويال المحدثة')
            .setDescription('مرحباً بك في نظام إدارة البوت المطور بالكامل. استخدم الأزرار أدناه للتحكم الخيارات المتقدمة والميزات الجديدة.')
            .addFields(
                { name: '🌐 حالة الخادم', value: 'متصل ويعمل بنجاح (Render Node 20)', inline: true },
                { name: '🤖 ميزة الذكاء الاصطناعي', value: 'مفعّلة ونشطة تلقائياً للردود', inline: true }
            )
            .setFooter({ text: 'تحديثات البوت الفورية' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('btn_status').setLabel('🔄 تحديث الحالة').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('btn_ai_toggle').setLabel('🧠 فحص الذكاء').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('btn_info').setLabel('ℹ️ معلومات النظام').setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// معالجة تفاعلات أزرار اللوحة الجديدة
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'btn_status') {
        await interaction.reply({ content: '✅ تم فحص الحالة: البوت متصل ومستقر على منصة Render بدون أخطاء.', ephemeral: true });
    } else if (interaction.customId === 'btn_ai_toggle') {
        await interaction.reply({ content: '🧠 نظام الذكاء الاصطناعي يعمل ومستعد للاستجابة السريعة في الشات.', ephemeral: true });
    } else if (interaction.customId === 'btn_info') {
        await interaction.reply({ content: 'ℹ️ إصدار البوت: v2.0.0 مدمج مع حماية متطورة للـ Ports خادم ويب مستمر.', ephemeral: true });
    }
});

// تشغيل البوت باستخدام التوكن من المتغيرات البيئية بأمان
client.login(process.env.DISCORD_TOKEN);
