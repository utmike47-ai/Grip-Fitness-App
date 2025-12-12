import { createClient } from '@supabase/supabase-js';

// Production environment credentials
const supabaseUrl = 'https://yylqojwsejfalcvrgmic.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bHFvandzZWpmYWxjdnJnbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MDMwNDMsImV4cCI6MjA3MzQ3OTA0M30.B3InBWeO491didffoD6zTvH7RNIIlU73946tVyu-vEE';

export const supabase = createClient(supabaseUrl, supabaseKey);
