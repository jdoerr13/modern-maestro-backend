// Import Sequelize library
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://localhost/modernmaestros');


const UserInteraction = sequelize.define('UserInteraction', {
    interaction_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users', // This should match the table name for the user
            key: 'user_id'
        }
    },
    target_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    target_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    interaction_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true // Assuming content could be optional
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true, // Assuming rating could be optional
        validate: {
            min: 1,
            max: 5
        }
    },
    interaction_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'user_interactions',
    freezeTableName: true,
    timestamps: true, // Assuming you want Sequelize to automatically handle `createdAt` and `updatedAt`
    underscored: true, // If your table uses snake_case
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
