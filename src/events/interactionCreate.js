const { trackChannels } = require('../shared.js');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    if (!interaction.isCommand()) return;

    const member = interaction.member;
  
    if (!member.permissions.has('ADMINISTRATOR'))
      return interaction.reply({
        content: ':x: You are not an admin.',
        ephemeral: true
      });
  
    const channel = interaction.options.getChannel('channel') || interaction.channel;
  
    if (interaction.commandName === 'track') {
      if (trackChannels[interaction.guild.id].indexOf(channel.id) !== -1) {
        return interaction.reply({
          content: `:x: Already tracking ${channel.name}`,
          ephemeral: true
        });
      }
      
      trackChannels[interaction.guild.id].push(channel.id);
  
      await interaction.reply({
        content: `:white_check_mark: Tracking ${channel.name}`,
        ephemeral: true
      });
    } else if (interaction.commandName === 'untrack') {
      if (trackChannels[interaction.guild.id].indexOf(channel.id) === -1) {
        return interaction.reply({
          content: `:x: Not tracking ${channel.name}`,
          ephemeral: true
        });
      }
  
      trackChannels[interaction.guild.id].splice(trackChannels[interaction.guild.id].indexOf(channel.id), 1);
  
      await interaction.reply({
        content: `:white_check_mark: No longer tracking ${channel.name}`,
        ephemeral: true
      });
    }
  }
};
