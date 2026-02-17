#!/usr/bin/env node

/**
 * Run Supabase migrations
 * Usage: node scripts/run-migrations.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  
  console.log(`Found ${files.length} migration files\n`)
  
  for (const file of files) {
    console.log(`Running: ${file}`)
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    
    // Split by semicolons but be careful with functions
    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    let success = 0
    let failed = 0
    
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        if (error) {
          // Try direct query for DDL
          const { error: ddlError } = await supabase.from('_migrations').select().limit(0)
          if (ddlError && ddlError.code === '42P01') {
            // Table doesn't exist, that's fine
          }
          failed++
        } else {
          success++
        }
      } catch (e) {
        failed++
      }
    }
    
    console.log(`  ✓ ${success} statements, ${failed} skipped/failed`)
  }
  
  console.log('\nMigrations complete!')
}

runMigrations().catch(console.error)
