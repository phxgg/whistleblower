import { Events } from 'discord.js';

import { deletedMessageEmbed } from '../embeds.js';
import { resolveLoggingChannel, sendToLoggingChannel } from '../services/guild.service.js';

export default {
  name: Events.MessageBulkDelete,
  once: false,
  /**
   * @param {import('discord.js').Collection<string, import('discord.js').Message>} messages
   * @param {import('discord.js').Channel} channel
   */
  async execute(messages, channel) {
    const loggingChannelId = await resolveLoggingChannel(channel.guild.id, 'message_delete', channel.id);
    if (!loggingChannelId) return;

    for (const message of messages.values()) {
      if (message.partial) continue; // content is null or deleted embed
      if (message.author.bot) continue; // ignore bots

      const embed = await deletedMessageEmbed(message);

      await sendToLoggingChannel(message.client, channel.guild.id, loggingChannelId, embed);
    }
  },
};
