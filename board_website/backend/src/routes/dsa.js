const express = require('express');
const router = express.Router();
const dsaController = require('../controllers/dsaController');

router.get('/dsa/progress', dsaController.getProgress);
router.post('/dsa/progress', dsaController.saveProgress);
router.post('/dsa/review', dsaController.reviewProblem);

module.exports = router;

