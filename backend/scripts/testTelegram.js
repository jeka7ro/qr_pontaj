require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const telegramService = require('../services/telegramService');

async function runTest() {
  console.log('Verificare configurare Telegram...');
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('EROARE: TELEGRAM_BOT_TOKEN sau TELEGRAM_CHAT_ID nu sunt setate in backend/.env');
    console.log('Te rugam sa completezi TELEGRAM_BOT_TOKEN si TELEGRAM_CHAT_ID in backend/.env');
    process.exit(1);
  }

  console.log('Trimitere mesaj de test pe Telegram catre Chat ID:', chatId);
  const result = await telegramService.sendNewAccountAlert({
    companyName: 'Test SRL',
    contactName: 'Test Admin',
    phone: '0712345678',
    email: 'test@exemplu.ro',
    cui: '12345678',
    address: 'Str. Principala 1',
    city: 'Bucuresti',
    county: 'Bucuresti',
    employeesCount: 15,
    planName: 'Standard',
    planPrice: '5.00',
    mode: 'demo',
    subdomain: 'test-demo',
    notes: 'Test verificare notificare Telegram',
    clientIp: '127.0.0.1',
    dpaAccepted: true,
    initialPassword: 'TestPassword123!',
    loginUrl: 'https://test-demo.qr.pontaj.app/admin/login',
    isSuspectDuplicate: false
  });

  if (result.success) {
    console.log('SUCCES: Mesajul a fost livrat pe Telegram! Message ID:', result.messageId);
  } else {
    console.error('EROARE la trimitere:', result.error || result.reason);
  }
}

runTest();
