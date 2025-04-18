const { SlashCommandBuilder } = require('discord.js');

// TODO: option to track all channels in a guild

const data = new SlashCommandBuilder()
  .setName('track')
  .setDescription('Track a channel')
  .setContexts([InteractionContextType.Guild])
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Channel to keep track of')
  );

module.exports = {
  data
};
