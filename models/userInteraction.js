// Import Sequelize library
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://localhost/modernmaestros');

// Define the UserInteraction model with custom table name options
const UserInteraction = sequelize.define('UserInteraction', {
    interaction_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'user_id' }
    },
    target_id: {
        type: DataTypes.INTEGER
    },
    interaction_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT
    },
    interaction_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'user_interactions', // Make sure this matches the case exactly as in your database
    freezeTableName: true // This prevents Sequelize from attempting to modify the table name
});

// Sync the model with the database
async function syncUserInteractionModel() {
    try {
        await UserInteraction.sync();
        console.log('UserInteraction model synced successfully');
    } catch (error) {
        console.error('Error syncing UserInteraction model:', error);
    }
}

// Export the UserInteraction model
module.exports = { UserInteraction, syncUserInteractionModel };
