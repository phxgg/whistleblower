const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ChannelType,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
});

const {
  token,
  logging_channel_ids,
  exclude_channel_ids,
  track_all_channels_by_default
} = require('../config.json');
const Paginator = require('./paginator.js');

if (!logging_channel_ids.message_deleted || !logging_channel_ids.message_edited) {
  console.error('[whistleblower] ERROR: All logging channel IDs need to be provided.');
  process.exit(1);
}

// const trackChannels = [];
const trackChannels = {};

const formatEmoji = (emoji) => {
  return !emoji.id || emoji.available
    ? emoji.toString() // bot has access to unicode emoji
    : `[:${emoji.name}:](${emoji.url})`; // bot cannot use the emoji
};

// prevent exit on error
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

client.on('ready', () => {
  console.log(`[whistleblower] Logged in as ${client.user.tag}`);

  // push all text channels into trackChannels
  if (track_all_channels_by_default) {
    const guilds = client.guilds.cache.map(async guild => {
      trackChannels[guild.id] = [];
      console.log(`[whistleblower] Joined guild ${guild.name}`)

      const channels = await guild.channels.fetch();

      channels.map(channel => {
        if ((channel.type === ChannelType.GuildText
          || channel.type === ChannelType.GuildVoice)
          && !exclude_channel_ids.includes(channel.id)) {
          // trackChannels.push(channel.id);
          trackChannels[guild.id].push(channel.id);

          console.log(`[whistleblower] Tracking channel ${channel.name} (${channel.id})`);
        }
      });
    });
  }
});

/**
 * EVENTS
 */

client.on('messageDelete', async (message) => {
  if (message.partial) return; // content is null or deleted embed

  if (trackChannels[message.guild.id].includes(message.channel.id)) {

    const embed = new EmbedBuilder()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setTitle('Message Deleted')
      .setDescription((message.content) ? message.content : '`empty`')
      .setFooter({
        text: `#${message.channel.name}`
      })
      .setTimestamp(message.createdAt);

    if (message.author.bot) {
      embed.setColor(0x7289DA);
    } else {
      embed.setColor('#ff4040')
    }

    await client.channels.fetch(logging_channel_ids.message_deleted).then((channel) => {
      channel.send({ embeds: [embed] });
    });
  }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (oldMessage.partial) return; // content is null

  if (trackChannels[message.guild.id].includes(newMessage.channel.id)) {

    const embed = new EmbedBuilder()
      .setColor(0x7289DA)
      .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.displayAvatarURL() })
      .setTitle('Message Edited')
      // .setDescription()
      .addFields(
        { name: 'Original', value: (oldMessage.content) ? oldMessage.content : '`empty`' },
        { name: 'Edited', value: (newMessage.content) ? newMessage.content : '`empty`' },
      )
      .setFooter({
        text: `#${newMessage.channel.name}`
      })
      .setTimestamp(newMessage.createdAt);

    await client.channels.fetch(logging_channel_ids.message_edited).then((channel) => {
      channel.send({ embeds: [embed] });
    });
  }
});

/**
 * COMMANDS
 */

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  const member = interaction.member;

  if (!member.permissions.has('ADMINISTRATOR'))
    return interaction.reply({
      content: ':x: You are not an admin.',
      ephemeral: true
    });

  const channel = interaction.options.getChannel('channel') || interaction.channel;

  if (interaction.commandName === 'track') {
    if (trackChannels[interaction.guild.id].indexOf(channel.id) !== -1) {
      return interaction.reply({
        content: `:x: Already tracking ${channel.name}`,
        ephemeral: true
      });
    }
    
    trackChannels[interaction.guild.id].push(channel.id);

    await interaction.reply({
      content: `:white_check_mark: Tracking ${channel.name}`,
      ephemeral: true
    });
  } else if (interaction.commandName === 'untrack') {
    if (trackChannels[interaction.guild.id].indexOf(channel.id) === -1) {
      return interaction.reply({
        content: `:x: Not tracking ${channel.name}`,
        ephemeral: true
      });
    }

    trackChannels[interaction.guild.id].splice(trackChannels[interaction.guild.id].indexOf(channel.id), 1);

    await interaction.reply({
      content: `:white_check_mark: No longer tracking ${channel.name}`,
      ephemeral: true
    });
  }
});

client.login(token);
