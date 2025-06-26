'use strict';
const bcrypt = require("bcrypt");
const config = require("../../config");

const ids = [
    '193bf4b5-9f07-4bd5-9a43-e7e41f3e96af',
    'af5a87be-8f9c-4630-902a-37a60b7005ba',
    '5bc531ab-611f-41f3-9373-b7cc5d09c93d',
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let admin_hash = bcrypt.hashSync(config.admin_pass, config.bcrypt.saltRounds);
    let user_hash = bcrypt.hashSync(config.user_pass, config.bcrypt.saltRounds);

    try {
    await queryInterface.bulkInsert('users', [
      {
        id: ids[0],
        firstName: 'Admin',
        email: config.admin_email,
        emailVerified: true,
        provider: config.providers.LOCAL,
        password: admin_hash,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: ids[1],
        firstName: 'John',
        email: 'john@doe.com',
        emailVerified: true,
        provider: config.providers.LOCAL,
        password: user_hash,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: ids[2],
        firstName: 'Client',
        email: 'client@hello.com',
        emailVerified: true,
        provider: config.providers.LOCAL,
        password: user_hash,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
    } catch (error) {
      console.error('Error during bulkInsert:', error);
      throw error;
    }
  },
  down: async (queryInterface, Sequelize) => {
    try {
    await queryInterface.bulkDelete('users', {
      id: {
        [Sequelize.Op.in]: ids,
      },
    }, {});
  } catch (error) {
    console.error('Error during bulkDelete:', error);
    throw error;
  }
}
}
