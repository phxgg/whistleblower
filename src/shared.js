const trackChannels = {};
const loggingChannels = {};

const formatEmoji = (emoji) => {
  return !emoji.id || emoji.available
    ? emoji.toString() // bot has access to unicode emoji
    : `[:${emoji.name}:](${emoji.url})`; // bot cannot use the emoji
};

module.exports = {
  trackChannels,
  formatEmoji
};
