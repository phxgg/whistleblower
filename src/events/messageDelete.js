const { EmbedBuilder } = require('discord.js');
const { trackChannels } = require('../shared.js');

const { logging_channel_ids } = require('../../config.json');

module.exports = {
  name: 'messageDelete',
  once: false,
  async execute(message) {
    if (message.partial) return; // content is null or deleted embed
    if (message.author.bot) return // ignore bots

    if (trackChannels[message.guild.id].includes(message.channel.id)) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setTitle('Message Deleted')
        .setDescription((message.content) ? message.content : '`empty`')
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

      await message.client.channels.fetch(logging_channel_ids.message_deleted).then((channel) => {
        channel.send({ embeds: [embed] });
      });
    }
  }
};
