const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 🌐 قراءة ملف الويب الخارجي بشكل نظيف وآمن
app.get('/dashboard/:botname', (req, res) => {
    res.sendFile(path.join(__dirname, 'panel.html'));
});

app.get('/', (req, res) => res.send('<h1>منصة زد إكس رويال المطورة جاهزة!</h1>'));
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
                .setTitle('👑 منصة استضافة زد إكس رويال المحدثة | ZX Royal')
                .setDescription('مرحباً بك! نساعدك في إدارة وحماية سيرفرك من الإغلاق عبر اللوحة الخنفسارية المطورة.\n\n👇 اضغط على الزر بالأسفل لفتح اللوحة الفاخرة الخاصة بك!')
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('zx_get_link').setLabel('🔗 فتح لوحة الويب الفاخرة').setStyle(ButtonStyle.Primary)
            );

            await panelChannel.send({ embeds: [embed], components: [row] });
        }
    } catch (error) {
        console.error(error);
    }
}

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    client.guilds.cache.forEach(async (guild) => { await checkAndSetupHosting(guild); });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'zx_get_link') {
        // 🔮 السحر هنا: البوت يكتشف اسم النطاق ورابط السيرفر في ريندر تلقائياً أياً كان اسمه!
        const hostHeader = interaction.guild.client.options.http?.api || ''; 
        // سنستخدم متغير البيئة الافتراضي الذي توفره ريندر تلقائياً أو نعتمد على تحديد الرابط بشكل مرن
        const currentHost = process.env.RENDER_EXTERNAL_URL || `https://onrender.com`;
        
        const renderUrl = `${currentHost}/dashboard/ZX_mc1_7`;
        
        await interaction.reply({ 
            content: `🎯 **تفضل رابط لوحة التحكم الويب الخنفسارية والمطورة بالكامل:**\n🔗 [اضغط هنا لفتح لوحة التحكم الفاخرة](${renderUrl})`, 
            ephemeral: true 
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
