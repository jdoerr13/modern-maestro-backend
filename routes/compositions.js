const jsonschema = require("jsonschema");
const express = require("express");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureLoggedIn } = require("../middleware/authMiddle"); // Adjust based on your auth strategy
const { Composition, getCompositionById } = require("../models/composition");
const { Composer } = require("../models/composer");

const instrumentsList = require("../schemas/instrumentsList");
const compositionNewSchema = require("../schemas/compositionNew.json"); // Define this schema
const compositionUpdateSchema = require("../schemas/compositionUpdate.json"); // Define this schema
const compositionSearchSchema = require("../schemas/compositionSearch.json"); // Define this schema

// Define the directory path where files should be saved
const uploadsDir = path.join(__dirname, '../uploads'); // Adjust the path as needed

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Use the uploadsDir variable
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });
// app.use('/uploads', express.static('uploads'));
const router = new express.Router();


router.get("/instruments", async function (req, res, next) {
  try {
    // Directly return the static list of instruments
    return res.json({ instruments: instrumentsList });
  } catch (err) {
    return next(err);
  }
});

/** POST / { composition } =>  { composition }
 *
 * composition should be { title, composerId, year, description, duration, status, instrumentation }
 *
 * Returns { id, title, composerId, year, description, duration, status, instrumentation }
 *
 * Authorization required: admin (adjust as necessary)
 */
router.post("/", upload.single('audioFile'), ensureLoggedIn, async function (req, res, next) {
  console.log(req.file);
  try {
    // Convert numeric fields from string to integer
    req.body.composerId = parseInt(req.body.composerId, 10);
    req.body.year = parseInt(req.body.year, 10);
    req.body.duration = parseInt(req.body.duration, 10);

    // Convert instrumentation from JSON string to array
    if (typeof req.body.instrumentation === 'string') {
      req.body.instrumentation = JSON.parse(req.body.instrumentation);
    }

    const validator = jsonschema.validate(req.body, compositionNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    // Ensure composer exists
    let composer = await Composer.findById(req.body.composerId);
    if (!composer) {
      throw new BadRequestError("Composer not found.");
    }

    // Ensure instrumentation contains valid instruments
    if (!req.body.instrumentation.every(instr => instrumentsList.includes(instr))) {
      throw new BadRequestError("Instrumentation contains invalid instruments.");
    }

    const compositionData = {
      title: req.body.title,
      composer_id: req.body.composerId, // Make sure the field names match your database column names
      year: req.body.year,
      description: req.body.description,
      duration: req.body.duration,
      instrumentation: req.body.instrumentation, // No need to stringify again
      audio_file_path: req.file ? req.file.path : null,
    };

    const composition = await Composition.create(compositionData);
    return res.status(201).json({ composition });
  } catch (err) {
    console.error(err);
    return next(err);
  }
});






router.get("/", async function (req, res, next) {
  const q = req.query;

  try {
    const validator = jsonschema.validate(q, compositionSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const compositions = await Composition.findAll({
      include: [{
        model: Composer,
        attributes: ['name'], // Include only the name attribute of the composer
      }]
    });

    return res.json({ compositions });
  } catch (err) {
    return next(err);
  }
});




// router.get("/with-composers", async function (req, res, next) {
//   try {
//     // Fetch all compositions along with their composer's name
//     const compositions = await Composition.findAll({
//       include: [{
//         model: Composer,
//         attributes: ['name'], // Just get the composer's name
//       }]
//     });

//     // Prepare and send the response
//     const result = compositions.map(comp => {
//       return {
//         compositionId: comp.composition_id,
//         title: comp.title,
//         yearOfComposition: comp.year_of_composition,
//         description: comp.description,
//         duration: comp.duration,
//         instrumentation: comp.instrumentation,
//         externalApiName: comp.external_api_name,
//         composerName: comp.Composer.name // Access the included Composer name
//       };
//     });

//     res.json(result);
//   } catch (err) {
//     next(err);
//   }
// });

// /** GET /  =>
//  *   { compositions: [ { id, title, composerId, year, description, duration, status, instrumentation }, ...] }
//  *
//  * Can filter on provided search filters:
//  * - year
//  * - status
//  * - composerId
//  *
//  * Authorization required: none
//  */
// router.get("/", async function (req, res, next) {
//   const q = req.query;

//   try {
//     const validator = jsonschema.validate(q, compositionSearchSchema);
//     if (!validator.valid) {
//       const errs = validator.errors.map(e => e.stack);
//       throw new BadRequestError(errs);
//     }

//     const compositions = await Composition.findAll(q);
//     return res.json({ compositions });
//   } catch (err) {
//     return next(err);
//   }
// });

/** GET /[id]  =>  { composition }
 *
 *  Composition is { id, title, composerId, year, description, duration, status, instrumentation }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const compositionId = req.params.id;
    const composition = await getCompositionById(compositionId);
    return res.json({ composition });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { composition }
 *
 * Patches composition data.
 *
 * fields can be: { title, year, description, duration, status, instrumentation }
 *
 * Returns { id, title, composerId, year, description, duration, status, instrumentation }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, compositionUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    // Similar update handling for the instrumentation field as in the POST route
    let instrumentation = req.body.instrumentation || [];
    if (!Array.isArray(instrumentation) || !instrumentation.every(instr => instrumentsList.includes(instr))) {
      throw new BadRequestError("Instrumentation contains invalid instruments.");
    }

    const updatedData = { ...req.body, instrumentation };
    const composition = await Composition.update(req.params.id, updatedData);
    return res.json({ composition });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Composition.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;