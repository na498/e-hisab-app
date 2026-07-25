import dotenv from "dotenv";

dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Supabase Connection Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Supabase URL or Anon Key is missing in .env file!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Default Fallback Data for Shop Info and Settings
const defaultShopInfo = {
  shopName: 'ই-সেন্টার',
  branchName: 'চাম্পাফুল',
  ownerName: 'মালিকের নাম',
  managerName: 'দোকান পরিচালকের নাম',
  phone: '০১৮১০৯৫৭৯৫৯',
  address: 'উজিরপুর বাজার, চাম্পাফুল, কালিগঞ্জ, সাতক্ষীরা।',
  storeSlogan: 'এক ছাদের নিচে সবল ডিজিটাল সেবার বিশ্বস্ত ঠিকানা',
  storeLogo: '',
  contactOffice: 'উজিরপুর বাজার, চাম্পাফুল, কালিগঞ্জ, সাতক্ষীরা।',
  contactPhone: '০১৮১০৯৫৭৯৫৯',
  contactEmail: 'masumbillah10032002@gmail.com',
};

const defaultSettings = {
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
    supabaseConnected: !!supabaseUrl,
    timestamp: new Date().toISOString(),
  });
});

// Transactions API (Connected to Supabase 'accounts' table)
app.get('/api/transactions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data || []);
  } catch (err: any) {
    console.error('Database read error:', err.message);
    return res.status(500).json({ error: 'Database read error' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const txData = req.body;
  try {
    if (Array.isArray(txData)) {
      // Clear and re-insert if sending full array
      await supabase.from('accounts').delete().neq('id', 0);
      if (txData.length > 0) {
        await supabase.from('accounts').insert(txData);
      }
    } else if (txData) {
      await supabase.from('accounts').upsert(txData);
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Database write error:', err.message);
    return res.status(500).json({ error: 'Database write error' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Database delete error' });
  }
});

// Customer Dues API
app.get('/api/dues', async (req, res) => {
  try {
    const { data, error } = await supabase.from('dues').select('*');
    if (error) return res.json([]);
    return res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/dues', async (req, res) => {
  const dueData = req.body;
  try {
    if (Array.isArray(dueData)) {
      await supabase.from('dues').delete().neq('id', '0');
      if (dueData.length > 0) await supabase.from('dues').insert(dueData);
    } else if (dueData && dueData.id) {
      await supabase.from('dues').upsert(dueData);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Database write error' });
  }
});

app.delete('/api/dues/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await supabase.from('dues').delete().eq('id', id);
    return res.json({ success: true, id });
  } catch (err) {
    return res.status(500).json({ error: 'Database delete error' });
  }
});

// Shop Info & Settings API
app.get('/api/shop-info', (req, res) => {
  res.json(defaultShopInfo);
});

app.post('/api/shop-info', (req, res) => {
  res.json({ success: true, info: req.body });
});

app.get('/api/settings', (req, res) => {
  res.json(defaultSettings);
});

app.post('/api/settings', (req, res) => {
  res.json({ success: true, settings: req.body });
});

// Clear All Data Endpoint
app.post('/api/clear-all', async (req, res) => {
  try {
    await supabase.from('accounts').delete().neq('id', 0);
    await supabase.from('dues').delete().neq('id', '0');
  } catch (err) {
    console.error('Error clearing Supabase data:', err);
  }
  res.json({ success: true, message: 'All data cleared successfully.' });
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