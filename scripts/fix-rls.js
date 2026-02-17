const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ufsuqflsiezkaqtoevvc.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function fixRLS() {
  console.log('Fixing RLS policies...')
  
  // Use raw SQL via RPC or direct postgres connection
  // For now, let's verify the user can be queried
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'harshilpatel1522@gmail.com')
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('User found:', data)
  }
  
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', 'cdd6e8b3-cdb5-4471-9f1b-2bdd3ef371e0')
  
  if (membersError) {
    console.error('Members error:', membersError)
  } else {
    console.log('Membership:', members)
  }
}

fixRLS()
