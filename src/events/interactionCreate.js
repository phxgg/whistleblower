const {
  getTrackChannels,
  addToTrackChannels,
  removeFromTrackChannels
} = require('../shared.js');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    if (!interaction.isCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    const member = interaction.member;
  
    if (!member.permissions.has('ADMINISTRATOR'))
      return interaction.editReply({
        content: ':x: You are not an admin.',
        ephemeral: true
      });
  
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const trackChannels = await getTrackChannels(interaction.guild.id);

    if (interaction.commandName === 'track') {
      if (trackChannels.indexOf(channel.id) !== -1) {
        return interaction.editReply({
          content: `:x: Already tracking ${channel.name}`,
          ephemeral: true
        });
      }
      
      // add channel to guild's track_channels array
      // trackChannels[interaction.guild.id].push(channel.id);
      await addToTrackChannels(interaction.guild.id, channel.id);
  
      await interaction.editReply({
        content: `:white_check_mark: Tracking ${channel.name}`,
        ephemeral: true
      });
    } else if (interaction.commandName === 'untrack') {
      if (trackChannels.indexOf(channel.id) === -1) {
        return interaction.editReply({
          content: `:x: Not tracking ${channel.name}`,
          ephemeral: true
        });
      }
  
      // remove channel from guild's track_channels array
      // trackChannels[interaction.guild.id].splice(trackChannels[interaction.guild.id].indexOf(channel.id), 1);
      await removeFromTrackChannels(interaction.guild.id, channel.id);
  
      await interaction.editReply({
        content: `:white_check_mark: No longer tracking ${channel.name}`,
        ephemeral: true
      });
    }
  }
};
