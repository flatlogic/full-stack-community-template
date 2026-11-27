'use strict';

// Run against a disposable generated backend after applying its migrations and seeders.
const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { randomUUID } = require('node:crypto');
const net = require('node:net');

const backend = process.env.COMMUNITY_QA_BACKEND;
const integration = backend ? test : test.skip;
if (backend) {
  assert.match(process.env.DB_NAME || '', /^community_qa\b/);
  assert.match(process.env.DB_HOST || '', /^(?:\/|127\.0\.0\.1$)/);
}
const email = (name) => name + '@example.test';
const password = 'Synthetic-password-' + randomUUID();
const reserved = [
  'password',
  'authenticationUid',
  'provider',
  'emailVerificationToken',
  'emailVerificationTokenExpiresAt',
  'passwordResetToken',
  'passwordResetTokenExpiresAt',
];
let db, smtp, app, api, admin, publicOrigin;
let rejectMail = false;
const inbox = [];

function safe(value) {
  if (!value || typeof value !== 'object') return;
  for (const [field, nested] of Object.entries(value)) {
    assert.ok(!reserved.includes(field), 'private field in response: ' + field);
    safe(nested);
  }
}

function message(recipient, pathname, previous = 0) {
  const matches = inbox
    .slice(previous)
    .filter((item) => item.to.toLowerCase() === recipient);
  assert.equal(matches.length, 1, 'one message delivered to ' + recipient);
  const body = matches[0].data.replace(/=\r?\n/g, '').replace(/=3D/gi, '=');
  const urls = [...body.matchAll(/https?:\/\/[^\s<>"']+/g)].map(
    (match) => new URL(match[0].replace(/&amp;/g, '&')),
  );
  const link = urls.find((url) => url.pathname === pathname);
  assert.ok(link, 'link to ' + pathname);
  assert.equal(link.origin, publicOrigin);
  assert.equal(link.search, '');
  const params = new URLSearchParams(link.hash.slice(1));
  assert.ok(params.get('token'));
  return params;
}

function acceptMail(sock) {
  let rest = '',
    data = false,
    lines = [],
    to = '';
  sock.setEncoding('utf8');
  sock.write('220 localhost ESMTP\r\n');
  sock.on('data', (chunk) => {
    rest += chunk;
    let end;
    while ((end = rest.indexOf('\r\n')) >= 0) {
      const line = rest.slice(0, end);
      rest = rest.slice(end + 2);
      if (data && line !== '.') {
        lines.push(line);
        continue;
      }
      if (data) {
        data = false;
        if (!rejectMail) inbox.push({ to, data: lines.join('\r\n') });
        sock.write(rejectMail ? '550 unavailable\r\n' : '250 received\r\n');
      } else if (/^EHLO/i.test(line)) sock.write('250 localhost\r\n');
      else if (/^RCPT TO:/i.test(line)) {
        to = line.match(/<([^>]+)>/)[1];
        sock.write('250 recipient\r\n');
      } else if (line === 'DATA') {
        data = true;
        lines = [];
        sock.write('354 send message\r\n');
      } else if (line === 'QUIT') sock.end('221 bye\r\n');
      else sock.write('250 ok\r\n');
    }
  });
}

async function request(path, { method = 'GET', body, jwt } = {}) {
  const headers = {};
  if (jwt) headers.Authorization = 'Bearer ' + jwt;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const response = await fetch(api + path, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(10000),
  });
  const raw = await response.text();
  let value = raw;
  if ((response.headers.get('content-type') || '').includes('application/json'))
    value = JSON.parse(raw);
  return { status: response.status, value };
}

function ok(response) {
  assert.equal(response.status, 200);
  return response.value;
}

function denied(response) {
  assert.ok(
    [400, 401, 403, 409].includes(response.status),
    'explicit rejection, got ' + response.status,
  );
}

function login(email, password) {
  return request('/auth/signin/local', {
    method: 'POST',
    body: { email, password },
  });
}

before(async () => {
  if (!backend) return;
  const load = createRequire(resolve(backend, 'package.json'));
  db = new (load('pg').Client)({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
  });
  await db.connect();
  const { rows } = await db.query('SELECT count(*)::int AS count FROM users');
  assert.equal(rows[0].count, 3, 'a freshly seeded fixture is required');
  smtp = net.createServer(acceptMail);
  smtp.listen(0, '127.0.0.1');
  await once(smtp, 'listening');
  publicOrigin = 'https://community-qa.example.test';
  // Run the generated HTTP entry point on a private, dynamically allocated loopback port.
  const entry = `
    const http = require('node:http');
    const listen = http.Server.prototype.listen;
    http.Server.prototype.listen = function(port, callback) {
      return listen.call(this, 0, '127.0.0.1', () => {
        callback();
        process.send(this.address().port);
      });
    };
    require('./src/index');
  `;
  app = spawn(process.execPath, ['-e', entry], {
    cwd: backend,
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      SECRET_KEY: randomUUID(),
      FRONTEND_ORIGIN: publicOrigin,
      EMAIL_HOST: '127.0.0.1',
      EMAIL_PORT: String(smtp.address().port),
      EMAIL_FROM: 'qa@example.test',
      EMAIL_USER: '',
      EMAIL_PASS: '',
      EMAIL_REQUIRE_TLS: 'false',
    },
  });
  const port = await Promise.race([
    once(app, 'message').then(([n]) => n),
    once(app, 'exit').then(([code]) => {
      throw new Error('Generated app exited: ' + code);
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Startup timeout')), 15000).unref(),
    ),
  ]);
  api = 'http://127.0.0.1:' + port + '/api';
  const config = load('./src/config');
  admin = ok(await login(config.admin_email, config.admin_pass));
});

after(async () => {
  if (app && app.exitCode === null && app.signalCode === null) {
    const stopped = once(app, 'exit');
    app.kill();
    await stopped;
  }
  if (smtp) await new Promise((resolve) => smtp.close(resolve));
  if (db) await db.end();
});

integration(
  'registration verifies mailbox ownership and refuses duplicate accounts',
  async () => {
    const address = email('signup');
    const register = () =>
      request('/auth/signup', {
        method: 'POST',
        body: { email: address, password },
      });
    assert.equal(ok(await register()), true);
    denied(await login(address, password));
    denied(await register());
    const token = message(address, '/verify-email').get('token');
    ok(await request('/auth/verify-email', { method: 'PUT', body: { token } }));
    denied(
      await request('/auth/verify-email', { method: 'PUT', body: { token } }),
    );
    const jwt = ok(await login(address, password));
    const claims = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url'));
    safe(claims);
    assert.deepEqual(Object.keys(claims.user).sort(), ['email', 'id']);
    const me = ok(await request('/auth/me', { jwt }));
    assert.equal(me.email, address);
    safe(me);
    denied(
      await request('/users', {
        method: 'POST',
        jwt,
        body: { data: { email: email('blocked') } },
      }),
    );
  },
);

integration(
  'an invitation can be accepted once, including concurrent submissions',
  async () => {
    const address = email('invited');
    ok(
      await request('/users', {
        method: 'POST',
        jwt: admin,
        body: { data: { email: address, firstName: 'Invited' } },
      }),
    );
    const pending = await db.query('SELECT * FROM users WHERE email=$1', [
      address,
    ]);
    const original = pending.rows[0];
    denied(
      await request('/auth/signup', {
        method: 'POST',
        body: { email: address, password },
      }),
    );
    const unchanged = await db.query('SELECT * FROM users WHERE id=$1', [
      original.id,
    ]);
    assert.deepEqual(unchanged.rows[0], original);
    const params = message(address, '/password-reset');
    assert.equal(params.get('invitation'), '1');
    const token = params.get('token');
    assert.notEqual(original.passwordResetToken, token);
    const accept = () =>
      request('/auth/password-reset', {
        method: 'PUT',
        body: { token, password },
      });
    const outcomes = await Promise.all([accept(), accept()]);
    assert.equal(outcomes.filter((r) => r.status === 200).length, 1);
    denied(outcomes.find((r) => r.status !== 200));
    const jwt = ok(await login(address, password));
    const me = ok(await request('/auth/me', { jwt }));
    safe(me);
    const user = ok(await request('/users/' + me.id, { jwt: admin }));
    safe(user);
    const list = ok(await request('/users', { jwt: admin }));
    safe(list);
    assert.ok(list.rows.some((row) => row.id === me.id));
    const csv = ok(await request('/users?filetype=csv', { jwt: admin }));
    for (const field of reserved)
      assert.ok(!csv.split(/\r?\n/)[0].includes('"' + field + '"'));
    safe(
      ok(
        await request('/users/autocomplete?query=Invited&limit=10', {
          jwt: admin,
        }),
      ),
    );
    safe(
      ok(
        await request('/search', {
          jwt: admin,
          method: 'POST',
          body: { searchQuery: 'Invited' },
        }),
      ),
    );
  },
);

integration(
  'CSV invitations and password recovery use real mail and reject expired tokens',
  async () => {
    const address = email('imported');
    const form = new FormData();
    form.append(
      'file',
      new Blob(['email,firstName\n' + address + ',Imported\n']),
      'users.csv',
    );
    ok(
      await request('/users/bulk-import', {
        method: 'POST',
        jwt: admin,
        body: form,
      }),
    );
    const token = message(address, '/password-reset').get('token');
    await db.query(
      'UPDATE users SET "passwordResetTokenExpiresAt"=now()-interval \'1 day\' WHERE email=$1',
      [address],
    );
    denied(
      await request('/auth/password-reset', {
        method: 'PUT',
        body: { token, password },
      }),
    );
    const count = inbox.length;
    ok(
      await request('/auth/send-password-reset-email', {
        method: 'POST',
        body: { email: address },
      }),
    );
    const next = message(address, '/password-reset', count).get('token');
    assert.notEqual(token, next);
    ok(
      await request('/auth/password-reset', {
        method: 'PUT',
        body: { token: next, password },
      }),
    );
    ok(await login(address, password));
  },
);

integration(
  'email identity is unique across simultaneous registrations',
  async () => {
    const address = email('concurrent');
    const responses = await Promise.all(
      [address, address.toUpperCase()].map((candidate) =>
        request('/auth/signup', {
          method: 'POST',
          body: { email: candidate, password },
        }),
      ),
    );
    assert.equal(responses.filter((item) => item.status === 200).length, 1);
    denied(responses.find((item) => item.status !== 200));
    message(address, '/verify-email');
    const result = await db.query(
      'SELECT count(*)::int AS count FROM users WHERE email=$1',
      [address],
    );
    assert.equal(result.rows[0].count, 1);
  },
);

integration('signup can be retried after a mail delivery failure', async () => {
  const address = email('mail-retry');
  const register = () =>
    request('/auth/signup', {
      method: 'POST',
      body: { email: address, password },
    });
  rejectMail = true;
  try {
    assert.equal((await register()).status, 500);
  } finally {
    rejectMail = false;
  }
  const result = await db.query(
    'SELECT count(*)::int AS count FROM users WHERE email=$1',
    [address],
  );
  assert.equal(result.rows[0].count, 0);
  assert.equal(ok(await register()), true);
  message(address, '/verify-email');
});

integration(
  'profile editing and a signed-in password change keep the account usable',
  async () => {
    const address = email('signup');
    const jwt = ok(await login(address, password));
    ok(
      await request('/auth/profile', {
        method: 'PUT',
        jwt,
        body: { profile: { firstName: 'QA updated' } },
      }),
    );
    const me = ok(await request('/auth/me', { jwt }));
    assert.equal(me.firstName, 'QA updated');
    safe(me);
    const change = (currentPassword) =>
      request('/auth/password-update', {
        method: 'PUT',
        jwt,
        body: { currentPassword, newPassword: password + '2' },
      });
    denied(await change('Wrong current password'));
    ok(await change(password));
    denied(await login(address, password));
    ok(await login(address, password + '2'));
  },
);
