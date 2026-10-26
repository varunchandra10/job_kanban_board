const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applicationsController');
const { sanitizeBody, validateIdParam, validateCreateApplication } = require('../middleware/requestValidator');

router.use(sanitizeBody);

router.get('/state', applicationsController.getState);
router.get('/activity/:id', validateIdParam, applicationsController.getActivity);
router.post('/activity', applicationsController.addActivity);
router.post('/applications', validateCreateApplication, applicationsController.createApplication);
router.patch('/applications/:id', validateIdParam, applicationsController.updateApplication);
router.delete('/applications/:id', validateIdParam, applicationsController.deleteApplication);
router.post('/applications/:id/move', validateIdParam, applicationsController.moveApplication);

module.exports = router;
