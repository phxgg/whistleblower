const { EmbedBuilder } = require('discord.js');
const { getTrackChannels, getLoggingChannels } = require('../shared.js');

module.exports = {
  name: 'messageUpdate',
  once: false,
  async execute(oldMessage, newMessage) {
    if (oldMessage.partial || newMessage.partial) return; // content is null
    if (oldMessage.author.bot) return; // ignore bots

    // content is the same
    if (
      oldMessage.content === newMessage.content
      && oldMessage.attachments.size === newMessage.attachments.size
      // && oldMessage.attachments.every((attachment, index) => {
      //   // return attachment.url === newMessage.attachments[index].url;
      //   return newMessage.attachments.has(attachment.id);
      // })
    ) return;

    const loggingChannels = await getLoggingChannels(oldMessage.guild.id);
    if (!loggingChannels.message_update) return;

    const trackChannels = await getTrackChannels(oldMessage.guild.id);

    if (trackChannels.includes(newMessage.channel.id)) {
      const embed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.displayAvatarURL() })
        .setTitle('Message Edited')
        .setDescription(`[see message](${newMessage.url})`)
        .addFields({ name: 'Original', value: (oldMessage.content) ? oldMessage.content : 'None' })
        .setFooter({
          text: `#${newMessage.channel.name}`
        })
        .setTimestamp(newMessage.createdAt);

      if (oldMessage.content !== newMessage.content) {
        embed.addFields({ name: 'Edited', value: (newMessage.content) ? newMessage.content : 'None' });
      }

      if (oldMessage.attachments.size > 0 && newMessage.attachments.size !== oldMessage.attachments.size) {
        // embed.addFields({ name: 'Previous attachments', value: '.' });

        for (const attachment of oldMessage.attachments.values()) {
          embed.addFields({ name: attachment.name, value: attachment.url, inline: true });
        }
      }

      await newMessage.client.channels.fetch(loggingChannels.message_update).then((channel) => {
        channel.send({ embeds: [embed] });
      });
    }
  }
};
