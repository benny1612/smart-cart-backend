const fs = require('fs');

exports.scanReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "נא להעלות תמונה" });

    const apiKey = process.env.GEMINI_API_KEY;
    
    // שימוש ב-URL המדויק שעבד לך (v1 עם מודל 2.5-flash)
    // אם אתה מקבל שוב 404, פשוט נחליף ל-v1beta
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Analyze this receipt image. Return ONLY a JSON object:
    {
      "storeName": "string",
      "branchName": "string",
      "items": [{ "name": "string", "price": number }]
    }`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { 
            inline_data: { 
              mime_type: req.file.mimetype, 
              data: req.file.buffer.toString('base64') 
            } 
          }
        ]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // בדיקה אם גוגל החזירה שגיאה בתוך ה-JSON
    if (data.error) {
      console.error("Google API Error:", data.error);
      return res.status(data.error.code || 500).json({ 
        error: "שגיאה מה-API של גוגל", 
        details: data.error.message 
      });
    }

    // חילוץ הטקסט מהמבנה של גוגל
    const responseText = data.candidates[0].content.parts[0].text;
    
    // ניקוי תגיות Markdown של JSON אם קיימות
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    // החזרת הנתונים ללקוח (בלי לשמור עדיין ב-DB, המשתמש יאשר קודם)
    res.json(parsedData);

  } catch (error) {
    console.error("❌ Critical Error:", error.message);
    res.status(500).json({ error: "עיבוד הקבלה נכשל", details: error.message });
  }
};