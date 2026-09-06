import axios from 'axios';
import FormData from 'form-data';

import config from '../config.js';
import { BytesToMB } from '../shared.js';
import { createLogger } from './logger.service.js';
import { uploadToNextcloud } from './nextcloud.service.js';

const logger = createLogger(import.meta);

// Attachments bigger than this are not uploaded.
const MAX_ATTACHMENT_MB = 20;

/**
 * Wrap a function to retry n times on failure
 * @param {number} retries Number of retries
 * @param {Function} fn Function to retry
 * @returns {Promise<any>}
 */
async function retryFn(retries, fn) {
  return fn().catch((err) => {
    if (retries <= 0) {
      throw err;
    }
    return retryFn(retries - 1, fn);
  });
}

/**
 * Uploads a file to safenote, which deletes it again after 3 days
 * @param {Buffer} data content of the file
 * @param {string} fileName
 * @returns {Promise<string | null>} the share url, or null if the upload failed
 */
async function uploadToSafenote(data, fileName) {
  // docs: https://safenote.co/file-sharing-api
  const formData = new FormData();
  formData.append('file', data, fileName);
  formData.append('lifetime', 72); // 72 hours = 3 days
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
 * The discord cdn url is never handed back, an attachment of a deleted message is gone from
 * the cdn as well, so a link to it would be dead by the time anyone reads the log.
 * Sometimes the attachment is deleted before we can even download it, and is not uploaded.
 * @param {import('discord.js').Attachment} attachment
 * @returns {Promise<string | null>} link to the uploaded copy, or null if there is none
 */
export async function uploadAttachment(attachment) {
  // Only enable if upload_attachments is true
  if (!config.upload_attachments) {
    return null;
  }

  if (BytesToMB(attachment.size) > MAX_ATTACHMENT_MB) {
    logger.warn(`Attachment size too big: ${attachment.size}`);
    return null;
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

    return await retryFn(3, () =>
      config.upload_provider === 'nextcloud' ? uploadToNextcloud(data, fileName) : uploadToSafenote(data, fileName)
    );
  } catch (err) {
    logger.error(`Error uploading attachment: ${err}`);
    return null;
  }
}
