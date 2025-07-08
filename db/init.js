const { initializeDatabase } = require('./index');

(async () => {
  try {
    await initializeDatabase();
    console.log('Database dropped, created, and schema initialized.');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
})(); 