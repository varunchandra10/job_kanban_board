const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');

router.get('/check-slug', portfolioController.checkSlugAvailability);
router.get('/:slug/resume', portfolioController.downloadPublicResume);
router.get('/:slug', portfolioController.getPublicPortfolio);

module.exports = router;
