/**
 * Script to seed admin user
 * Run with: node scripts/seed-admin.js
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ADMIN_EMAIL = 'ranjithkirloskar@gmail.com';
const ADMIN_PASSWORD = 'Sisacropole2198$';
const ADMIN_NAME = 'Admin User';

async function seedAdmin() {
  try {
    console.log('Creating admin user...');

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL);

    let userId;

    if (existingUser) {
      console.log('Admin user already exists, updating...');
      userId = existingUser.id;

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email: ADMIN_EMAIL,
      });
      if (updateError) throw updateError;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_NAME,
          role: 'admin'
        }
      });

      if (createError) throw createError;
      userId = newUser.user.id;
      console.log('Admin user created successfully');
    }

    // Create/update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'admin'
      }, {
        onConflict: 'user_id'
      });

    if (profileError) throw profileError;
    console.log('Profile created/updated');

    // Create/update role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin'
      }, {
        onConflict: 'user_id,role'
      });

    if (roleError) throw roleError;
    console.log('Admin role assigned');

    console.log('\n✅ Admin user seeded successfully!');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`User ID: ${userId}`);

  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();

