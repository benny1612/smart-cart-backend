const User = require('../models/User');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const ShoppingList = require('../models/ShoppingList');

/**
 * פונקציית עזר: מוצאת או יוצרת רשימה למשתמש
 */
const getOrCreateList = async (userId) => {
  let user = await User.findById(userId);
  if (user.currentList) {
    const list = await ShoppingList.findById(user.currentList);
    if (list) return list;
  }

  const newList = new ShoppingList({
    owner: userId,
    members: [userId],
    name: `הרשימה של ${user.name}`
  });
  
  await newList.save();
  user.currentList = newList._id;
  await user.save();
  return newList;
};

// --- 1. הוספה לסל ---
exports.addToCart = async (req, res) => {
  try {
    const { productId, name, quantity } = req.body;
    const list = await getOrCreateList(req.userId);
    
    let finalProductId = productId;
    if (!finalProductId && name) {
      const product = await Product.findOneAndUpdate(
        { name: name.trim() }, { name: name.trim() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      finalProductId = product._id;
    }

    const itemIndex = list.items.findIndex(item => item.productId?.toString() === finalProductId.toString());
    if (itemIndex > -1) {
      list.items[itemIndex].quantity += (Number(quantity) || 1);
    } else {
      list.items.push({ productId: finalProductId, quantity: Number(quantity) || 1 });
    }

    await list.save();
    res.json(list.items);
  } catch (error) {
    res.status(500).json({ message: "שגיאה בעדכון הרשימה" });
  }
};

// --- 2. השוואת מחירים + החזרת הזמנות ממתינות ---
exports.compareCart = async (req, res) => {
  try {
    const list = await getOrCreateList(req.userId);
    const user = await User.findById(req.userId); 
    
    await list.populate('items.productId');
    await list.populate('members', 'name email'); 

    const branches = await Branch.find();
    const comparison = branches.map(branch => {
      let total = 0;
      let missingCount = 0;
      const branchId = branch._id.toString();
      
      const itemsDetail = list.items.map(item => {
        const product = item.productId;
        if (!product) return null;
        const price = product.prices?.get(branchId) || 0;
        if (price === 0) missingCount++;
        else total += (price * item.quantity);

        return {
          productId: product._id,
          name: product.name,
          quantity: item.quantity,
          pricePerUnit: price.toFixed(2),
          subtotal: (price * item.quantity).toFixed(2),
          isMissing: price === 0
        };
      }).filter(i => i !== null);

      return {
        branchId: branch._id,
        branchName: branch.name,
        chain: branch.chain,
        items: itemsDetail,
        totalBasket: total.toFixed(2),
        missingCount,
        members: list.members
      };
    });

    res.json({ 
      comparison, 
      pendingInvitations: user.pendingInvitations || [] 
    });
  } catch (error) {
    res.status(500).json({ message: "שגיאה בחישוב השוואה" });
  }
};

// --- 3. מחיקת מוצר מהרשימה (הפונקציה שהייתה חסרה!) ---
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const list = await getOrCreateList(req.userId);
    
    list.items = list.items.filter(item => 
      item.productId && item.productId.toString() !== productId
    );
    
    await list.save();
    res.json({ message: "המוצר הוסר מהרשימה", cart: list.items });
  } catch (error) {
    res.status(500).json({ message: "שגיאה במחיקת המוצר" });
  }
};

// --- 4. שליחת הזמנת שיתוף ---
exports.sendInvitation = async (req, res) => {
  try {
    const { email } = req.body;
    const sender = await User.findById(req.userId);
    const cleanEmail = email.toLowerCase().trim();

    const friend = await User.findOne({ email: cleanEmail });
    if (!friend) return res.status(404).json({ message: "משתמש לא נמצא במערכת" });

    const list = await getOrCreateList(req.userId);
    if (list.members.some(m => m.toString() === friend._id.toString())) {
      return res.status(400).json({ message: "המשתמש כבר שותף ברשימה זו" });
    }

    const alreadyInvited = friend.pendingInvitations.some(inv => inv.listId.toString() === list._id.toString());
    if (alreadyInvited) return res.status(400).json({ message: "כבר נשלחה הזמנה למשתמש זה" });

    friend.pendingInvitations.push({
      listId: list._id,
      senderName: sender.name,
      senderEmail: sender.email
    });

    await friend.save();
    res.json({ message: "הזמנה נשלחה בהצלחה! השותף יצטרך לאשר אותה." });
  } catch (error) {
    res.status(500).json({ message: "שגיאה בשליחת הזמנה" });
  }
};

// --- 5. אישור הזמנה ומיזוג רשימות ---
exports.acceptInvitation = async (req, res) => {
  try {
    const { listId } = req.body;
    const user = await User.findById(req.userId);
    const newList = await ShoppingList.findById(listId);

    if (!newList) return res.status(404).json({ message: "הרשימה כבר אינה קיימת" });

    if (user.currentList && user.currentList.toString() !== listId) {
      const oldList = await ShoppingList.findById(user.currentList);
      if (oldList && oldList.items.length > 0) {
        oldList.items.forEach(oldItem => {
          const index = newList.items.findIndex(i => i.productId?.toString() === oldItem.productId?.toString());
          if (index > -1) newList.items[index].quantity += oldItem.quantity;
          else newList.items.push(oldItem);
        });
        if (oldList.members.length <= 1) await ShoppingList.findByIdAndDelete(oldList._id);
      }
    }

    if (!newList.members.includes(user._id)) newList.members.push(user._id);
    await newList.save();

    user.currentList = newList._id;
    user.pendingInvitations = user.pendingInvitations.filter(inv => inv.listId.toString() !== listId);
    await user.save();

    res.json({ message: "הצטרפת לרשימה המשותפת!" });
  } catch (error) {
    res.status(500).json({ message: "שגיאה באישור הזמנה" });
  }
};

// --- 6. דחיית הזמנה ---
exports.declineInvitation = async (req, res) => {
  try {
    const { listId } = req.body;
    const user = await User.findById(req.userId);
    user.pendingInvitations = user.pendingInvitations.filter(inv => inv.listId.toString() !== listId);
    await user.save();
    res.json({ message: "ההזמנה נדחתה" });
  } catch (error) {
    res.status(500).json({ message: "שגיאה בדחיית הזמנה" });
  }
};

// --- 7. הסרת שותף מהרשימה ---
exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const list = await getOrCreateList(req.userId);

    if (memberId === list.owner.toString()) return res.status(400).json({ message: "לא ניתן להסיר את הבעלים" });

    list.members = list.members.filter(id => id.toString() !== memberId);
    await list.save();

    const removedUser = await User.findById(memberId);
    if (removedUser) {
      removedUser.currentList = null; 
      await removedUser.save();
    }
    res.json({ message: "השותף הוסר" });
  } catch (error) {
    res.status(500).json({ message: "שגיאה בהסרת שותף" });
  }
};