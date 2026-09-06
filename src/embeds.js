import { EmbedBuilder } from 'discord.js';

import { uploadAttachment } from './services/attachments.service.js';

/**
 * Adds one field per attachment, linking to the uploaded copy
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {import('discord.js').Collection<string, import('discord.js').Attachment>} attachments
 * @returns {Promise<void>}
 */
async function addAttachmentFields(embed, attachments) {
  for (const attachment of attachments.values()) {
    const link = await uploadAttachment(attachment);
    embed.addFields({
      name: attachment.name,
      value: link || 'None',
      inline: true,
    });
  }
}

/**
 * @param {import('discord.js').Message} message
 * @returns {Promise<import('discord.js').EmbedBuilder>}
 */
export async function deletedMessageEmbed(message) {
  const embed = new EmbedBuilder()
    .setColor('#ff4040')
    .setAuthor({
      name: message.author.tag,
      iconURL: message.author.displayAvatarURL(),
    })
    .setTitle('Message Deleted')
    .setDescription(message.content ? message.content : 'None')
    .setFooter({
      text: `#${message.channel.name}`,
    })
    .setTimestamp(message.createdAt);

  await addAttachmentFields(embed, message.attachments);

  return embed;
}

/**
 * @param {import('discord.js').Message} oldMessage
 * @param {import('discord.js').Message} newMessage
 * @returns {Promise<import('discord.js').EmbedBuilder>}
 */
export async function editedMessageEmbed(oldMessage, newMessage) {
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

  if (newMessage.attachments.size !== oldMessage.attachments.size) {
    await addAttachmentFields(embed, oldMessage.attachments);
  }

  return embed;
}
