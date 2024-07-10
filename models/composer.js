const { Sequelize, DataTypes } = require('sequelize');
const { getDatabaseUri } = require('../config');
const sequelize = new Sequelize(getDatabaseUri(), {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false,
  },
});
const { Composition } = require('./composition'); 
const { User } = require('./user'); 

// Define the Composer model with custom table name options
const Composer = sequelize.define('Composer', {
    composer_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: { // Include user_id to establish the association between Composer and User
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'user_id'
        },
        onDelete: 'SET NULL'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    biography: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true
    },
    social_media_links: {
        type: DataTypes.JSONB,
        allowNull: true
    }
}, {
  tableName: 'composers',
  freezeTableName: true,
  timestamps: true, 
});


Composer.belongsTo(User, { foreignKey: 'user_id' }); // Composer belongs to User
User.hasOne(Composer, { foreignKey: 'user_id' }); 
Composer.hasMany(Composition, { foreignKey: 'composer_id' });
Composition.belongsTo(Composer, { foreignKey: 'composer_id' });

// Add a static method to find or create a composer by name
Composer.findByComposerName = async function(name) {
    let composer = await this.findOne({ where: { name } });
    if (!composer) {
        composer = await this.create({ name });
    }
    return composer;
};
Composer.findById = async function(composerId) {
    return await this.findByPk(composerId);
};

Composer.findByName = async function(name) {
    return await this.findOne({ where: { name } });
};

// Sync the model with the database
async function syncComposerModel() {
    try {
        await Composer.sync({ alter: true });
        console.log('Composer model synced successfully');
    } catch (error) {
        console.error('Error syncing Composer model:', error);
    }
}

module.exports = { Composer, syncComposerModel };
