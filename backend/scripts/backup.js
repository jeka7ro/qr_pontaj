const fs = require('fs');
const path = require('path');
const db = require('../db');

/**
 * Script de backup automat al bazei de date PostgreSQL pentru TimeQR.
 * Salvează datele complete din toate tabelele în format SQL și JSON.
 */
async function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const sqlFilePath = path.join(backupDir, `backup_${timestamp}.sql`);
  const jsonFilePath = path.join(backupDir, `backup_${timestamp}.json`);

  console.log(`[BACKUP] Incepere backup la ${new Date().toISOString()}...`);

  try {
    // 1. Obținem toate tabelele din schema publică
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`[BACKUP] Găsite ${tables.length} tabele: ${tables.join(', ')}`);

    let sqlContent = `-- TimeQR Database Backup\n-- Data: ${new Date().toISOString()}\n-- Total tabele: ${tables.length}\n\nBEGIN;\n\n`;
    const fullJsonData = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    for (const table of tables) {
      // Obținem rândurile din tabel
      const rowsRes = await db.query(`SELECT * FROM "${table}"`);
      fullJsonData.tables[table] = rowsRes.rows;

      if (rowsRes.rows.length > 0) {
        const columns = Object.keys(rowsRes.rows[0]);
        const colsFormatted = columns.map(c => `"${c}"`).join(', ');

        sqlContent += `-- Tabela: ${table} (${rowsRes.rows.length} randuri)\n`;

        for (const row of rowsRes.rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          sqlContent += `INSERT INTO "${table}" (${colsFormatted}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlContent += '\n';
      }
    }

    sqlContent += 'COMMIT;\n';

    // Salvare fisiere
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    fs.writeFileSync(jsonFilePath, JSON.stringify(fullJsonData, null, 2), 'utf8');

    const sqlStats = fs.statSync(sqlFilePath);
    console.log(`[BACKUP] Backup SQL realizat cu succes: ${sqlFilePath} (${(sqlStats.size / 1024).toFixed(2)} KB)`);
    console.log(`[BACKUP] Backup JSON realizat cu succes: ${jsonFilePath}`);

    // Curatare backup-uri vechi (pastram ultimele 60 de fisiere - echivalent 30 zile)
    cleanOldBackups(backupDir, 60);

    return { success: true, sqlFilePath, jsonFilePath };
  } catch (error) {
    console.error('[BACKUP] Eroare la realizarea backup-ului:', error);
    throw error;
  }
}

function cleanOldBackups(dir, maxFiles) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('backup_') && (f.endsWith('.sql') || f.endsWith('.json')))
      .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxFiles * 2) {
      const toDelete = files.slice(maxFiles * 2);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(dir, file.name));
        console.log(`[BACKUP] Sters backup vechi: ${file.name}`);
      }
    }
  } catch (err) {
    console.warn('[BACKUP] Nu s-au putut sterge backup-urile vechi:', err.message);
  }
}

// Rulare directa daca este apelat din terminal
if (require.main === module) {
  performBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { performBackup };
