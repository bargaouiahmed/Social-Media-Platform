module.exports = (sequelize, DataTypes) => {
    const MessageAttachment = sequelize.define('MessageAttachment', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      messageId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'message',
          key: 'id',
        },
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      filePath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'message_attachment',
      timestamps: false,
    });

    MessageAttachment.associate = (models) => {
      MessageAttachment.belongsTo(models.Message, {
        foreignKey: 'messageId',
        as: 'message',
      });
    };

    return MessageAttachment;
  };
