import axios from 'axios';

import config from '../config.js';
import { generateRandomString, SHARE_LIFETIME_DAYS } from '../shared.js';
import { createLogger } from './logger.service.js';

const logger = createLogger(import.meta);

/**
 * @returns {{ username: string, password: string }} basic auth credentials, the app password of the user
 */
const auth = () => ({ username: config.nextcloud.username, password: config.nextcloud.app_password });

/**
 * @param {string} filePath path of a file, relative to the files root of the user
 * @returns {string} WebDAV url of the file
 */
const davUrl = (filePath) =>
  `${config.nextcloud.url}/remote.php/dav/files/${encodeURIComponent(config.nextcloud.username)}${filePath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;

// The upload folder only has to be created once per process.
let folderCreated = false;

/**
 * Creates the upload folder, and every parent of it, if it does not exist yet
 * @returns {Promise<void>}
 */
async function createFolder() {
  if (folderCreated) return;

  let folderPath = '';
  for (const segment of config.nextcloud.path.split('/').filter(Boolean)) {
    folderPath += `/${segment}`;

    try {
      await axios({ method: 'MKCOL', url: davUrl(folderPath), auth: auth() });
    } catch (err) {
      // 405 means the folder is already there, anything else is a real failure
      if (err.response?.status !== 405) throw err;
    }
  }

  folderCreated = true;
}

/**
 * Creates a public read only share for a file, expiring after SHARE_LIFETIME_DAYS
 * @param {string} filePath path of the file, relative to the files root of the user
 * @returns {Promise<string | null>} the share url, or null if sharing is not allowed
 */
async function createShareLink(filePath) {
  // Nextcloud expects a plain date, the share then dies at the end of that day.
  const expireDate = new Date(Date.now() + SHARE_LIFETIME_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // docs: https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-share-api.html
  const res = await axios({
    method: 'POST',
    url: `${config.nextcloud.url}/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json`,
    auth: auth(),
    headers: { 'OCS-APIRequest': 'true' },
    data: new URLSearchParams({
      path: filePath,
      shareType: '3', // public link
      permissions: '1', // read only
      expireDate,
    }),
  });

  const url = res.data?.ocs?.data?.url;
  if (!url) {
    logger.warn('Nextcloud did not return a share url, is public link sharing enabled?');
    return null;
  }

  return url;
}

/**
 * Uploads a file to the configured nextcloud instance and shares it publicly
 * @param {Buffer} data content of the file
 * @param {string} fileName
 * @returns {Promise<string | null>} the share url, or null if the file could not be shared
 */
export async function uploadToNextcloud(data, fileName) {
  await createFolder();

  // Attachments of different messages can have the same name, so keep the uploads apart.
  const filePath = `/${config.nextcloud.path}/${generateRandomString(8)}-${fileName}`;

  await axios({
    method: 'PUT',
    url: davUrl(filePath),
    auth: auth(),
    data,
    headers: { 'Content-Type': 'application/octet-stream' },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return createShareLink(filePath);
}
