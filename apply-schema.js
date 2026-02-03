const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(connectionString);

async function applySchema() {
  try {
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    await sql.unsafe(schema);
    console.log('Schema applied successfully');
  } catch (error) {
    console.error('Error applying schema:', error);
  }
}

applySchema();
