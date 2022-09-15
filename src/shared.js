const handleError = (err) => {
  console.error(err);
};

const formatEmoji = (emoji) => {
  return !emoji.id || emoji.available
    ? emoji.toString() // bot has access to unicode emoji
    : `[:${emoji.name}:](${emoji.url})`; // bot cannot use the emoji
};

module.exports = {
  handleError,
  formatEmoji
};
