'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { test } = require('node:test');

const backend = process.env.COMMUNITY_QA_BACKEND;
test('generated user queries, association loads and JSON exclude credentials', { skip: !backend }, async () => {
  assert.match(process.env.DB_HOST || '', /^(?:\/|127\.0\.0\.1$)/);
  assert.match(process.env.DB_NAME || '', /^community_qa(?:_\w+)?$/);
  const db = require(resolve(backend, 'src/db/models'));
  const Users = require(resolve(backend, 'src/db/api/users'));
  const privateFields = ['password', 'authenticationUid', 'provider', 'passwordResetToken',
    'passwordResetTokenExpiresAt', 'emailVerificationToken', 'emailVerificationTokenExpiresAt'];
  const clean = record => {
    for (const field of privateFields) assert.ok(!Object.hasOwn(record, field), field);
  };
  const transaction = await db.sequelize.transaction();
  try {
    const email = randomUUID() + '@example.test';
    const bcrypt = createRequire(resolve(backend, 'package.json'))('bcrypt');
    const password = await bcrypt.hash(randomUUID(), 4);
    const reset = randomUUID();
    const account = await db.users.create({
      email, password, firstName: 'Fixture', provider: 'local', emailVerified: true,
      passwordResetToken: reset, passwordResetTokenExpiresAt: new Date(Date.now() + 60000),
      emailVerificationToken: randomUUID(), emailVerificationTokenExpiresAt: new Date(Date.now() + 60000),
    }, { transaction });
    clean(JSON.parse(JSON.stringify(account)));
    const child = await db.users.create({
      email: randomUUID() + '@example.test', firstName: 'Child',
      createdById: account.id, updatedById: account.id,
    }, { transaction });
    const linked = await db.users.findByPk(child.id, {
      transaction, include: [{ association: 'createdBy' }, { association: 'updatedBy' }],
    });
    const record = linked.get({ plain: true });
    clean(record);
    for (const user of [record.createdBy, record.updatedBy]) {
      assert.equal(user.id, account.id);
      clean(user);
    }
    clean(await Users.findBy({ id: account.id }, { transaction }));
    const auth = await Users.findForAuthentication({ id: account.id }, { transaction });
    assert.equal(auth.password, password);
    assert.equal(auth.passwordResetToken, undefined);
    clean(JSON.parse(JSON.stringify(auth)));
  } finally {
    await transaction.rollback();
    await db.sequelize.close();
  }
});
