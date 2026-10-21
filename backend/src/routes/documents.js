const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');
const upload = require('../middleware/upload');

router.post('/upload-document', upload.single('file'), documentsController.uploadDocument);
router.get('/file-content', documentsController.getFileContent);
router.post('/file-info', documentsController.getFileInfo);
router.get('/file-info', documentsController.getFileInfo);
router.post('/open-file', documentsController.openFile);
router.post('/reveal-file', documentsController.revealFile);

module.exports = router;
