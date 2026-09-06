import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createLogger } from './services/logger.service.js';

const logger = createLogger(import.meta);

/**
 * @param {*} err
 */
const handleError = (err) => {
  logger.error(err);
};

// How long an uploaded attachment stays reachable, for every upload provider.
const SHARE_LIFETIME_DAYS = 3;

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

/**
 * Extracts ids out of user supplied text. Accepts commas, spaces, newlines and channel mentions.
 * @param {string | null} value
 * @returns {Array<string>} ids
 */
const parseIds = (value) => (value ?? '').match(/\d+/g) ?? [];

/**
 * Imports every javascript module of a directory
 * @param {string} dirPath absolute path of the directory
 * @returns {Promise<Array<Object>>} the imported modules
 */
const loadModules = async (dirPath) => {
  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.js'));
  return Promise.all(files.map((file) => import(pathToFileURL(path.join(dirPath, file)).href)));
};

export { handleError, generateRandomString, formatEmoji, BytesToMB, parseIds, loadModules, SHARE_LIFETIME_DAYS };
