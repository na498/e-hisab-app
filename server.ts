import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// MongoDB Connection Setup
const MONGODB_URI = process.env.MONGODB_URI || '';
let isMongoConnected = false;

async function connectMongoDB() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      isMongoConnected = true;
      console.log('✅ Connected to MongoDB Atlas successfully.');
    } catch (err) {
      console.error('⚠️ MongoDB Connection Error:', err);
      isMongoConnected = false;
    }
  } else {
    console.log('ℹ️ MONGODB_URI not set. Application running in browser storage mode + memory fallback.');
  }
}

connectMongoDB();

// Mongoose Schemas & Models
const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: String,
  time: String,
  displayDate: String,
  type: String,
  amount: Number,
  category: String,
  description: String,
  remarks: String,
  customerName: String,
  customerPhone: String,
  cashBalance: Number,
  createdAt: Number,
});

const CustomerDueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  address: String,
  totalDue: Number,
  totalPaid: Number,
  notes: String,
  promiseDate: String,
  lastUpdated: String,
  history: [
    {
      id: String,
      date: String,
      time: String,
      amount: Number,
      type: String, // 'due' | 'payment'
      description: String,
    },
  ],
});

const ShopInfoSchema = new mongoose.Schema({
  shopName: { type: String, default: 'ই-সেন্টার' },
  branchName: { type: String, default: 'চাম্পাফুল' },
  ownerName: { type: String, default: '' },
  managerName: { type: String, default: '' },
  phone: { type: String, default: '০১৮১০৯৫৭৯৫৯' },
  address: { type: String, default: 'উজিরপুর বাজার, চাম্পাফুল, কালিগঞ্জ, সাতক্ষীরা।' },
  storeSlogan: { type: String, default: 'এক ছাদের নিচে সকল ডিজিটাল সেবার বিশ্বস্ত ঠিকানা' },
  storeLogo: { type: String, default: '' },
  contactOffice: { type: String, default: 'উজিরপুর বাজার, চাম্পাফুল, কালিগঞ্জ, সাতক্ষীরা।' },
  contactPhone: { type: String, default: '০১৮১০৯৫৭৯৫৯' },
  contactEmail: { type: String, default: 'info@ecenter.com' },
});

const UserSettingsSchema = new mongoose.Schema({
  pinEnabled: { type: Boolean, default: false },
  pin: { type: String, default: '1234' },
  isLocked: { type: Boolean, default: false },
  adminPhone: { type: String, default: '01810957959' },
  adminPassword: { type: String, default: '01810957959' },
  authEnabled: { type: Boolean, default: true },
  useBengaliDigits: { type: Boolean, default: true },
  dueAlertThresholdDays: { type: Number, default: 30 },
  lowCashAlertThreshold: { type: Number, default: 1000 },
  monthStartDay: { type: Number, default: 1 },
  quickPresets: { type: Array, default: [] },
  customCategories: { type: Array, default: [] },
  hiddenCategories: { type: Array, default: [] },
});

const TransactionModel = mongoose.model('Transaction', TransactionSchema);
const CustomerDueModel = mongoose.model('CustomerDue', CustomerDueSchema);
const ShopInfoModel = mongoose.model('ShopInfo', ShopInfoSchema);
const UserSettingsModel = mongoose.model('UserSettings', UserSettingsSchema);

// Memory fallback cache if Mongo not connected
let inMemoryTransactions: any[] = [];
let inMemoryDues: any[] = [];
let inMemoryShopInfo: any = {
  shopName: 'ই-সেন্টার',
  branchName: 'চাম্পাফুল',
  ownerName: '',
  managerName: '',
  phone: '০১৮১০৯৫৭৯৫৯',
  address: 'উজিরপুর বাজার, চাম্পাফুল, কালিগঞ্জ, সাতক্ষীরা।',
  storeSlogan: 'এক ছাদের নিচে সকল ডিজিটাল সেবার বিশ্বস্ত ঠিকানা',
  storeLogo: '',
  contactOffice: 'উজিরপুর বাজার, চাম্পাফুল, কালিগঞ্জ, সাতক্ষীরা।',
  contactPhone: '০১৮১০৯৫৭৯৫৯',
  contactEmail: 'info@ecenter.com',
};
let inMemorySettings: any = {
  pinEnabled: false,
  pin: '1234',
  isLocked: false,
  adminPhone: '01810957959',
  adminPassword: '01810957959',
  authEnabled: true,
  useBengaliDigits: true,
  dueAlertThresholdDays: 30,
  lowCashAlertThreshold: 1000,
  monthStartDay: 1,
  quickPresets: [],
  customCategories: [],
  hiddenCategories: [],
};

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongoConnected: isMongoConnected,
    timestamp: new Date().toISOString(),
  });
});

