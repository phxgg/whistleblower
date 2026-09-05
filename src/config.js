// Configuration, read from environment variables.
// For local development, run with `node --env-file=.env src/index.js`.

const bool = (value, fallback) => (value === undefined ? fallback : value === 'true' || value === '1');

// Accepts comma-separated and/or multi-line values.
const list = (value) =>
  (value ?? '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export default {
  mongodb_uri: required('MONGODB_URI'),
  token: required('TOKEN'),
  application_id: required('APPLICATION_ID'),

  redis: {
    enable: bool(process.env.REDIS_ENABLE, false),
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || '',
  },

  track_all_channels_by_default: bool(process.env.TRACK_ALL_CHANNELS_BY_DEFAULT, true),
  upload_attachments: bool(process.env.UPLOAD_ATTACHMENTS, false),

  exclude_channel_ids: list(process.env.EXCLUDE_CHANNEL_IDS),

  banned_user_ids: list(process.env.BANNED_USER_IDS),
};
