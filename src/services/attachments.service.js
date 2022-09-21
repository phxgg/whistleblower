const { handleError, BytesToMB } = require('../shared');
const axios = require('axios');
const FormData = require('form-data');

const { upload_attachments } = require('../../config.json');

const noUpload = (msg) => {
  return { link: msg };
};

const uploadAttachment = async (attachment) => {
  // Only enable if upload_attachments is true
  if (!upload_attachments) return noUpload(attachment.url); // return attachment url

  // Check attachment size
  if (BytesToMB(attachment.size) > 20) return noUpload('Attachment size too big'); // max file size 20MB

  const fileName = attachment.url.substring(attachment.url.lastIndexOf('/') + 1);

  const res = await axios({
    method: 'GET',
    url: attachment.url,
    responseType: 'stream'
  });

  const stream = res.data;

  // docs: https://safenote.co/file-sharing-api
  const formData = new FormData();
  formData.append('file', stream, fileName);
  formData.append('lifetime', 72); // 72 hours = 3 days
  formData.append('read_count', 1000000);

  // axios post to upload file to api
  const upload = await axios({
    method: 'POST',
    url: 'https://safenote.co/api/file',
    responseType: 'json',
    data: formData,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  if (!upload.data?.success)
    return noUpload('Error uploading attachment');

  return upload.data;
};

module.exports = {
  uploadAttachment
};
