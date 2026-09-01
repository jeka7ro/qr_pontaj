const { Client, LocalAuth } = require('whatsapp-web.js');

const clients = new Map();
const qrCodes = new Map();
const statuses = new Map();

/**
 * Get or initialize WhatsApp client for a tenant
 */
const getClient = (tenantId) => {
  if (clients.has(tenantId)) {
    return clients.get(tenantId);
  }

  statuses.set(tenantId, 'INITIALIZING');
  
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `tenant-${tenantId}` }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    qrCodes.set(tenantId, qr);
    statuses.set(tenantId, 'QR_READY');
  });

  client.on('ready', () => {
    statuses.set(tenantId, 'CONNECTED');
    qrCodes.delete(tenantId);
  });

  client.on('authenticated', () => {
    statuses.set(tenantId, 'CONNECTED');
    qrCodes.delete(tenantId);
  });

  client.on('disconnected', (reason) => {
    statuses.set(tenantId, 'DISCONNECTED');
    qrCodes.delete(tenantId);
    clients.delete(tenantId);
  });

  client.initialize().catch(err => {
    console.error(`WhatsApp init error for tenant ${tenantId}:`, err);
    statuses.set(tenantId, 'ERROR');
  });

  clients.set(tenantId, client);
  return client;
};

/**
 * Get current status and QR code for a tenant
 */
const getStatus = (tenantId) => {
  // Always trigger initialization if not started
  getClient(tenantId);

  return {
    status: statuses.get(tenantId) || 'INITIALIZING',
    qr: qrCodes.get(tenantId) || null
  };
};

/**
 * Logout and destroy client for a tenant
 */
const logout = async (tenantId) => {
  if (clients.has(tenantId)) {
    const client = clients.get(tenantId);
    try {
      await client.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    
    try {
      await client.destroy();
    } catch (e) {
      console.error('Destroy error:', e);
    }
    
    clients.delete(tenantId);
    qrCodes.delete(tenantId);
    statuses.set(tenantId, 'DISCONNECTED');
  }
};

/**
 * Send a message to a number
 */
const sendMessage = async (tenantId, phoneNumber, message) => {
  if (statuses.get(tenantId) !== 'CONNECTED') {
    throw new Error('WhatsApp client is not connected');
  }
  
  const client = clients.get(tenantId);
  // Format phone number to WhatsApp format (e.g., 40700000000@c.us)
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '4' + cleanNumber; // Basic RO handling, adapt as needed
  } else if (!cleanNumber.startsWith('40') && cleanNumber.length === 9) {
    cleanNumber = '40' + cleanNumber;
  }
  
  const chatId = `${cleanNumber}@c.us`;
  await client.sendMessage(chatId, message);
};

module.exports = {
  getClient,
  getStatus,
  logout,
  sendMessage
};
