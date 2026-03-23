const Product = require('../models/Product');
const Branch = require('../models/Branch');

// --- 1. עדכון מחירים מקבלה ---
exports.updatePrices = async (req, res) => {
  try {
    const { storeName, branchName, items } = req.body;

    let branch = await Branch.findOne({ chain: storeName, name: branchName });
    if (!branch) {
      branch = new Branch({ chain: storeName, name: branchName });
      await branch.save();
    }

    const branchId = branch._id.toString();

    const updatePromises = items.map(async (item) => {
      return Product.findOneAndUpdate(
        { name: item.name },
        { 
          $set: { [`prices.${branchId}`]: item.price }, 
          lastUpdated: Date.now()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    await Promise.all(updatePromises);
    res.json({ message: "הנתונים עודכנו בהצלחה!", branchId });
  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ message: "שגיאה בשמירת הנתונים", error: error.message });
  }
};

// --- 2. חיפוש מוצרים (התיקון כאן!) ---
exports.searchProducts = async (req, res) => {
  try {
    // שינוי מ-q ל-search כדי להתאים לקריאה מהפרונטנד
    const { search } = req.query; 

    // אם אין מחרוזת חיפוש, נחזיר מערך ריק מיד
    if (!search || search.trim() === "") {
      return res.json([]);
    }

    // חיפוש ב-DB
    const products = await Product.find({
      name: { $regex: search, $options: 'i' } // 'i' אומר לא רגיש לאותיות גדולות/קטנות
    }).limit(10); 

    res.json(products);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ message: "שגיאה בחיפוש מוצרים" });
  }
};