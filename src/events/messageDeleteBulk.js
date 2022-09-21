const { EmbedBuilder } = require('discord.js');
const { getGuild } = require('../services/guild.service');
const { uploadAttachment } = require('../services/attachments.service');

module.exports = {
  name: 'messageDeleteBulk',
  once: false,
  async execute(messages, channel) {
    const guild = await getGuild(channel.guild.id, 'logging_channels track_channels');
    if (!guild) return;

    const loggingChannels = guild?.logging_channels;
    const trackChannels = guild?.track_channels;

    if (!loggingChannels?.message_delete
      || !trackChannels
      || !trackChannels.includes(channel.id)) return;

    for (const message of messages.values()) {
      if (message.partial) return; // content is null or deleted embed
      if (message.author.bot) return // ignore bots

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
          const upload = await uploadAttachment(attachment);
          const attachmentLink = (upload?.link) ? upload.link : 'None';
          embed.addFields({ name: attachment.name, value: attachmentLink, inline: true });
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
