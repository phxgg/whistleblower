const { ChannelType } = require('discord.js');
const {
  track_all_channels_by_default,
  exclude_channel_ids
} = require('../../config.json');
const { trackChannels } = require('../shared.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[whistleblower] Logged in as ${client.user.tag}`);

    client.user.setActivity('you', { type: 'WATCHING' });

    // push all text channels into trackChannels
    if (track_all_channels_by_default) {
      const guilds = client.guilds.cache.map(async guild => {
        trackChannels[guild.id] = [];
        // console.log(`[whistleblower] Joined guild ${guild.name}`)

        const channels = await guild.channels.fetch();

        channels.map(channel => {
          if ((channel.type === ChannelType.GuildText
            || channel.type === ChannelType.GuildVoice)
            && !exclude_channel_ids.includes(channel.id)) {
            // trackChannels.push(channel.id);
            trackChannels[guild.id].push(channel.id);

            // console.log(`[whistleblower] Tracking channel ${channel.name} (${channel.id})`);
          }
        });
      });
    }
  }
};
