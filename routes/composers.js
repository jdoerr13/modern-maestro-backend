const express = require('express');
const router = express.Router();
const { Composer } = require('../models/composer');
const { Composition }  = require('../models/composition');
const { ensureLoggedIn, ensureAdmin, ensureCorrectUserOrAdmin } = require('../middleware/authMiddle');
const { fetchTracksByArtistAndProcess } = require('../dataImport/dataImportSpotify');
/** GET /composers  =>
 *   { composers: [ { composer_id, name, biography, website, social_media_links }, ...] }
 *
 * Authorization required: none
 */
router.get('/', async (req, res, next) => {
  try {
    const composers = await Composer.findAll();
    res.json({ composers });
  } catch (error) {
    next(error);
  }
});
/** GET /composers/fetch/:artistName
 * Fetches composer data from external APIs based on the artist name.
 * If the composer already exists, updates their details; otherwise, creates a new composer.
 * Returns the updated or created composer object.
 *
 * Authorization required: none
 */
router.get('/fetch/:artistName', async (req, res, next) => {
  try {
    const { artistName } = req.params;
    const fetchedComposerData = await fetchTracksByArtistAndProcess(artistName); // Use your function to fetch data from Spotify or other APIs

    // Check if the fetched data contains valid composer information
    if (!fetchedComposerData || Object.keys(fetchedComposerData).length === 0) {
      return res.status(404).json({ error: 'Composer data not found for the specified artist' });
    }

    // Check if the composer already exists in the database
    let composer = await Composer.findOne({ where: { name: fetchedComposerData.name } });

    // If the composer doesn't exist, create a new record; otherwise, update the existing record
    if (!composer) {
      composer = await Composer.create(fetchedComposerData);
    } else {
      await composer.update(fetchedComposerData);
    }

    res.json({ composer });
  } catch (error) {
    next(error);
  }
});
/** GET /composers/:id  =>  { composer }
 *
 * Authorization required: none
 */
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const composer = await Composer.findByPk(id);
    if (!composer) {
      return res.status(404).json({ error: 'Composer not found' });
    }
    res.json({ composer });
  } catch (error) {
    next(error);
  }
});

// Additional import may be required depending on how you've structured your code
// Assuming Composition model has a method to find by composerId

/** GET /composers/:composerId/compositions => { compositions: [...] }
 *
 * Returns list of compositions for a given composer.
 *
 * Authorization required: none
 */
router.get("/:composerId/compositions", async function (req, res, next) {
  try {
    const { composerId } = req.params;
    const compositions = await Composition.findAll({
      where: { composer_id: composerId }
    });
    return res.json({ compositions });
  } catch (err) {
    return next(err);
  }
});

/** POST /composers  =>  { composer }
 *
 * Creates a new composer and returns the newly created composer.
 *
 * Authorization required: Logged in
 */
router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const { name, biography, website, social_media_links } = req.body;
    const composer = await Composer.create({ name, biography, website, social_media_links });
    res.status(201).json({ composer });
  } catch (error) {
    next(error);
  }
});

/** PATCH /composers/:id  =>  { composer }
 *
 * Updates an existing composer's details except for the name.
 *
 * Authorization required: Admin
 */

router.patch('/:id', async (req, res, next) => {
  console.log("Request Params:", req.params);
  console.log("Request Body:", req.body);
  try {
    if (!res.locals.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Using res.locals.user now
    const userId = res.locals.user.user_id; // Adjust this based on your token payload structure
    const { id } = req.params;
    const composer = await Composer.findByPk(id);
    if (!composer) {
      return res.status(404).json({ error: 'Composer not found' });
    }

    // Check if the current user is the composer's user or an admin
    // Ensure your payload and middleware set `user_id` and `role` appropriately
    if (composer.userId !== userId && !res.locals.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Extract the necessary fields from req.body
    const { name, biography, website, social_media_links } = req.body;
    
    // Proceed to update the composer with the provided fields
    await composer.update({ name, biography, website, social_media_links });

    // Respond with the updated composer information
    res.json({ composer });
  } catch (error) {
    console.error("Error in PATCH /composers/:id:", error);
    return res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});


/** PATCH /composers/:id/name  =>  { composer }
 *
 * Updates an existing composer's name.
 * This route should be used to update only the composer's name.
 *
 * Authorization required: Admin
 */
router.patch('/:id/name', ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const composer = await Composer.findByPk(id);
    if (!composer) {
      return res.status(404).json({ error: 'Composer not found' });
    }

    const { name } = req.body;
    await composer.update({ name });
    res.json({ composer });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
