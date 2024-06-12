/** Database setup for modern-meastros. */
const { Pool } = require("pg");
const { getDatabaseUri } = require("./config");

let pool;

if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  pool = new Pool({
    connectionString: getDatabaseUri()
  });
}

pool.on('connect', () => {
  console.log('Connected to database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  end: () => pool.end(),
};
