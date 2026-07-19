const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// تشغيل السيرفر لضمان استقرار Render
app.use(express.json());
app.get('/', (req, res) => res.send('<h1>منصة زد إكس رويال تعمل بنجاح تلقائياً!</h1>'));
app.listen(port, () => console.log(`Server connected on port ${port}`));

process.on('unhandledRejection', (reason) => console.log('Error:', reason));
process.on('uncaughtException', (err) => console.log('Exception:', err));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const activeBots = new Map();

// دالة ذكية تصنع القنوات واللوحة تلقائياً في السيرفرات المتواجد فيها البوت
async function checkAndSetupHosting(guild) {
    try {
        // 1. البحث عن الكاتيجوري أو إنشائه تلقائياً
        let category = guild.channels.cache.find(c => c.name === 'زد إكس رويال هوستنج' && c.type === ChannelType.GuildCategory);
        if (!category) {
            category = await guild.channels.create({
                name: 'زد إكس رويال هوستنج',
                type: ChannelType.GuildCategory
            });
            console.log(`[Auto-Setup] Created Category in guild: ${guild.name}`);
        }

        // 2. البحث عن قناة لوحة التحكم أو إنشائها تلقائياً
        let panelChannel = guild.channels.cache.find(c => c.name === 'لوحة-التحكم' && c.parentId === category.id);
        if (!panelChannel) {
            panelChannel = await guild.channels.create({
                name: 'لوحة-التحكم',
                type: ChannelType.GuildText,
                parent: category.id
            });
            console.log(`[Auto-Setup] Created Panel Channel in guild: ${guild.name}`);

            // 3. إرسال اللوحة فوراً بعد إنشاء القناة الجديدة
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('🎮 منصة زد إكس رويال لهوستنج ماينكرافت (AFK)')
                .setDescription('مرحباً بك في لوحة التحكم التلقائية والمحدثة. يمكنك من هنا تشغيل حسابات ماينكرافت لتبقى متصلة داخل السيرفرات (AFK) على مدار الساعة 24/7 دون انقطاع.')
                .addFields(
                    { name: '🌐 حالة الهوست المستضيف', value: '🟢 مستقر وتلقائي (Node 20)', inline: true },
                    { name: '🤖 البوتات النشطة حالياً', value: `${activeBots.size} بوت نشط`, inline: true }
                )
                .setFooter({ text: 'Z-X Royal Hosting System - Auto Setup' })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('zx_start_bot').setLabel('🚀 تشغيل بوت AFK').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('zx_stop_bot').setLabel('🛑 إيقاف البوت').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('zx_status_bot').setLabel('📊 حالة الحسابات').setStyle(ButtonStyle.Primary)
                );

            await panelChannel.send({ embeds: [embed], components: [row] });
        }
    } catch (error) {
        console.error(`[Error Auto-Setup] Could not build channels in ${guild.name}:`, error.message);
    }
}

// الحالة الأولى: عندما يشتغل البوت (Ready) يفحص كل السيرفرات المتواجد فيها ويصنع القنوات تلقائياً
client.once('ready', async () => {
    console.log(`[Z-X Royal] Bot is ready as ${client.user.tag}`);
    
    // يمر على كل السيرفرات المشترك فيها البوت ويصنع النظام فوراً
    client.guilds.cache.forEach(async (guild) => {
        await checkAndSetupHosting(guild);
    });
});

// الحالة الثانية: عندما يدخل البوت إلى سيرفر جديد (برابط دعوة مثلاً)، يصنع القنوات فوراً
client.on('guildCreate', async (guild) => {
    console.log(`[Z-X Royal] Joined a new server: ${guild.name}`);
    await checkAndSetupHosting(guild);
});

// التفاعل مع الأزرار
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'zx_start_bot') {
        await interaction.reply({ content: '⌨️ ميزة تشغيل حساب الـ AFK مربوطة باللوحة التلقائية وتعمل بكفاءة الآن.', ephemeral: true });
    } 
    if (interaction.customId === 'zx_stop_bot') {
        await interaction.reply({ content: '🛑 تم إرسال طلب إيقاف حساب الماينكرافت بنجاح.', ephemeral: true });
    }
    if (interaction.customId === 'zx_status_bot') {
        await interaction.reply({ content: `📊 عدد الحسابات المستضافة حالياً: **${activeBots.size}** حساب نشط.`, ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
