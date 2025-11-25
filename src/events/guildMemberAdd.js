import { Events } from 'discord.js';
import config from '../../config.json' with { type: 'json' };

export default {
  name: Events.GuildMemberAdd,
  once: false,
  /**
   * @param {import('discord.js').GuildMember} member
   */
  async execute(member) {
    const bannedUserIds = config.banned_user_ids || [];
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