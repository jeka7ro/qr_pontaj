const express = require('express');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tenantsRoutes = require('./routes/tenants');
const tenantDashboardRoutes = require('./routes/tenantDashboard');
const scanRoutes = require('./routes/scan');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rute
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/tenant/dashboard', tenantDashboardRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/employee', require('./routes/employee'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'QR Pontaj API is running' });
});

app.get('/api/system/ip', (req, res) => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return res.json({ ip: iface.address });
      }
    }
  }
  res.json({ ip: 'localhost' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
