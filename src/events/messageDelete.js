import { EmbedBuilder, Events } from 'discord.js';
import { getGuild } from '../services/guild.service.js';
import { uploadAttachment } from '../services/attachments.service.js';

export default {
  name: Events.MessageDelete,
  once: false,
  /**
   * @param {import('discord.js').Message} message
   */
  async execute(message) {
    if (message.partial) return; // content is null or deleted embed
    if (message.author.bot) return; // ignore bots

    const guild = await getGuild(message.guild.id, 'logging_channels track_channels');
    if (!guild) return;

    const loggingChannels = guild?.logging_channels;
    const trackChannels = guild?.track_channels;

    if (!loggingChannels?.message_delete
      || !trackChannels
      || !trackChannels.includes(message.channel.id)) return;

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
};
