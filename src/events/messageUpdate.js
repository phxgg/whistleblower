import { EmbedBuilder, Events } from 'discord.js';

import { uploadAttachment } from '../services/attachments.service.js';
import { getGuild } from '../services/guild.service.js';

export default {
  name: Events.MessageUpdate,
  once: false,
  /**
   * @param {import('discord.js').Message} oldMessage
   * @param {import('discord.js').Message} newMessage
   */
  async execute(oldMessage, newMessage) {
    if (oldMessage.partial || newMessage.partial) return; // content is null
    if (oldMessage.author.bot) return; // ignore bots

    // content is the same
    if (
      oldMessage.content === newMessage.content &&
      oldMessage.attachments.size === newMessage.attachments.size
      // && oldMessage.attachments.every((attachment, index) => {
      //   // return attachment.url === newMessage.attachments[index].url;
      //   return newMessage.attachments.has(attachment.id);
      // })
    )
      return;

    const guild = await getGuild(
      oldMessage.guild.id,
      'logging_channels track_channels'
    );
    if (!guild) return;

    const loggingChannels = guild?.logging_channels;
    const trackChannels = guild?.track_channels;

    if (
      !loggingChannels?.message_update ||
      !trackChannels ||
      !trackChannels.includes(newMessage.channel.id)
    )
      return;

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setAuthor({
        name: newMessage.author.tag,
        iconURL: newMessage.author.displayAvatarURL(),
      })
      .setTitle('Message Edited')
      .setDescription(`[see message](${newMessage.url})`)
      .addFields({
        name: 'Original',
        value: oldMessage.content ? oldMessage.content : 'None',
      })
      .setFooter({
        text: `#${newMessage.channel.name}`,
      })
      .setTimestamp(newMessage.createdAt);

    if (oldMessage.content !== newMessage.content) {
      embed.addFields({
        name: 'Edited',
        value: newMessage.content ? newMessage.content : 'None',
      });
    }

    if (
      oldMessage.attachments.size > 0 &&
      newMessage.attachments.size !== oldMessage.attachments.size
    ) {
      // embed.addFields({ name: 'Previous attachments', value: '.' });

      for (const attachment of oldMessage.attachments.values()) {
        const upload = await uploadAttachment(attachment);
        const attachmentLink = upload.link || 'None';
        embed.addFields({
          name: attachment.name,
          value: attachmentLink,
          inline: true,
        });
      }
    }

    await newMessage.client.channels
      .fetch(loggingChannels.message_update)
      .then((channel) => {
        channel.send({ embeds: [embed] });
      });
  },
};
