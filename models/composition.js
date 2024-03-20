const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://localhost/modernmaestros');
// const { Composer } = require('./composer'); 

const Composition = sequelize.define('Composition', {
    composition_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    composer_id: {
        type: DataTypes.INTEGER,
        // references: {
        //   model: Composer,
        //   key: 'composer_id'
        // },
        allowNull: false // Ensure composer_id is not null
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
    instrumentation: {
        type: DataTypes.JSONB
    },
    external_api_name: {
        type: DataTypes.STRING,
    },
    audio_file_path: {
        type: DataTypes.STRING,
        allowNull: true // assuming the file upload is optional
      }
}, {
    tableName: 'compositions', 
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
// Define the getCompositionById function directly here
async function getCompositionById(id) {
    try {
        const composition = await Composition.findByPk(id);
        if (!composition) {
            throw new Error(`Composition with ID ${id} not found`);
        }
        return composition;
    } catch (error) {
        throw new Error(`Error fetching composition: ${error.message}`);
    }
}

module.exports = { Composition, syncCompositionModel, getCompositionById };
