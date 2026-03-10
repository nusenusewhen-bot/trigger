require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const config = {
  panelCategory: null,
  serviceCategory: null
};

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  const commands = [
    new SlashCommandBuilder()
      .setName('panel')
      .setDescription('Spawn the main ticket panel')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option => 
        option.setName('image')
          .setDescription('Optional image URL for the embed')
          .setRequired(false)
      ),
    
    new SlashCommandBuilder()
      .setName('panelcategory')
      .setDescription('Set where ticket panels create tickets')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addChannelOption(option => 
        option.setName('category')
          .setDescription('The category for tickets')
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(true)
      ),
    
    new SlashCommandBuilder()
      .setName('servicepanel')
      .setDescription('Spawn the service selection panel')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option => 
        option.setName('image')
          .setDescription('Optional image URL for the embed')
          .setRequired(false)
      ),
    
    new SlashCommandBuilder()
      .setName('servicecategory')
      .setDescription('Set where service panel tickets go')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addChannelOption(option => 
        option.setName('category')
          .setDescription('The category for service tickets')
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(true)
      ),
    
    new SlashCommandBuilder()
      .setName('close')
      .setDescription('Close the current ticket')
  ];
  
  await client.application.commands.set(commands);
  console.log('✅ Slash commands registered');
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'panel') {
    const imageUrl = interaction.options.getString('image');
    
    const embed = new EmbedBuilder()
      .setTitle('🎮 Robux Service')
      .setDescription('Are you looking to buy robux? You\'re in the right place. Place an order and robux will be sent to you via Gamepass/Giftcard within 30 minutes.')
      .setColor(0x5865F2)
      .setTimestamp();
    
    if (imageUrl) {
      embed.setImage(imageUrl);
    }
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('🎫 Create Ticket')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.reply({ embeds: [embed], components: [row] });
  }
  
  if (interaction.commandName === 'panelcategory') {
    const category = interaction.options.getChannel('category');
    config.panelCategory = category.id;
    await interaction.reply({ content: `✅ Panel tickets will now be created in ${category}`, ephemeral: true });
  }
  
  if (interaction.commandName === 'servicepanel') {
    const imageUrl = interaction.options.getString('image');
    
    const embed = new EmbedBuilder()
      .setTitle('💼 Robuck Service')
      .setDescription(`**Sell your stuff to me**
Via:
• Crypto
• PayPal
• In-games
• Robux

**Buy my stuff**
Via:
• Crypto
• PayPal
• In-games
• Robux`)
      .setColor(0x57F287)
      .setTimestamp();
    
    if (imageUrl) {
      embed.setImage(imageUrl);
    }
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('buy_stuff')
          .setLabel('💰 Buy My Stuff')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('sell_stuff')
          .setLabel('💵 Sell Your Stuff')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.reply({ embeds: [embed], components: [row] });
  }
  
  if (interaction.commandName === 'servicecategory') {
    const category = interaction.options.getChannel('category');
    config.serviceCategory = category.id;
    await interaction.reply({ content: `✅ Service tickets will now be created in ${category}`, ephemeral: true });
  }
  
  if (interaction.commandName === 'close') {
    if (!interaction.channel.name.startsWith('ticket-') && 
        !interaction.channel.name.startsWith('buy-') && 
        !interaction.channel.name.startsWith('sell-')) {
      return interaction.reply({ content: '❌ This is not a ticket channel!', ephemeral: true });
    }
    
    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
    
    setTimeout(async () => {
      await interaction.channel.delete().catch(console.error);
    }, 5000);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  
  if (interaction.customId === 'create_ticket') {
    if (!config.panelCategory) {
      return interaction.reply({ content: '❌ Panel category not set! Use `/panelcategory` first.', ephemeral: true });
    }
    
    const modal = new ModalBuilder()
      .setCustomId('robux_order_modal')
      .setTitle('🎮 Robux Order Form');
    
    const robuxAmountInput = new TextInputBuilder()
      .setCustomId('robux_amount')
      .setLabel('How much robux are you buying?')
      .setPlaceholder('Example: 1000, 5000, 10000')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);
    
    const paymentInput = new TextInputBuilder()
      .setCustomId('payment_method')
      .setLabel('Payment Method')
      .setPlaceholder('Crypto, PayPal, In-games, Robux')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);
    
    const goFirstInput = new TextInputBuilder()
      .setCustomId('go_first')
      .setLabel('Do you realize you will go first?')
      .setPlaceholder('Yes or No')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);
    
    const row1 = new ActionRowBuilder().addComponents(robuxAmountInput);
    const row2 = new ActionRowBuilder().addComponents(paymentInput);
    const row3 = new ActionRowBuilder().addComponents(goFirstInput);
    
    modal.addComponents(row1, row2, row3);
    
    await interaction.showModal(modal);
  }
  
  if (interaction.customId === 'buy_stuff') {
    if (!config.serviceCategory) {
      return interaction.reply({ content: '❌ Service category not set! Use `/servicecategory` first.', ephemeral: true });
    }
    
    const channel = await interaction.guild.channels.create({
      name: `buy-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: config.serviceCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });
    
    const embed = new EmbedBuilder()
      .setTitle('💰 Buy Order')
      .setDescription(`Welcome ${interaction.user}! You want to **buy** something.\n\nPlease tell us what you'd like to purchase and your preferred payment method:\n• Crypto\n• PayPal\n• In-games\n• Robux`)
      .setColor(0x57F287);
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Close Ticket')
          .setStyle(ButtonStyle.Danger)
      );
    
    await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Buy ticket created: ${channel}`, ephemeral: true });
  }
  
  if (interaction.customId === 'sell_stuff') {
    if (!config.serviceCategory) {
      return interaction.reply({ content: '❌ Service category not set! Use `/servicecategory` first.', ephemeral: true });
    }
    
    const channel = await interaction.guild.channels.create({
      name: `sell-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: config.serviceCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });
    
    const embed = new EmbedBuilder()
      .setTitle('💵 Sell Order')
      .setDescription(`Welcome ${interaction.user}! You want to **sell** something.\n\nPlease describe what you're selling and your preferred payment method:\n• Crypto\n• PayPal\n• In-games\n• Robux`)
      .setColor(0xEB459E);
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Close Ticket')
          .setStyle(ButtonStyle.Danger)
      );
    
    await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Sell ticket created: ${channel}`, ephemeral: true });
  }
  
  if (interaction.customId === 'close_ticket') {
    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
    
    setTimeout(async () => {
      await interaction.channel.delete().catch(console.error);
    }, 5000);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;
  
  if (interaction.customId === 'robux_order_modal') {
    const robuxAmount = interaction.fields.getTextInputValue('robux_amount');
    const paymentMethod = interaction.fields.getTextInputValue('payment_method');
    const goFirst = interaction.fields.getTextInputValue('go_first');
    
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: config.panelCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });
    
    const embed = new EmbedBuilder()
      .setTitle('🎫 New Robux Order')
      .setDescription(`Order from ${interaction.user}`)
      .addFields(
        { name: '👤 User', value: `${interaction.user} (${interaction.user.id})`, inline: false },
        { name: '💎 Robux Amount', value: robuxAmount, inline: true },
        { name: '💳 Payment Method', value: paymentMethod, inline: true },
        { name: '✅ Going First?', value: goFirst, inline: true }
      )
      .setColor(0x5865F2)
      .setTimestamp();
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Close Ticket')
          .setStyle(ButtonStyle.Danger)
      );
    
    await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Ticket created with your order details: ${channel}`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Failed to login:', err);
  process.exit(1);
});
