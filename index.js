const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ميزة الربط: استقبال الأوامر التفاعلية من أزرار واجهة التحكم
app.post('/api/toggle-feature', (req, res) => {
    const { feature, status } = req.body;
    console.log(`[تحكم عن بعد] تم تغيير حالة ميزة (${feature}) إلى: ${status ? 'مفعل 🟢' : 'معطل 🔴'}`);
    
    // هنا مستقبلاً تضع أكواد ماينكرافت الخاصة بالبوت (مثل bot.chat أو تشغيل الـ افك)
    // مثال: if(feature === 'attack' && status) { startAttacking(); }
    
    res.json({ success: true, message: `وصل الأمر بنجاح للميزة ${feature}` });
});

// قراءة ملف الويب الخارجي بشكل نظيف وآمن
app.get('/dashboard/:botname', (req, res) => {
    res.sendFile(path.join(__dirname, 'panel.html'));
});

app.get('/', (req, res) => {
    res.send('<h1>مساعد زد إكس رويال للوحة التحكم - السيرفر يعمل بنجاح أونلاين</h1>');
});

app.listen(port, () => console.log(`Server connected on port ${port}`));

process.on('unhandledRejection', (reason) => console.log('Error:', reason));
process.on('uncaughtException', (err) => console.log('Exception:', err));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

async function checkAndSetupHosting(guild) {
    try {
        let category = guild.channels.cache.find(c => c.name === '👑-zx-royal-hosting' && c.type === ChannelType.GuildCategory);
        if (!category) {
            category = await guild.channels.create({ name: '👑-zx-royal-hosting', type: ChannelType.GuildCategory });
        }

        let panelChannel = guild.channels.cache.find(c => c.name === '👑-zx-royal-hosting' && c.parentId === category.id);
        if (!panelChannel) {
            panelChannel = await guild.channels.create({ name: '👑-zx-royal-hosting', type: ChannelType.GuildText, parent: category.id });
            
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('ZX Royal | منصة استضافة زد إكس رويال المحمية')
                .setDescription('مرحباً بك! نساعدك في إدارة وحماية سيرفرك من الاختراق عبر اللوحة الخارجية المطورة.')
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('zx_get_link').setLabel('فتح لوحة التحكم 🌐').setStyle(ButtonStyle.Primary)
            );

            await panelChannel.send({ embeds: [embed], components: [row] });
        }
    } catch (error) {
        console.error(error);
    }
}

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    client.guilds.cache.forEach(async (guild) => {
        await checkAndSetupHosting(guild);
    });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'zx_get_link') {
        const hostHeader = interaction.guild.client.options.http?.api || '';
        const currentHost = process.env.RENDER_EXTERNAL_URL || 'https://onrender.com';
        const renderUrl = `${currentHost}/dashboard/zx_rc1_7`;

        await interaction.reply({
            content: `🔗 [اضغط هنا لفتح لوحة التحكم الفاخرة](${renderUrl}) **تفعل رابط لوحة التحكم المطور والخرافي بالكامل**`,
            ephemeral: true
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
