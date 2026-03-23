const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// הרשמה
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // בדיקה אם המשתמש קיים
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'המשתמש כבר קיים במערכת' });

    // הצפנת סיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ email, password: hashedPassword, name });
    await user.save();

    // יצירת טוקן
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name } });

  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת ברישום' });
  }
};

// התחברות
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'פרטים שגויים' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'פרטים שגויים' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת בהתחברות' , 
    error: err.message});
  }
};