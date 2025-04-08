// models/authUser.js
module.exports = (sequelize, DataTypes) => {
    const AuthUser = sequelize.define('AuthUser', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      password: DataTypes.STRING,
      last_login: DataTypes.DATE,
      is_superuser: DataTypes.BOOLEAN,
      username: DataTypes.STRING,
      first_name: DataTypes.STRING,
      last_name: DataTypes.STRING,
      email: DataTypes.STRING,
      is_staff: DataTypes.BOOLEAN,
      is_active: DataTypes.BOOLEAN,
      date_joined: DataTypes.DATE,
    }, {
      tableName: 'auth_user',
      timestamps: false,
      freezeTableName: true // Prevent Sequelize from pluralizing table name
    });

    return AuthUser;
  };
