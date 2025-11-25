/**
 * @param {*} err
 */
const handleError = (err) => {
  console.error(err);
};

/**
 * @param {number} length
 * @returns {string} random string of given length
 */
const generateRandomString = (length) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * @param {import('discord.js').GuildEmoji} emoji
 * @returns {string} formatted emoji
 */
const formatEmoji = (emoji) => {
  return !emoji.id || emoji.available
    ? emoji.toString() // bot has access to unicode emoji
    : `[:${emoji.name}:](${emoji.url})`; // bot cannot use the emoji
};

/**
 * @param {number} bytes
 * @returns {number} bytes to megabytes
 */
const BytesToMB = (bytes) => {
  return bytes / 1024 / 1024;
};

export {
  handleError,
  generateRandomString,
  formatEmoji,
  BytesToMB,
};
