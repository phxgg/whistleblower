const { EmbedBuilder } = require('discord.js');
const { getGuild } = require('../services/guild.service');

module.exports = {
  name: 'messageDelete',
  once: false,
  async execute(message) {
    if (message.partial) return; // content is null or deleted embed
    if (message.author.bot) return // ignore bots

    const guild = await getGuild(message.guild.id, 'logging_channels track_channels');
    if (!guild) return;

    const loggingChannels = guild?.logging_channels;
    const trackChannels = guild?.track_channels;

    if (!loggingChannels?.message_delete || !trackChannels) return;

    if (trackChannels.includes(message.channel.id)) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setTitle('Message Deleted')
        .setDescription((message.content) ? message.content : 'None')
        .setFooter({
          text: `#${message.channel.name}`
        })
        .setTimestamp(message.createdAt);

      if (message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
          embed.addFields({ name: attachment.name, value: attachment.url, inline: true });
        }
      }

      if (message.author.bot) {
        embed.setColor(0x7289DA);
      } else {
        embed.setColor('#ff4040')
      }

      await message.client.channels.fetch(loggingChannels.message_delete).then((channel) => {
        channel.send({ embeds: [embed] });
      });
    }
  }
};
