'use strict';

/** @type {import('sequelize-cli').Migration} */
// migrations/XXXXXXXXXXXX-create-participant.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('participant', { // <-- Changed to "participant"
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'auth_user', // Django's user table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      conversationId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'conversation',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('participant'); // <-- Changed to "participant"
  },
};
