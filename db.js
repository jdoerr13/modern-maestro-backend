// /** Database setup for modern-meastros. */
// const { Pool } = require("pg");
// const { getDatabaseUri } = require("./config");

// let pool;

// if (process.env.NODE_ENV === "production") {
//   pool = new Pool({
//     connectionString: getDatabaseUri(),
//     ssl: {
//       rejectUnauthorized: false
//     }
//   });
// } else {
//   pool = new Pool({
//     connectionString: getDatabaseUri()
//   });
// }

// pool.on('connect', () => {
//   console.log('Connected to database');
// });

// pool.on('error', (err) => {
//   console.error('Unexpected error on idle client', err);
//   process.exit(-1);
// });

// module.exports = {
//   query: (text, params) => pool.query(text, params),
//   getClient: () => pool.connect(),
//   end: () => pool.end(),
// };
// db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();


const dbUri = process.env.DATABASE_URL || 'postgresql://localhost/modernmaestros';

const sequelize = new Sequelize(dbUri, {
  dialect: 'postgres',
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Adjust based on your SSL configuration
    },
  } : {},
  logging: false,
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

module.exports = sequelize;
