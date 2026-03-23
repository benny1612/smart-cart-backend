const express = require('express');
const router = express.Router();
const { updatePrices, searchProducts } = require('../controllers/productController');

// נתיב לעדכון מחירים מקבלה מאושרת (נשאר ללא שינוי)
router.post('/confirm-receipt', updatePrices);

/**
 * שינוי כאן: החלפנו את '/search' ב-'/'
 * עכשיו הכתובת המלאה תהיה: GET /api/products?search=...
 * וזה יתאים בדיוק לקריאה מהפרונטנד.
 */
router.get('/', searchProducts); 

module.exports = router;