const express = require('express');
const router = express.Router();
const weeklyChestController = require('../controllers/weeklyChestController');

// Weekly Quest Chest Endpoints
router.get('/weekly-chest/current', weeklyChestController.getCurrentChest);
router.post('/weekly-chest/claim', weeklyChestController.claimChest);
router.get('/weekly-chest/vault', weeklyChestController.getVault);
router.put('/weekly-chest/targets', weeklyChestController.updateTargets);

module.exports = router;

