import axios from 'axios';
import FormData from 'form-data';

import config from '../../config.json' with { type: 'json' };
import { BytesToMB } from '../shared.js';
import { createLogger } from './logger.service.js';

const logger = createLogger(import.meta);

/**
 * @param {string} msg
 * @returns {Object} { link: '...' }
 */
const noUpload = (msg) => {
  return { link: msg };
};

/**
 * Wrap a function to retry n times on failure
 * @param {number} retries Number of retries
 * @param {Function} fn Function to retry
 * @returns
 */
const retryFn = async (retries, fn) => {
  return fn().catch((err) => {
    if (retries <= 0) {
      throw err;
    }
    return retryFn(retries - 1, fn);
  });
};

/**
 * Upload attachment to file sharing api.
 * Sometimes, the attachment is instantly deleted from the discord cdn,
 * before we can even download it. In that case, the file is not uploaded.
 * @param {import('discord.js').Attachment} attachment
 * @returns {{ success: boolean, key: string, link: string }}
 */
const uploadAttachment = async (attachment) => {
  // Only enable if upload_attachments is true
  if (!config.upload_attachments) {
    return noUpload(attachment.url); // return attachment url
  }

  // Check attachment size
  // if attachment size too big, return attachment url
  // max file size 20MB
  if (BytesToMB(attachment.size) > 20) {
    logger.warn(`Attachment size too big: ${attachment.size}`);
    return noUpload(attachment.url);
  }

  const fileName = attachment.url.substring(
    attachment.url.lastIndexOf('/') + 1
  );

  try {
    // Get the attachment data
    const res = await axios({
      method: 'GET',
      url: attachment.url,
      responseType: 'stream',
    });

    const stream = res.data;

    // docs: https://safenote.co/file-sharing-api
    const formData = new FormData();
    formData.append('file', stream, fileName);
    formData.append('lifetime', 72); // 72 hours = 3 days
    formData.append('read_count', 1000000);

    // axios post to upload file to api
    const upload = await retryFn(3, () =>
      axios({
        method: 'POST',
        url: 'https://safenote.co/api/file',
        responseType: 'json',
        data: formData,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    );

    if (!upload.data?.success) {
      logger.warn(`Attachment upload was not successful.`);
      // error uploading attachment
      return noUpload(attachment.url);
    }

    return upload.data;
  } catch (err) {
    logger.error(`Error uploading attachment`, err);
    return noUpload(attachment.url);
  }
};

export { uploadAttachment };
