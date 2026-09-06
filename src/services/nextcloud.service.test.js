import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';

// A fake nextcloud instance, recording what the service sends to it.
const requests = [];

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    requests.push({
      method: req.method,
      url: req.url,
      auth: req.headers.authorization,
      body: Buffer.concat(chunks),
    });

    if (req.url.startsWith('/ocs/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ocs: { data: { url: 'https://cloud.example.com/s/token' } } }));
    }

    res.writeHead(201).end();
  });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

process.env.MONGODB_URI = 'mongodb://localhost';
process.env.TOKEN = 'token';
process.env.APPLICATION_ID = 'id';
process.env.LOG_TO_FILE = 'false';
process.env.UPLOAD_ATTACHMENTS = 'true';
process.env.UPLOAD_PROVIDER = 'nextcloud';
process.env.NEXTCLOUD_URL = `http://127.0.0.1:${server.address().port}/`;
process.env.NEXTCLOUD_USERNAME = 'bot';
process.env.NEXTCLOUD_APP_PASSWORD = 'app-password';
process.env.NEXTCLOUD_PATH = 'logs/attachments';

const { uploadToNextcloud } = await import('./nextcloud.service.js');

test('uploads the file, creates every missing folder and shares it publicly', async (t) => {
  t.after(() => server.close());

  const link = await uploadToNextcloud(Buffer.from('file contents'), 'my file.png');

  assert.equal(link, 'https://cloud.example.com/s/token');

  const [firstFolder, secondFolder, upload, share] = requests;

  // Every segment of NEXTCLOUD_PATH is created, a nested path needs one MKCOL per level.
  assert.equal(firstFolder.method, 'MKCOL');
  assert.equal(firstFolder.url, '/remote.php/dav/files/bot/logs');
  assert.equal(secondFolder.method, 'MKCOL');
  assert.equal(secondFolder.url, '/remote.php/dav/files/bot/logs/attachments');

  assert.equal(upload.method, 'PUT');
  assert.equal(upload.body.toString(), 'file contents');
  // The file name is prefixed to keep same named attachments apart, and url encoded.
  assert.match(upload.url, /^\/remote\.php\/dav\/files\/bot\/logs\/attachments\/\w{8}-my%20file\.png$/);
  assert.equal(upload.auth, `Basic ${Buffer.from('bot:app-password').toString('base64')}`);

  // The share api takes the path as is, without the url encoding.
  assert.equal(share.method, 'POST');
  const shared = new URLSearchParams(share.body.toString());
  assert.equal(shared.get('path'), decodeURIComponent(upload.url.replace('/remote.php/dav/files/bot', '')));
  assert.equal(shared.get('shareType'), '3');
});
