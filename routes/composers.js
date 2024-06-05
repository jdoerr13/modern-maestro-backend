const express = require('express');
const router = express.Router();
const { Composer } = require('../models/composer');
const { Composition }  = require('../models/composition');
const { ensureLoggedIn, ensureAdmin, ensureCorrectUserOrAdmin } = require('../middleware/authMiddle');
const { fetchTracksByComposerName } = require('../dataImport/dataImportSpotify');


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


router.get('/tracks/byComposer/:composerName', async (req, res, next) => {
  console.log(`Fetching tracks for composer: ${req.params.composerName}`);
  try {
    const { composerName } = req.params;
    const tracks = await fetchTracksByComposerName(composerName);
    res.json({ tracks }); // Send the fetched tracks back to the client
  } catch (error) {
    console.error('Error fetching tracks by composer:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    // Check for existing composer
    const existingComposer = await Composer.findByName(name);
    if (existingComposer) {
      return res.status(409).json({ error: "Composer already exists." });
    }

    // Proceed with creation if no existing composer found
    const composer = await Composer.create({ name, biography, website, social_media_links });
    res.status(201).json({ composer });
  } catch (error) {
    next(error);
  }
});




router.patch('/:composerId', async (req, res) => {
  console.log("Received composerId:", req.params.composerId);
  console.log("Request body:", req.body);

  const { composerId } = req.params;
  try {
    let composer = await Composer.findByPk(composerId); // Assuming findByPk expects the primary key value, not the field name.
    if (!composer) {
      return res.status(404).json({ error: "Composer not found." });
    }

    // Here, you're using the parameter to find a record, which should be independent of the database's field naming.
    // The updateObject construction and the update logic shouldn't be affected by whether the DB uses composer_id or another naming convention.

    const fieldsToUpdate = ['name', 'biography', 'website', 'social_media_links'];
    let updateObject = {};
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        updateObject[field] = req.body[field];
      }
    });

    await composer.update(updateObject);
    return res.json({ composer });
  } catch (error) {
    console.error("Error handling composer update:", error);
    return res.status(500).json({ error: "Internal server error" });
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
