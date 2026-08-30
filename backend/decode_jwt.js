const jwt = require('jsonwebtoken');
require('dotenv').config();

const decoded = jwt.decode(process.env.SUPABASE_ANON_KEY);
console.log(decoded);
