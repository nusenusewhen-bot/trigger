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
  Events
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Store configurations
const config = {
  panelCategory: null,
  serviceCategory: null
};

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  // Register slash commands
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

// Panel Command
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
  
  // Panel Category Command
  if (interaction.commandName === 'panelcategory') {
    const category = interaction.options.getChannel('category');
    config.panelCategory = category.id;
    await interaction.reply({ content: `✅ Panel tickets will now be created in ${category}`, ephemeral: true });
  }
  
  // Service Panel Command
  if (interaction.commandName === 'servicepanel') {
    const imageUrl = interaction.options.getString('image');
    
    const embed = new EmbedBuilder()
      .setTitle('💼 Robuck Service')
      .setDescription(`**Sell your stuff to me**
Via:
• Crypto
• PayPal
• CashApp
• Venmo
• In-games
• Robux

**Buy my stuff**
Via:
• Crypto
• PayPal
• CashApp
• Venmo
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
  
  // Service Category Command
  if (interaction.commandName === 'servicecategory') {
    const category = interaction.options.getChannel('category');
    config.serviceCategory = category.id;
    await interaction.reply({ content: `✅ Service tickets will now be created in ${category}`, ephemeral: true });
  }
  
  // Close Command
  if (interaction.commandName === 'close') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ This is not a ticket channel!', ephemeral: true });
    }
    
    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
    
    setTimeout(async () => {
      await interaction.channel.delete().catch(console.error);
    }, 5000);
  }
});

// Button Handler
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  
  // Main Panel Ticket
  if (interaction.customId === 'create_ticket') {
    if (!config.panelCategory) {
      return interaction.reply({ content: '❌ Panel category not set! Use `/panelcategory` first.', ephemeral: true });
    }
    
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
      .setTitle('🎫 Ticket Created')
      .setDescription(`Welcome ${interaction.user}! Support will be with you shortly.\n\nPlease describe what you'd like to buy.`)
      .setColor(0x5865F2);
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Close Ticket')
          .setStyle(ButtonStyle.Danger)
      );
    
    await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
  }
  
  // Buy Stuff Ticket
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
      .setDescription(`Welcome ${interaction.user}! You want to **buy** something.\n\nPlease tell us what you'd like to purchase and your preferred payment method:\n• Crypto\n• PayPal\n• CashApp\n• Venmo\n• In-games\n• Robux`)
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
  
  // Sell Stuff Ticket
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
      .setDescription(`Welcome ${interaction.user}! You want to **sell** something.\n\nPlease describe what you're selling and your preferred payment method:\n• Crypto\n• PayPal\n• CashApp\n• Venmo\n• In-games\n• Robux`)
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
  
  // Close Button
  if (interaction.customId === 'close_ticket') {
    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
    
    setTimeout(async () => {
      await interaction.channel.delete().catch(console.error);
    }, 5000);
  }
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Failed to login:', err);
  process.exit(1);
});
