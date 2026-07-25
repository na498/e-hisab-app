import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // আপনার সুপাবেজ ইউআরএল
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // আপনার সুপাবেজ কি

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);