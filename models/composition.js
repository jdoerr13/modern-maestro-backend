const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://localhost/modernmaestros');

const Composition = sequelize.define('Composition', {
    composition_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    composer_id: {
        type: DataTypes.INTEGER,
        references: { model: 'composers', key: 'composer_id' }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year_of_composition: {
        type: DataTypes.INTEGER
    },
    description: {
        type: DataTypes.TEXT
    },
    duration: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.STRING
    },
    instrumentation: {
        type: DataTypes.JSONB
    },
    external_api_name: {
        type: DataTypes.STRING,
    }
}, {
    tableName: 'compositions', // Specify the table name here if it's not the default
    freezeTableName: true // This option prevents Sequelize from automatically pluralizing the table name
  });


// Sync the model with the database
async function syncCompositionModel() {
    try {
        await Composition.sync();
        console.log('Composition model synced successfully');
    } catch (error) {
        console.error('Error syncing Composition model:', error);
    }
}

module.exports = { Composition, syncCompositionModel };
