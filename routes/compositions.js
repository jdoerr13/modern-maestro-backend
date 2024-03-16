const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureLoggedIn } = require("../middleware/authMiddle"); // Adjust based on your auth strategy
const { Composition, getCompositionById } = require("../models/composition");
const { Composer } = require("../models/composer");

const instrumentsList = require("../schemas/instrumentsList");
const compositionNewSchema = require("../schemas/compositionNew.json"); // Define this schema
const compositionUpdateSchema = require("../schemas/compositionUpdate.json"); // Define this schema
const compositionSearchSchema = require("../schemas/compositionSearch.json"); // Define this schema

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
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, compositionNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    // Assuming `composerId` is part of your compositionNewSchema, you don't need to check for composer_name
    // Ensure `composerId` is provided and valid. This step might involve finding the composer by ID
    if (!req.body.composerId) {
      throw new BadRequestError("Composer ID is required.");
    }

    let composer = await Composer.findById(req.body.composerId);
    if (!composer) {
      throw new BadRequestError("Composer not found.");
    }

    // Updated handling for the instrumentation field
    let instrumentation = req.body.instrumentation || [];
    if (!Array.isArray(instrumentation) || !instrumentation.every(instr => instrumentsList.includes(instr))) {
      throw new BadRequestError("Instrumentation contains invalid instruments.");
    }

    // Convert the instrumentation array to a JSON string
    const instrumentationJson = JSON.stringify(instrumentation);

    const compositionData = {
      ...req.body,
      composer_id: composer.composer_id,
      instrumentation: instrumentationJson // Update the instrumentation field with the JSON string
    };

    // No need to delete composer_name as it's no longer part of the input
    const composition = await Composition.create(compositionData);
    return res.status(201).json({ composition });
  } catch (err) {
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