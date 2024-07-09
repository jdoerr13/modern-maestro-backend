// Import Sequelize library
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://localhost/modernmaestros');

// Define the Performance model with custom table name options
const Performance = sequelize.define('Performance', {
    performance_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    composition_id: {
        type: DataTypes.INTEGER,
        references: { model: 'compositions', key: 'composition_id' }
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'user_id' }
    },
    recording_date: {
        type: DataTypes.DATE
    },
    location: {
        type: DataTypes.TEXT
    },
    file_url: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'performances', // Make sure this matches the case exactly as in your database
    freezeTableName: true // This prevents Sequelize from attempting to modify the table name
});

// Sync the model with the database
async function syncPerformanceModel() {
    try {
        await Performance.sync();
        console.log('Performance model synced successfully');
    } catch (error) {
        console.error('Error syncing Performance model:', error);
    }
}

// Export the Performance model
module.exports = { Performance, syncPerformanceModel };
