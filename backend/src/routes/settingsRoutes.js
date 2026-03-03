const express = require('express');
const SettingsController = require('../controllers/settings/SettingsController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', SettingsController.getAll);
router.put('/', SettingsController.updateSettings);

module.exports = router;
