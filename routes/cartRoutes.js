const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/authMiddleware');

// ניהול מוצרים
router.post('/add', auth, cartController.addToCart);
router.get('/compare', auth, cartController.compareCart);
router.delete('/remove/:productId', auth, cartController.removeFromCart);

// ניהול הזמנות (הפיצ'רים החדשים)
router.post('/invite', auth, cartController.sendInvitation); // שליחת הזמנה
router.post('/accept', auth, cartController.acceptInvitation); // אישור
router.post('/decline', auth, cartController.declineInvitation); // דחייה

// ניהול שותפים
router.delete('/members/:memberId', auth, cartController.removeMember); // הסרה

module.exports = router;