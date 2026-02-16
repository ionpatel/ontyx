#!/usr/bin/env node
/**
 * Run SQL migration against Supabase
 * Usage: node run-migration.js [migration-file]
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ufsuqflsiezkaqtoevvc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmc3VxZmxzaWV6a2FxdG9ldnZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIwNTExNiwiZXhwIjoyMDg2NzgxMTE2fQ.OXH-8E0VUmaaAVRUiE7jYf912QlFfSDpHWazvZq4G8g';

async function runMigration(filePath) {
  console.log(`Running migration: ${filePath}`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Split by semicolons but handle CREATE FUNCTION blocks
  const statements = [];
  let current = '';
  let inFunction = false;
  
  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('--')) continue; // Skip comments
    
    current += line + '\n';
    
    if (trimmed.match(/^CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i)) {
      inFunction = true;
    }
    
    if (inFunction && trimmed.match(/\$\$;?\s*$/)) {
      // End of function
      statements.push(current.trim());
      current = '';
      inFunction = false;
    } else if (!inFunction && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  
  if (current.trim()) statements.push(current.trim());
  
  // Use Supabase pg endpoint (unofficial but works)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ sql })
  });

  // Actually, we need to use the Supabase SQL query endpoint
  // Let's try the management API
  const PROJECT_REF = 'ufsuqflsiezkaqtoevvc';
  
  // Run each statement via the REST endpoint
  for (const stmt of statements) {
    if (!stmt || stmt.length < 5) continue;
    
    console.log(`Executing: ${stmt.substring(0, 50)}...`);
    
    // We'll need to use Supabase Management API or Dashboard
    // For now, output instructions
  }
  
  console.log('\n✅ Migration SQL file ready!');
  console.log('\nTo apply this migration:');
  console.log('1. Go to: https://supabase.com/dashboard/project/ufsuqflsiezkaqtoevvc/sql');
  console.log('2. Paste the contents of:', filePath);
  console.log('3. Click "Run"');
  console.log('\nOr use Supabase CLI: npx supabase db push');
}

const migrationFile = process.argv[2] || 'supabase/migrations/00005_setup_user_org_rpc.sql';
runMigration(migrationFile).catch(console.error);
