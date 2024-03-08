require('dotenv').config();
require('colors');

// Secret key for JWT signing and encryption
const SECRET_KEY = process.env.SECRET_KEY || 'development-secret-key';

// Port number for the Express server
const PORT = +process.env.PORT || 3000;

// Database URI
// In real applications, use environmental variables to manage this URI for different environments (development, test, production)
function getDatabaseUri() {
    return process.env.NODE_ENV === 'test'
        ? 'postgresql://localhost/modernmaestros_test'
        : process.env.DATABASE_URL || 'postgresql://localhost/modernmaestros';
}

// Bcrypt work factor - adjust as needed, higher is more secure but slower
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === 'test' ? 1 : 12;

console.log('ModernMaestros Config:'.green);
console.log('SECRET_KEY:'.yellow, SECRET_KEY);
console.log('PORT:'.yellow, PORT.toString());
console.log('Database:'.yellow, getDatabaseUri());
console.log('BCRYPT_WORK_FACTOR:'.yellow, BCRYPT_WORK_FACTOR);
console.log('---');

module.exports = {
    SECRET_KEY,
    PORT,
    BCRYPT_WORK_FACTOR,
    getDatabaseUri,
};
