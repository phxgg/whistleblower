const { EmbedBuilder } = require('discord.js');
const { trackChannels } = require('../shared.js');

const { logging_channel_ids } = require('../../config.json');

module.exports = {
  name: 'messageUpdate',
  once: false,
  async execute(oldMessage, newMessage) {
    if (oldMessage.partial || newMessage.partial) return; // content is null
    if (oldMessage.content === newMessage.content
        && oldMessage.attachments === newMessage.attachments) return; // content is the same

    if (trackChannels[newMessage.guild.id].includes(newMessage.channel.id)) {

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

      if (oldMessage.attachments.size > 0) {
        const oldAttachmentFields = [];
        for (const attachment of oldMessage.attachments.values()) {
          oldAttachmentFields.push({ name: attachment.name, value: attachment.url, inline: true });
        }

        embed.addFields(oldAttachmentFields);
      }

      if (newMessage.attachments.size > 0) {
        if (oldMessage.attachments.size > 0) {
          embed.addFields({ name: '\u200B', value: '\u200B' });
        }

        const newAttachmentFields = [];
        for (const attachment of newMessage.attachments.values()) {
          newAttachmentFields.push({ name: attachment.name, value: attachment.url, inline: true });
        }

        embed.addFields(newAttachmentFields);
      }

      await newMessage.client.channels.fetch(logging_channel_ids.message_edited).then((channel) => {
        channel.send({ embeds: [embed] });
      });
    }
  }
};