// Transactions API
app.get('/api/transactions', async (req, res) => {
  if (isMongoConnected) {
    try {
      const txs = await TransactionModel.find().sort({ createdAt: -1 });
      return res.json(txs);
    } catch (err) {
      return res.status(500).json({ error: 'Database read error' });
    }
  }
  res.json(inMemoryTransactions);
});

app.post('/api/transactions', async (req, res) => {
  const txData = req.body;
  if (isMongoConnected) {
    try {
      if (Array.isArray(txData)) {
        await TransactionModel.deleteMany({});
        if (txData.length > 0) {
          await TransactionModel.insertMany(txData);
        }
      } else if (txData && txData.id) {
        await TransactionModel.findOneAndUpdate({ id: txData.id }, txData, { upsert: true, new: true });
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Database write error' });
    }
  }

  if (Array.isArray(txData)) {
    inMemoryTransactions = txData;
  } else if (txData && txData.id) {
    const index = inMemoryTransactions.findIndex((t) => t.id === txData.id);
    if (index >= 0) inMemoryTransactions[index] = txData;
    else inMemoryTransactions.unshift(txData);
  }
  res.json({ success: true });
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  if (isMongoConnected) {
    try {
      await TransactionModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (err) {
      return res.status(500).json({ error: 'Database delete error' });
    }
  }
  inMemoryTransactions = inMemoryTransactions.filter((t) => t.id !== id);
  res.json({ success: true, id });
});

// Customer Dues API
app.get('/api/dues', async (req, res) => {
  if (isMongoConnected) {
    try {
      const dues = await CustomerDueModel.find();
      return res.json(dues);
    } catch (err) {
      return res.status(500).json({ error: 'Database read error' });
    }
  }
  res.json(inMemoryDues);
});

app.post('/api/dues', async (req, res) => {
  const dueData = req.body;
  if (isMongoConnected) {
    try {
      if (Array.isArray(dueData)) {
        await CustomerDueModel.deleteMany({});
        if (dueData.length > 0) {
          await CustomerDueModel.insertMany(dueData);
        }
      } else if (dueData && dueData.id) {
        await CustomerDueModel.findOneAndUpdate({ id: dueData.id }, dueData, { upsert: true, new: true });
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Database write error' });
    }
  }

  if (Array.isArray(dueData)) {
    inMemoryDues = dueData;
  } else if (dueData && dueData.id) {
    const index = inMemoryDues.findIndex((d) => d.id === dueData.id);
    if (index >= 0) inMemoryDues[index] = dueData;
    else inMemoryDues.push(dueData);
  }
  res.json({ success: true });
});

app.delete('/api/dues/:id', async (req, res) => {
  const { id } = req.params;
  if (isMongoConnected) {
    try {
      await CustomerDueModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (err) {
      return res.status(500).json({ error: 'Database delete error' });
    }
  }
  inMemoryDues = inMemoryDues.filter((d) => d.id !== id);
  res.json({ success: true, id });
});

// Shop Info & Settings API
app.get('/api/shop-info', async (req, res) => {
  if (isMongoConnected) {
    try {
      const info = await ShopInfoModel.findOne();
      return res.json(info || inMemoryShopInfo);
    } catch (err) {
      return res.status(500).json({ error: 'Database read error' });
    }
  }
  res.json(inMemoryShopInfo);
});

app.post('/api/shop-info', async (req, res) => {
  const info = req.body;
  if (isMongoConnected) {
    try {
      await ShopInfoModel.deleteMany({});
      const doc = new ShopInfoModel(info);
      await doc.save();
      return res.json({ success: true, info });
    } catch (err) {
      return res.status(500).json({ error: 'Database write error' });
    }
  }
  inMemoryShopInfo = info;
  res.json({ success: true, info });
});

app.get('/api/settings', async (req, res) => {
  if (isMongoConnected) {
    try {
      const set = await UserSettingsModel.findOne();
      return res.json(set || inMemorySettings);
    } catch (err) {
      return res.status(500).json({ error: 'Database read error' });
    }
  }
  res.json(inMemorySettings);
});

app.post('/api/settings', async (req, res) => {
  const set = req.body;
  if (isMongoConnected) {
    try {
      await UserSettingsModel.deleteMany({});
      const doc = new UserSettingsModel(set);
      await doc.save();
      return res.json({ success: true, settings: set });
    } catch (err) {
      return res.status(500).json({ error: 'Database write error' });
    }
  }
  inMemorySettings = set;
  res.json({ success: true, settings: set });
});

// Clear All Data Endpoint
app.post('/api/clear-all', async (req, res) => {
  if (isMongoConnected) {
    try {
      await TransactionModel.deleteMany({});
      await CustomerDueModel.deleteMany({});
      console.log('🧹 All transactions and dues cleared from MongoDB.');
    } catch (err) {
      console.error('Error clearing Mongo collections:', err);
    }
  }
  inMemoryTransactions = [];
  inMemoryDues = [];
  res.json({ success: true, message: 'All transactions and dues cleared successfully.' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
