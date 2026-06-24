const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '../.env.local');
let envFile = '';
try {
  envFile = fs.readFileSync(envPath, 'utf-8');
} catch (e) {
  console.error('.env.local not found!');
  process.exit(1);
}

const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = 'kboom8002@gmail.com';
  const password = 'narang21';

  console.log(`Setting up super admin user: ${email}`);

  // 1. Create or find user in Auth
  let userId = null;
  
  // List users to check if exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log(`User ${email} already exists in auth. Updating password...`);
    userId = existingUser.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: password,
      email_confirm: true
    });
    if (updateError) {
      console.error('Error updating user password:', updateError);
    }
  } else {
    console.log(`Creating new user ${email}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });
    if (createError) {
      console.error('Error creating user:', createError);
      process.exit(1);
    }
    userId = newUser.user.id;
  }

  console.log(`User ID is ${userId}`);

  // 2. Fetch all workspaces
  const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('id, name');
  if (wsError) {
    console.error('Error fetching workspaces:', wsError);
    process.exit(1);
  }

  console.log(`Found ${workspaces.length} workspaces. Applying owner role...`);

  // 3. Insert or update workspace_memberships
  for (const ws of workspaces) {
    const { error: upsertError } = await supabase
      .from('workspace_memberships')
      .upsert({
        workspace_id: ws.id,
        user_id: userId,
        role: 'owner'
      }, { onConflict: 'workspace_id, user_id' });
    
    if (upsertError) {
      console.error(`Error applying role for workspace ${ws.name}:`, upsertError);
    } else {
      console.log(`SUCCESS: User is now owner of workspace '${ws.name}'`);
    }
  }

  console.log('Admin seeding complete.');
}

main().catch(console.error);
