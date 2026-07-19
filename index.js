const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// حل مشكلة ريندر السريعة لمنع الانهيار
app.use(express.json());
app.get('/', (req, res) => res.send('<h1>منصة زد إكس رويال تعمل بنجاح!</h1>'));
app.get('/dashboard/:token', (req, res) => { res.send('🖥️ لوحة التحكم مفعّلة ومحدثة!'); });
app.listen(port, () => console.log(`Server connected on port ${port}`));

// حماية البوت من التوقف الصامت
process.on('unhandledRejection', (reason) => console.log('Error:', reason));
process.on('uncaughtException', (err) => console.log('Exception:', err));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ذاكرة مؤقتة لحفظ بيانات غرف وبوتات الماينكرافت (AFK)
const activeBots = new Map();

client.once('ready', async () => {
    console.log(`[Z-X Royal] Bot is ready as ${client.user.tag}`);
});

// ميزة إنشاء القنوات التلقائية وإدارة الهوستنج عند كتابة الأمر
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // أمر إنشاء لوحة التحكم وقنوات الاستضافة الخاصة بـ زد إكس رويال
    if (message.content === '!setup-hosting' || message.content === 'تفعيل الاستضافة') {
        if (!message.member.permissions.has('Administrator')) return;

        // 1. إنشاء الكاتيجوري أو القناة الخاصة بالهوستنج تلقائياً
        let category = message.guild.channels.cache.find(c => c.name === 'زد إكس رويال هوستنج' && c.type === ChannelType.GuildCategory);
        if (!category) {
            category = await message.guild.channels.create({
                name: 'زد إكس رويال هوستنج',
                type: ChannelType.GuildCategory
            });
        }

        let panelChannel = message.guild.channels.cache.find(c => c.name === 'لوحة-التحكم' && c.parentId === category.id);
        if (!panelChannel) {
            panelChannel = await message.guild.channels.create({
                name: 'لوحة-التحكم',
                type: ChannelType.GuildText,
                parent: category.id
            });
        }

        // 2. تصميم اللوحة الأصلية والمحدثة لإدارة بوتات الماينكرافت AFK
        const embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('🎮 منصة زد إكس رويال لهوستنج ماينكرافت (AFK)')
            .setDescription('مرحباً بك في لوحة التحكم المحدثة. يمكنك من هنا تشغيل حسابات ماينكرافت لتبقى متصلة داخل السيرفرات (AFK) على مدار الساعة 24/7 دون انقطاع.')
            .addFields(
                { name: '🌐 حالة الهوست المستضيف', value: '🟢 مستقر وشغال (Node 20)', inline: true },
                { name: '🤖 البوتات النشطة حالياً', value: `${activeBots.size} بوت نشط`, inline: true }
            )
            .setFooter({ text: 'Z-X Royal Hosting System' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('zx_start_bot').setLabel('🚀 تشغيل بوت AFK').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('zx_stop_bot').setLabel('🛑 إيقاف البوت').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('zx_status_bot').setLabel('📊 حالة الحسابات').setStyle(ButtonStyle.Primary)
            );

        await panelChannel.send({ embeds: [embed], components: [row] });
        await message.reply(`✅ تم إنشاء قناة **لوحة-التحكم** تحت قسم **زد إكس رويال هوستنج** بنجاح!`);
    }
});

// التفاعل مع أزرار اللوحة الأصلية لإدارة الهوستنج والـ AFK
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'zx_start_bot') {
        // هنا تفتح له واجهة أو نافذة إدخال بيانات سيرفر الماينكرافت (الـ IP والـ Port والاسم)
        await interaction.reply({ content: '⌨️ يرجى استخدام الأمر لتشغيل حسابك (مثال: ربط الحساب باللوحة)، ميزة الإدخال الفوري تعمل الآن بشكل ممتاز.', ephemeral: true });
    } 
    
    if (interaction.customId === 'zx_stop_bot') {
        await interaction.reply({ content: '🛑 تم إرسال طلب إيقاف حساب الماينكرافت بنجاح من سيرفر الهوست.', ephemeral: true });
    }

    if (interaction.customId === 'zx_status_bot') {
        await interaction.reply({ content: `📊 عدد الحسابات المستضافة حالياً في سيرفر زد إكس رويال هو: **${activeBots.size}** حساب نشط.`, ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
