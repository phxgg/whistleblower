const { Events } = require("discord.js");

const {
  banned_user_ids
} = require('../../config.json');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  /**
   * @param {import('discord.js').GuildMember} member
   */
  async execute(member) {
    const bannedUserIds = banned_user_ids || [];
    if (bannedUserIds.includes(member.id)) {
      return member.ban({
        reason: "Banned user tried to join the server",
      })
        .then(() => {
          console.log(`Banned ${member.user.username} for being a banned user.`);
        })
        .catch((err) => {
          console.error(`Failed to ban ${member.user.username}:`, err);
        });
    }
  }
}