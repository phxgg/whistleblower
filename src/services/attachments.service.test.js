import assert from 'node:assert/strict';
import test from 'node:test';

process.env.MONGODB_URI = 'mongodb://localhost';
process.env.TOKEN = 'token';
process.env.APPLICATION_ID = 'id';
process.env.LOG_TO_FILE = 'false';

const { retryFn } = await import('./attachments.service.js');

test('retries the given number of times, waiting in between', async () => {
  let attempts = 0;
  const started = Date.now();

  await assert.rejects(
    () =>
      retryFn(1, async () => {
        attempts++;
        throw new Error('provider is down');
      }),
    /provider is down/
  );

  assert.equal(attempts, 2); // the first call plus one retry
  assert.ok(Date.now() - started >= 1900, 'retried without waiting');
});

test('does not wait when the call succeeds', async () => {
  const started = Date.now();

  assert.equal(await retryFn(3, async () => 'link'), 'link');
  assert.ok(Date.now() - started < 500);
});
