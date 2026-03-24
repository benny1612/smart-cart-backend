const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. הגדרות CORS מורחבות (למניעת בעיות Authorization)
app.use(cors({
origin: [
    'http://localhost:5173', 
    'https://smart-cart-frontend-chi.vercel.app' // הכתובת החדשה שקיבלת!
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. לוגר בסיסי (כדי לראות כל בקשה שמגיעה לשרת בטרמינל)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// חיבור למסד הנתונים
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// נתיב בדיקה
app.get('/', (req, res) => {
  res.send('Smart Receipts API is running...');
});

// 3. הגדרת הנתיבים (Routes)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));

// 4. Middleware לטיפול בשגיאות גלובלי (אם משהו קורס, שהשרת לא ייפול בלי הודעה)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'משהו השתבש בשרת', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
});