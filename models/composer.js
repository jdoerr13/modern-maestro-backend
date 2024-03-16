// Import Sequelize library
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://localhost/modernmaestros');
const { Composition } = require('./composition'); 

// Define the Composer model with custom table name options
const Composer = sequelize.define('Composer', {
    composer_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
  tableName: 'composers', // Make sure this matches the case exactly as in your database
  freezeTableName: true,// This prevents Sequelize from attempting to modify the table name
//   timestamps: false, // Disable automatic timestamping
});

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


// Sync the model with the database
async function syncComposerModel() {
    try {
        await Composer.sync();
        console.log('Composer model synced successfully');
    } catch (error) {
        console.error('Error syncing Composer model:', error);
    }
}

// Export the Composer model
module.exports = { Composer, syncComposerModel };
