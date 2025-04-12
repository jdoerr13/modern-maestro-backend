const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
});

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
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_name'
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
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: { type: 'normal' } // can also be 'normal' string if your app expects it
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    field: 'is_admin',
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'users',
  freezeTableName: true,
  timestamps: false
});

async function syncUserModel() {
  try {
    await User.sync();
    console.log('User model synced successfully');
  } catch (error) {
    console.error('Error syncing User model:', error);
  }
}

module.exports = { User, syncUserModel };
