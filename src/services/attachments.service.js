const { handleError } = require('../shared');
const axios = require('axios');
const FormData = require('form-data');

const uploadAttachment = async (attachment) => {
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
    data: formData
  });

  if (!upload.data?.success)
    return { link: 'error' };

  return upload.data;
};

module.exports = {
  uploadAttachment
};
