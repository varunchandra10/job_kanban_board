const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');

router.post('/roles', rolesController.addRole);
router.post('/companies', rolesController.addCompany);

module.exports = router;
