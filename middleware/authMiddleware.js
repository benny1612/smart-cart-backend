const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  // הדפסה לצורך דיבאג - זה יופיע בטרמינל של השרת
  console.log("Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "גישה נחסמה - טוקן חסר" });
  }

  // הפיצול בין המילה Bearer לטוקן עצמו
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.log("Token verification failed:", err.message);
    res.status(401).json({ message: "טוקן לא תקף" });
  }
};