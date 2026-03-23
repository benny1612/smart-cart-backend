const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  // הרשימה שהמשתמש עובד עליה כרגע (פרטית או משותפת שאושרה)
  currentList: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ShoppingList' 
  },
  
  // *** השדה החדש: הזמנות ממתינות לאישור ***
  pendingInvitations: [
    {
      listId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ShoppingList' 
      },
      senderName: String,
      senderEmail: String,
      sentAt: { 
        type: Date, 
        default: Date.now 
      }
    }
  ],

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// וודא שאינדקסים נוצרים כראוי לחיפוש מהיר לפי אימייל
userSchema.index({ email: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);