import axios from 'axios';
import FormData from 'form-data';

import config from '../config.js';
import { BytesToMB } from '../shared.js';
import { createLogger } from './logger.service.js';
import { uploadToNextcloud } from './nextcloud.service.js';

const logger = createLogger(import.meta);

// Attachments bigger than this are linked to the discord cdn instead of being uploaded.
const MAX_ATTACHMENT_MB = 20;

/**
 * @param {string} msg
 * @returns {{ link: string }}
 */
function noUpload(msg) {
  return { link: msg };
}

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
 * Sometimes, the attachment is instantly deleted from the discord cdn,
 * before we can even download it. In that case, the file is not uploaded.
 * @param {import('discord.js').Attachment} attachment
 * @returns {Promise<{ link: string }>} the uploaded copy, or the discord cdn url when it could not be uploaded
 */
export async function uploadAttachment(attachment) {
  // Only enable if upload_attachments is true
  if (!config.upload_attachments) {
    return noUpload(attachment.url); // return attachment url
  }

  if (BytesToMB(attachment.size) > MAX_ATTACHMENT_MB) {
    logger.warn(`Attachment size too big: ${attachment.size}`);
    return noUpload(attachment.url);
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

    return link ? { link } : noUpload(attachment.url);
  } catch (err) {
    logger.error(`Error uploading attachment: ${err}`);
    return noUpload(attachment.url);
  }
}
