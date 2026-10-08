const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use service_role key if available (bypasses RLS), otherwise fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error('Eroare initializare Supabase:', e);
  }
} else {
  console.warn('Supabase credentials are missing in environment');
}

module.exports = supabase;
