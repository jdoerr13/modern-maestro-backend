// Import necessary libraries and middleware
const express = require('express');
const router = express.Router();
const { User } = require('../models/user'); 
const { Composer } = require ('../models/composer');
const bcrypt = require('bcrypt');
const jsonschema = require('jsonschema');
const { ensureAdmin, ensureCorrectUserOrAdmin, ensureLoggedIn } = require('../middleware/authMiddle'); 
const { BadRequestError } = require('../expressError'); 
const userNewSchema = require('../schemas/userNew.json'); 
const userUpdateSchema = require('../schemas/userUpdate.json'); 
const userSearchSchema = require('../schemas/userSearch.json'); 
const { createToken } = require('../helpers/tokens'); 

// POST /users { user } => { user, token }
// Route for admin to add new users
router.post('/', ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const { username, email, password, user_type } = req.body;
        const password_hash = await bcrypt.hash(password, 10); // Hash password

        const user = await User.findOrCreateUser(username, email, password_hash, user_type );
        const token = createToken(user); // Ensure your createToken method can handle Sequelize models

        return res.status(201).json({ user, token });
    } catch (err) {
        return next(err);
    }
});


        // GET /users => { users: [...users] }
        // Route for listing all users, admin only
        router.get('/', async function (req, res, next) {
            try {
                const users = await User.findAll();
                return res.json({ users });
            } catch (err) {
                return next(err);
            }
        });

router.get('/:username', async function (req, res, next) {
    try {
        const username = req.params.username;
        // Fetch the user by username. Ensure the query includes all fields.
        const user = await User.findOne({
            where: { username: username },
            attributes: ['user_id', 'username', 'email', 'firstName', 'lastName', 'user_type'] // Specify attributes to fetch
        });

        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Return the user object. Make sure to serialize if necessary to match the expected format.
        return res.json({ user: user.toJSON() }); // Use .toJSON() if the object needs serialization
    } catch (err) {
        return next(err);
    }
});


// GET /users/search => { users: [...matchedUsers] }
// Route for searching users based on certain criteria
router.get('/search', ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.query, userSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const { username, email, user_type } = req.query;
        const whereClause = {};
        if (username) whereClause.username = username;
        if (email) whereClause.email = email;
        if (user_type) whereClause.user_type = user_type;

        const matchedUsers = await User.findAll({ where: whereClause });
        return res.json({ users: matchedUsers });
    } catch (err) {
        return next(err);
    }
});

// PATCH /users/:username => { user }
// Route for updating a user, with authorization
router.patch('/:username', async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const username = req.params.username;
        let user = await User.findOne({ where: { username } });
        if (!user) {
            throw new BadRequestError('User not found');
        }

        const updateData = { ...req.body };
        // Hash new password if present.
        if (updateData.password) {
            updateData.password_hash = await bcrypt.hash(updateData.password, 10);
            delete updateData.password; // Remove plain password from the update object
        }

        // Update user details with Sequelize's update method, which respects the model's field mappings.
        await user.update(updateData);

        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});



// DELETE /users/:username => { deleted: username }
// Route for deleting a user, with authorization
router.delete('/:username', ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const username = req.params.username;
        const user = await User.findOne({ where: { username } });
        if (!user) {
            throw new BadRequestError('User not found');
        }

        await user.destroy();
        return res.json({ deleted: username });
    } catch (err) {
        return next(err);
    }
});

router.patch('/:userId/composer', async (req, res) => {
    const { userId } = req.params;
    const { isComposer, composerDetails } = req.body;

    try {
        let composer = await Composer.findOne({ where: { user_id: userId } });
        let user = await User.findByPk(userId);  // Assuming you have a User model to handle user data

        if (isComposer) {
            if (composer) {
                await composer.update({ ...composerDetails });
            } else {
                await Composer.create({ ...composerDetails, user_id: userId });
            }
            if (user && user.user_type !== 'composer') {
                await user.update({ user_type: 'composer' });  // Update the user_type
            }
        } else {
            if (user && user.user_type !== 'normal') {
                await user.update({ user_type: 'normal' });  // Change back to normal if not a composer
            }
            // Optionally handle the case where the user is no longer a composer
            // e.g., remove the composer record or set a flag
        }

        return res.status(200).send('Composer status and user type updated');
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred');
    }
});






  router.get('/:userId/composer', ensureLoggedIn, async (req, res, next) => {
    try {
        const { userId } = req.params;
        console.log(`Fetching composer for user ID: ${userId}`);
        
        // Find the composer associated with the given user ID
        const composer = await Composer.findOne({ where: { user_id: userId } });
        if (!composer) {
            return res.status(404).json({ error: 'Composer not found for the user' });
        }

        return res.json({ composer });
    } catch (err) {
        return next(err);
    }
});




module.exports = router;
