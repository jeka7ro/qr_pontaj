const { performBackup } = require('../scripts/backup');

let isRunning = false;

async function runScheduledBackup() {
  if (isRunning) return;
  isRunning = true;
  try {
    console.log('[BackupJob] Rulare backup automat planificat...');
    await performBackup();
  } catch (err) {
    console.error('[BackupJob] Eroare la rularea backup-ului automat:', err.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Pornește jobul de backup de 2 ori pe zi (la fiecare 12 ore).
 */
function startBackupJob() {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;

  // Rulăm primul backup la 10 secunde după pornirea serverului dacă nu există un backup recent
  setTimeout(runScheduledBackup, 10000);

  // Interval de 12 ore (2 ori pe zi)
  const timer = setInterval(runScheduledBackup, TWELVE_HOURS);
  console.log('[BackupJob] Jobul de backup automat este activ (de 2 ori pe zi / la fiecare 12 ore).');
  return timer;
}

module.exports = {
  runScheduledBackup,
  startBackupJob
};
