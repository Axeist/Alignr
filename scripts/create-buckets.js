import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Get project URL from environment or construct it
const projectRef = 'tkghwmabacbmpfyconyx';
const supabaseUrl = process.env.SUPABASE_URL || `https://${projectRef}.supabase.co`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.log('Please set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
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
  console.log('🚀 Creating storage buckets...\n');

  for (const bucket of buckets) {
    try {
      // Check if bucket already exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`❌ Error listing buckets: ${listError.message}`);
        continue;
      }

      const exists = existingBuckets?.some(b => b.name === bucket.name);
      
      if (exists) {
        console.log(`✅ Bucket "${bucket.name}" already exists, skipping...`);
        continue;
      }

      // Create bucket using REST API directly
      const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey
        },
        body: JSON.stringify(bucket)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Created bucket: ${bucket.name}`);
        console.log(`   - Public: ${bucket.public}`);
        console.log(`   - Size limit: ${bucket.file_size_limit / 1024 / 1024} MB`);
        console.log(`   - MIME types: ${bucket.allowed_mime_types.join(', ')}\n`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to create bucket "${bucket.name}": ${error}\n`);
      }
    } catch (error) {
      console.error(`❌ Error creating bucket "${bucket.name}": ${error.message}\n`);
    }
  }

  console.log('✨ Bucket creation process completed!');
}

createBuckets().catch(console.error);

