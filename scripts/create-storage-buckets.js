/**
 * Script to create all required storage buckets for Alignr
 * 
 * Usage:
 *   node scripts/create-storage-buckets.js
 * 
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 * Get it from: https://supabase.com/dashboard/project/tkghwmabacbmpfyconyx/settings/api
 */

import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'tkghwmabacbmpfyconyx';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('\n📝 To get your service role key:');
  console.log(`   1. Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api`);
  console.log('   2. Copy the "service_role" key (keep it secret!)');
  console.log('   3. Run: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-storage-buckets.js\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const buckets = [
  {
    name: 'resumes',
    public: true,
    file_size_limit: 10485760, // 10 MB
    allowed_mime_types: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  {
    name: 'career-reports',
    public: true,
    file_size_limit: 5242880, // 5 MB
    allowed_mime_types: ['text/html']
  },
  {
    name: 'avatars',
    public: true,
    file_size_limit: 2097152, // 2 MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    name: 'logos',
    public: true,
    file_size_limit: 1048576, // 1 MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/svg+xml']
  }
];

async function createBuckets() {
  console.log('🚀 Creating storage buckets for Alignr...\n');

  // First, list existing buckets
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    process.exit(1);
  }

  const existingNames = existingBuckets?.map(b => b.name) || [];

  for (const bucket of buckets) {
    try {
      if (existingNames.includes(bucket.name)) {
        console.log(`⏭️  Bucket "${bucket.name}" already exists, skipping...`);
        continue;
      }

      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.file_size_limit,
        allowedMimeTypes: bucket.allowed_mime_types
      });

      if (error) {
        // Check if it's a "bucket already exists" error
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⏭️  Bucket "${bucket.name}" already exists, skipping...`);
        } else {
          console.error(`❌ Failed to create bucket "${bucket.name}":`, error.message);
        }
      } else {
        console.log(`✅ Created bucket: ${bucket.name}`);
        console.log(`   - Public: ${bucket.public}`);
        console.log(`   - Size limit: ${(bucket.file_size_limit / 1024 / 1024).toFixed(1)} MB`);
        console.log(`   - MIME types: ${bucket.allowed_mime_types.join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ Error creating bucket "${bucket.name}":`, error.message);
    }
    console.log('');
  }

  // Verify all buckets exist
  console.log('🔍 Verifying buckets...');
  const { data: finalBuckets, error: verifyError } = await supabase.storage.listBuckets();
  
  if (verifyError) {
    console.error('❌ Error verifying buckets:', verifyError.message);
  } else {
    const createdNames = finalBuckets?.map(b => b.name) || [];
    const requiredNames = buckets.map(b => b.name);
    const missing = requiredNames.filter(name => !createdNames.includes(name));
    
    if (missing.length === 0) {
      console.log('✅ All required buckets are created!');
      console.log('\n📦 Created buckets:');
      requiredNames.forEach(name => console.log(`   ✓ ${name}`));
    } else {
      console.log('⚠️  Some buckets are missing:');
      missing.forEach(name => console.log(`   ✗ ${name}`));
    }
  }
}

createBuckets().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

