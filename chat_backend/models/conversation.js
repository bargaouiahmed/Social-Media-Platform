module.exports = (sequelize, DataTypes) => {
    const Conversation = sequelize.define('Conversation', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      isGroupChat: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'conversation', // Explicitly set table name
      timestamps: false, // Disable Sequelize's default timestamps (use `createdAt` manually)
    });

    Conversation.associate = (models) => {
      Conversation.hasMany(models.Participant, {
        foreignKey: 'conversationId',
        as: 'participants',
      });
    //   Conversation.hasMany(models.Message, {
    //     foreignKey: 'conversationId',
    //     as: 'messages',
    //   });
    // };
    }
    return Conversation;
  };
