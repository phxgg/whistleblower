const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('track')
  .setDescription('Track a channel')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Channel to keep track of')
  );

module.exports = {
  data
};