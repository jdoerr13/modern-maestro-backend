const request = require('supertest');
const app = require('../app');
const { Composer, syncComposerModel } = require('../models/composer');
const { User, syncUserModel } = require('../models/user');
const db = require('../db');
const bcrypt = require('bcrypt');
const { createToken } = require('../helpers/tokens');

// Mock the authenticateJWT middleware
jest.mock('../middleware/authMiddle', () => ({
  authenticateJWT: (req, res, next) => next()
}));

let adminToken;
let transaction;

beforeAll(async () => {
  await syncUserModel();
  await syncComposerModel();

  const hashedPassword = await bcrypt.hash('password', 1);
  const adminUser = await User.create({
    username: 'admin',
    password_hash: hashedPassword,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    isAdmin: true,
    user_type: 'admin'
  });

  adminToken = createToken({ userId: adminUser.user_id, username: adminUser.username, isAdmin: adminUser.isAdmin });
});

beforeEach(async () => {
  transaction = await db.sequelize.transaction();
});

afterEach(async () => {
  await transaction.rollback();
});

describe('Composer Routes', () => {
  it('should create a new composer', async () => {
    const response = await request(app)
      .post('/composers')
      .set('authorization', `Bearer ${adminToken}`)
      .send({ name: 'John Doe', biography: 'A famous composer', website: 'http://johndoe.com' });

    expect(response.status).toBe(201);
    expect(response.body.composer).toHaveProperty('name', 'John Doe');
  });

  it('should delete a composer', async () => {
    const newComposer = await Composer.create({ name: 'Jane Doe', biography: 'Another famous composer' });

    const response = await request(app)
      .delete(`/composers/${newComposer.composer_id}`)
      .set('authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('deleted', `${newComposer.composer_id}`);
  });
});
