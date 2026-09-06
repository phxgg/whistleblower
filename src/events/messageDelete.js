import { Events } from 'discord.js';

import { deletedMessageEmbed } from '../embeds.js';
import { resolveLoggingChannel, sendToLoggingChannel } from '../services/guild.service.js';

export default {
  name: Events.MessageDelete,
  once: false,
  /**
   * @param {import('discord.js').Message} message
   */
  async execute(message) {
    if (message.partial) return; // content is null or deleted embed
    if (message.author.bot) return; // ignore bots

    const loggingChannelId = await resolveLoggingChannel(message.guild.id, 'message_delete', message.channel.id);
    if (!loggingChannelId) return;

    const embed = await deletedMessageEmbed(message);

    await sendToLoggingChannel(message.client, message.guild.id, loggingChannelId, embed);
  },
};
