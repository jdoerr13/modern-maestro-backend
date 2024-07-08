const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://localhost/modernmaestros');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false, // Or false, depending on whether you require names for all users
    field: 'firstname'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'lastname'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  user_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'normal' // Add a default value for user_type
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    field: 'isadmin',
    allowNull: false,
    defaultValue: false // Adds the isAdmin field with a default value of false
  }
}, {
  tableName: 'users', // Make sure this matches the case exactly as in your database
  freezeTableName: true, // This prevents Sequelize from attempting to modify the table name
  timestamps: false 
});

// Sync the model with the database
async function syncUserModel() {
  try {
    await User.sync();
    console.log('User model synced successfully');
  } catch (error) {
    console.error('Error syncing User model:', error);
  }
}

// Export the User model
module.exports = { User, syncUserModel };
