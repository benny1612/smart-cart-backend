const express = require('express');
const router = express.Router();
const multer = require('multer');
const { scanReceipt } = require('../controllers/receiptController');

// שימוש בזיכרון במקום בדיסק
const upload = multer({ storage: multer.memoryStorage() });

router.post('/scan', upload.single('receipt'), scanReceipt);

module.exports = router;