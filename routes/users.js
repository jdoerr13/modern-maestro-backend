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

        const { username, email, password, user_type, preferences } = req.body;
        const password_hash = await bcrypt.hash(password, 10); // Hash password

        const user = await User.findOrCreateUser(username, email, password_hash, user_type, preferences);
        const token = createToken(user); // Ensure your createToken method can handle Sequelize models

        return res.status(201).json({ user, token });
    } catch (err) {
        return next(err);
    }
});


        // GET /users => { users: [...users] }
        // Route for listing all users, admin only
        router.get('/', ensureAdmin, async function (req, res, next) {
            try {
                const users = await User.findAll();
                return res.json({ users });
            } catch (err) {
                return next(err);
            }
        });

router.get('/:username', ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const username = req.params.username;
        // Fetch the user by username. Ensure the query includes all fields.
        const user = await User.findOne({
            where: { username: username },
            attributes: ['user_id', 'username', 'email', 'firstName', 'lastName', 'user_type', 'preferences'] // Specify attributes to fetch
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
router.patch('/:username', ensureCorrectUserOrAdmin, async function (req, res, next) {
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

// This route assumes there's a user logged in who wishes to update their profile to indicate they are a composer
router.patch('/:userId/composer', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { isComposer, composerDetails } = req.body; // Expecting isComposer boolean and optional composerDetails object

        if (isComposer) {
            // Check if the provided composer name already exists in the database
            const existingComposer = await Composer.findOne({ where: { name: composerDetails.name } });

            if (existingComposer) {
                return res.status(400).json({ error: 'Composer name already exists. Please select a new name.' });
            }

            // Update user_type to 'composer' if isComposer is true
            await user.update({ user_type: 'composer' });

            // Logic to create or update the Composer entry linked to this User
            let composer = await Composer.findOne({ where: { user_id: userId } });

            if (composer) {
                // Update existing composer record
                await composer.update(composerDetails);
            } else {
                // Create new composer record linked to the user
                composerDetails.user_id = userId; // Ensure this matches the foreign key column name in your schema
                composer = await Composer.create(composerDetails);
            }

            return res.json({ user, composer }); // Respond with both user and composer information
        }

        // If not a composer, update user_type to 'normal'
        await user.update({ user_type: 'normal' });

        // Remove composer record if exists
        await Composer.destroy({ where: { user_id: userId } });

        // Return updated user information
        return res.json({ user });
    } catch (error) {
        next(error);
    }
});
// GET /users/:userId/composer => { composer }
// Route for fetching composer details by user ID
router.get('/:userId/composer', ensureLoggedIn, async (req, res, next) => {
    try {
        const { userId } = req.params;
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
