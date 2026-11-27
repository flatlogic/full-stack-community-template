'use strict';

const indexName = 'users_email_identity_unique';

module.exports = {
  async up(queryInterface, Sequelize) {
    const db = queryInterface.sequelize;
    const users = queryInterface.queryGenerator.quoteTable('users');
    const email = queryInterface.queryGenerator.quoteIdentifier('email');
    const normalized = `LOWER(LTRIM(RTRIM(${email})))`;
    await db.transaction(async (transaction) => {
      const [duplicates] = await db.query(
        `SELECT COUNT(*) AS total FROM ${users} WHERE ${email} IS NOT NULL GROUP BY ${normalized} HAVING COUNT(*) > 1`,
        { transaction, logging: false },
      );
      if (duplicates.length) {
        throw new Error('Resolve duplicate user email addresses before running the email uniqueness migration.');
      }
      await db.query(`UPDATE ${users} SET ${email} = ${normalized} WHERE ${email} IS NOT NULL`, { transaction });
      const options = { name: indexName, unique: true, transaction };
      if (db.getDialect() === 'mssql') {
        options.where = { email: { [Sequelize.Op.ne]: null } };
      }
      await queryInterface.addIndex('users', ['email'], options);
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', indexName);
  },
};
