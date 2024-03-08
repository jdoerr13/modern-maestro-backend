// Import Sequelize library
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://localhost/modernmaestros');

// Define the User model with custom table name options
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
        allowNull: true, // Adjust based on your requirements
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
        type: DataTypes.JSONB,
        allowNull: true // Changed to true to allow null
    },
    preferences: {
        type: DataTypes.JSONB,
        allowNull: true // Changed to true to allow null
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

    // // Define findOrCreateUser method inside the User model
    // classMethods: {
    //     findOrCreateUser: async function(userInfo) {
    //         const [user, created] = await this.findOrCreate({
    //           where: { username: userInfo.username, email: userInfo.email },
    //           defaults: { // other fields to set upon creation
    //             password_hash: userInfo.password_hash,
    //             user_type: userInfo.user_type,
    //             preferences: userInfo.preferences,
    //             isAdmin: userInfo.isAdmin
    //           }
    //         });
    //         return { user, created };
    //     }
    // }
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

