const db = require('../db');

async function run() {
  try {
    const leads = await db.query('SELECT id, draft_body FROM sales_leads WHERE draft_body IS NOT NULL');
    let updatedCount = 0;

    for (const row of leads.rows) {
      let body = row.draft_body;
      let changed = false;

      if (body.includes('10 zile')) {
        body = body.split('10 zile').join('15 zile');
        changed = true;
      }

      if (!body.includes('+40 757 77 77 12') && !body.includes('Telefon:')) {
        if (body.includes('Cu respect,\nEchipa Smart QR Pontaj\nhttps://qr.pontaj.app')) {
          body = body.replace(
            'Cu respect,\nEchipa Smart QR Pontaj\nhttps://qr.pontaj.app',
            'Cu respect,\nSmart QR Pontaj\nEmail: contact@pontaj.app\nTelefon / WhatsApp: +40 757 77 77 12\nWeb: https://qr.pontaj.app'
          );
          changed = true;
        } else if (body.includes('Cu respect,\nEchipa QR Pontaj')) {
          body = body.replace(
            'Cu respect,\nEchipa QR Pontaj',
            'Cu respect,\nEchipa QR Pontaj\nEmail: contact@pontaj.app\nTelefon / WhatsApp: +40 757 77 77 12\nWeb: https://qr.pontaj.app'
          );
          changed = true;
        } else if (body.includes('Cu stimă,\nEchipa QR Pontaj')) {
          body = body.replace(
            'Cu stimă,\nEchipa QR Pontaj',
            'Cu stimă,\nEchipa QR Pontaj\nEmail: contact@pontaj.app\nTelefon / WhatsApp: +40 757 77 77 12\nWeb: https://qr.pontaj.app'
          );
          changed = true;
        }

        if (body.includes('ne puteți contacta telefonic.') && !body.includes('la +40 757 77 77 12')) {
          body = body.replace('ne puteți contacta telefonic.', 'ne puteți contacta telefonic la +40 757 77 77 12.');
          changed = true;
        }
      }

      if (changed) {
        await db.query('UPDATE sales_leads SET draft_body = $1, updated_at = NOW() WHERE id = $2', [body, row.id]);
        updatedCount++;
      }
    }

    console.log('Successfully updated existing draft bodies for leads:', updatedCount);
    const sample = await db.query('SELECT id, company_name, draft_body FROM sales_leads WHERE draft_body IS NOT NULL LIMIT 1');
    console.log('Sample updated lead:', sample.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error updating leads:', err);
    process.exit(1);
  }
}

run();
