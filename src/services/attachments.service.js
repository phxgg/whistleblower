import { setTimeout as sleep } from 'node:timers/promises';

import axios from 'axios';
import FormData from 'form-data';

import config from '../config.js';
import { BytesToMB, SHARE_LIFETIME_DAYS } from '../shared.js';
import { createLogger } from './logger.service.js';
import { uploadToNextcloud } from './nextcloud.service.js';

const logger = createLogger(import.meta);

// Attachments bigger than this are not uploaded.
const MAX_ATTACHMENT_MB = 20;

// Wait this long before retrying a failed upload, so a provider hiccup has time to pass.
const RETRY_DELAY_MS = 2000;

/**
 * Wrap a function to retry n times on failure, waiting RETRY_DELAY_MS between attempts
 * @param {number} retries Number of retries
 * @param {Function} fn Function to retry
 * @returns {Promise<any>}
 */
export async function retryFn(retries, fn) {
  return fn().catch(async (err) => {
    if (retries <= 0) {
      throw err;
    }
    await sleep(RETRY_DELAY_MS);
    return retryFn(retries - 1, fn);
  });
}

/**
 * Uploads a file to safenote, which deletes it again once the lifetime is over
 * @param {Buffer} data content of the file
 * @param {string} fileName
 * @returns {Promise<string | null>} the share url, or null if the upload failed
 */
async function uploadToSafenote(data, fileName) {
  // docs: https://safenote.co/file-sharing-api
  const formData = new FormData();
  formData.append('file', data, fileName);
  formData.append('lifetime', SHARE_LIFETIME_DAYS * 24); // in hours
  formData.append('read_count', 1000000);

  const upload = await axios({
    method: 'POST',
    url: 'https://safenote.co/api/file',
    responseType: 'json',
    data: formData,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  if (!upload.data?.success) {
    logger.warn('Attachment upload was not successful.');
    return null;
  }

  return upload.data.link;
}

/**
 * Upload attachment to the configured file sharing provider.
 * Sometimes, the attachment is instantly deleted from the discord cdn,
 * before we can even download it. In that case, the file is not uploaded.
 * @param {import('discord.js').Attachment} attachment
 * @returns {Promise<string>} link to the uploaded copy, or the discord cdn url if there is none
 */
export async function uploadAttachment(attachment) {
  // Only enable if upload_attachments is true
  if (!config.upload_attachments) {
    return attachment.url;
  }

  if (BytesToMB(attachment.size) > MAX_ATTACHMENT_MB) {
    logger.warn(`Attachment size too big: ${attachment.size}`);
    return attachment.url;
  }

  // The cdn url carries the signature as a query string, so it is not a usable file name.
  const fileName = attachment.name || 'attachment';

  try {
    // Get the attachment data.
    // ponytail: the file is buffered in memory, which the size check above caps at 20MB.
    // It has to be, retrying an upload cannot replay a consumed stream.
    const res = await axios({
      method: 'GET',
      url: attachment.url,
      responseType: 'arraybuffer',
    });

    const data = Buffer.from(res.data);

    const link = await retryFn(3, () =>
      config.upload_provider === 'nextcloud' ? uploadToNextcloud(data, fileName) : uploadToSafenote(data, fileName)
    );

    return link || attachment.url;
  } catch (err) {
    logger.error(`Error uploading attachment: ${err}`);
    return attachment.url;
  }
}
