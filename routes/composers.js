const express = require('express');
const router = express.Router();
const { Composer } = require('../models/composer');
const { Composition } = require('../models/composition');
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

/** GET /composers/tracks/byComposer/:composerName => { tracks: [...] }
 *
 * Fetch tracks for a given composer name using Spotify API.
 *
 * Authorization required: none
 */
router.get('/tracks/byComposer/:composerName', async (req, res, next) => {
  console.log(`Fetching tracks for composer: ${req.params.composerName}`);
  try {
    const { composerName } = req.params;
    const tracks = await fetchTracksByComposerName(composerName);
    res.json({ tracks });
  } catch (error) {
    console.error('Error fetching tracks by composer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /composers/:composerId/compositions => { compositions: [...] }
 *
 * Returns list of compositions for a given composer.
 *
 * Authorization required: none
 */
router.get('/:composerId/compositions', async function (req, res, next) {
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

/** POST /composers  =>  { composer }
 *
 * Creates a new composer and returns the newly created composer.
 *
 * Authorization required: Logged in
 */
// router.post('/', ensureLoggedIn, async (req, res, next) => {
  router.post('/', async (req, res, next) => {
  try {
    const { name, biography, website, social_media_links } = req.body;

    const existingComposer = await Composer.findByName(name);
    if (existingComposer) {
      return res.status(409).json({ error: "Composer already exists." });
    }

    const composer = await Composer.create({ name, biography, website, social_media_links });
    res.status(201).json({ composer });
  } catch (error) {
    next(error);
  }
});

/** PATCH /composers/:composerId => { composer }
 *
 * Updates fields of a composer.
 *
 * Authorization required: none (could be restricted further)
 */
router.patch('/:composerId', async (req, res) => {
  console.log("Received composerId:", req.params.composerId);
  console.log("Request body:", req.body);

  const { composerId } = req.params;
  try {
    let composer = await Composer.findByPk(composerId);
    if (!composer) {
      return res.status(404).json({ error: "Composer not found." });
    }

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
 * Updates only the composer's name.
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
