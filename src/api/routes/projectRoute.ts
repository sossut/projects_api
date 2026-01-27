import express from 'express';
import {
  projectListGet,
  projectGet,
  projectPost,
  projectPut,
  projectDelete
} from '../controllers/projectController';
import { body, param } from 'express-validator';
import passport from 'passport';

const router = express.Router();

router
  .route('/')
  .get(projectListGet)
  .post(
    // passport.authenticate('jwt', { session: false }),
    body('projects').isArray({ min: 1 }),
    body('projects.*.name').isString().notEmpty().escape(),
    body('projects.*.buildingType').isString().notEmpty().escape(),
    body('projects.*.buildingUse').isArray({ min: 1 }),
    body('projects.*.buildingUse.*').isString().notEmpty().escape(),
    body('projects.*.buildingHeightMeters')
      .if((value) => value !== null && value !== undefined)
      .isFloat({ gt: 0 })
      .toFloat(),
    body('projects.*.buildingHeightFloors')
      .if((value) => value !== null && value !== undefined)
      .isInt({ gt: 0 })
      .toInt(),

    body('projects.*.glassFacade')
      .optional()
      .isIn(['yes', 'no', 'unknown', null, true, false, 0, 1]),
    body('projects.*.facadeBasis').optional().isString().notEmpty().escape(),
    body('projects.*.status')
      .optional()
      .isIn([
        'planned',
        'approved',
        'proposed',
        'on_hold',
        'under_construction',
        'completed',
        'cancelled'
      ]),
    body('projects.*.budgetEur').optional().isFloat({ gt: 0 }).toFloat(),
    body('projects.*.expectedCompletionWindow').optional().isObject(),
    body('projects.*.expectedCompletionWindow.expected')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.expectedCompletionWindow.earliest')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.expectedCompletionWindow.latest')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.location').optional().isObject(),
    body('projects.*.location.continent')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.location.country')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.location.city')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.location.metroArea')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.location.address')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.location.postcode')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.projectWebsites').optional().isArray(),
    body('projects.*.projectWebsites.*').isString().notEmpty().isURL(),
    body('projects.*.developers').optional().isArray(),
    body('projects.*.developers.*.name')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.developers.*.website')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .isURL(),
    body('projects.*.developers.*.contact').optional().isObject(),
    body('projects.*.developers.*.contact.email')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isEmail()
      .normalizeEmail(),
    body('projects.*.developers.*.contact.phone')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.architects').optional().isArray(),
    body('projects.*.architects.*.name')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.architects.*.website')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .isURL(),
    body('projects.*.architects.*.contact').optional().isObject(),
    body('projects.*.architects.*.contact.email')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isEmail()
      .normalizeEmail(),
    body('projects.*.architects.*.contact.phone')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.contractors').optional().isArray(),
    body('projects.*.contractors.*.name')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.contractors.*.website')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .isURL(),
    body('projects.*.contractors.*.contact').optional().isObject(),
    body('projects.*.contractors.*.contact.email')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isEmail()
      .normalizeEmail(),
    body('projects.*.contractors.*.contact.phone')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projects.*.sources').optional().isArray(),
    body('projects.*.sources.*.url').isString().notEmpty().isURL(),
    body('projects.*.sources.*.sourceType')
      .optional()
      .isString()
      .notEmpty()
      .escape(),
    body('projects.*.sources.*.publisher')
      .optional()
      .isString()
      .notEmpty()
      .escape(),
    body('projects.*.sources.*.accessedAt').optional().isISO8601().toDate(),
    projectPost
  );
router
  .route('/:id')
  .get(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    projectGet
  )
  .put(
    // passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    body('name').optional().isString().notEmpty().escape(),
    body('buildingType').optional().isString().notEmpty().escape(),
    body('buildingUse').optional().isArray({ min: 1 }),
    body('buildingUse.*').isString().notEmpty().escape(),
    body('buildingHeightMeters')
      .if((value) => value !== null && value !== undefined)
      .isFloat({ gt: 0 })
      .toFloat(),
    body('buildingHeightFloors')
      .optional()
      .isInt({ gt: 0 })
      .toInt()
      .customSanitizer((value) => (value === null ? null : value)),
    body('glassFacade')
      .optional()
      .isIn(['yes', 'no', 'unknown', null, true, false, 0, 1]),
    body('facadeBasis').optional().isString().notEmpty().escape(),
    body('status')
      .optional()
      .isIn([
        'planned',
        'approved',
        'proposed',
        'on_hold',
        'under_construction',
        'completed',
        'cancelled'
      ]),
    body('budgetEur').optional().isFloat({ gt: 0 }).toFloat(),
    body('expectedCompletionWindow').optional().isObject(),
    body('expectedCompletionWindow.expected')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('expectedCompletionWindow.earliest')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('expectedCompletionWindow.latest')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('location').optional().isObject(),
    body('location.continent')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('location.country')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('location.city')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('location.metroArea')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('location.address')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('location.postcode')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('projectWebsites').optional().isArray(),
    body('projectWebsites.*').isString().notEmpty().isURL(),
    body('developers').optional().isArray(),
    body('developers.*.name')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('developers.*.website')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .isURL(),
    body('developers.*.contact').optional().isObject(),
    body('developers.*.contact.email')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isEmail()
      .normalizeEmail(),
    body('developers.*.contact.phone')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('architects').optional().isArray(),
    body('architects.*.name')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('architects.*.website')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .isURL(),
    body('architects.*.contact').optional().isObject(),
    body('architects.*.contact.email')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isEmail()
      .normalizeEmail(),
    body('architects.*.contact.phone')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('contractors').optional().isArray(),
    body('contractors.*.name')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('contractors.*.website')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .isURL(),
    body('contractors.*.contact').optional().isObject(),
    body('contractors.*.contact.email')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isEmail()
      .normalizeEmail(),
    body('contractors.*.contact.phone')
      .if((value) => value !== null && value !== undefined && value !== '')
      .isString()
      .escape(),
    body('sources').optional().isArray(),
    body('sources.*.url').isString().notEmpty().isURL(),
    body('sources.*.sourceType').optional().isString().notEmpty().escape(),
    body('sources.*.publisher').optional().isString().notEmpty().escape(),
    body('sources.*.accessedAt').optional().isISO8601().toDate(),

    projectPut
  )
  .delete(
    passport.authenticate('jwt', { session: false }),
    param('id').isInt({ gt: 0 }).toInt(),
    projectDelete
  );
export default router;
