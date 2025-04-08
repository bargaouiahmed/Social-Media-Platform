module.exports = (sequelize, DataTypes) => {
    const Participant = sequelize.define('Participant', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'auth_user', // Django's auth_user table
          key: 'id',
        },
        allowNull: false,
      },
      conversationId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'conversation',
          key: 'id',
        },
        allowNull: false,
      },
    }, {
      tableName: 'participant',
      timestamps: false, // No timestamps for simplicity
    });

    Participant.associate = (models) => {
      Participant.belongsTo(models.Conversation, {
        foreignKey: 'conversationId',
        as: 'conversation',
      });

      // Add this association
      Participant.belongsTo(models.AuthUser, {
        foreignKey: 'userId',
        as: 'user',
      });
    };

    return Participant;
  };
