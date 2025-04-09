module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      participantId: { // Changed to participantId
        type: DataTypes.INTEGER,
        references: {
          model: 'participant', // Reference the participant table
          key: 'id',
        },
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'message',
      timestamps: false,
    });

    Message.associate = (models) => {
      Message.belongsTo(models.Participant, {
        foreignKey: 'participantId',
        as: 'participant',
      });
      Message.hasMany(models.MessageAttachment, {
        foreignKey: 'messageId',
        as: 'attachments',
      });
    };


    return Message;
  };
