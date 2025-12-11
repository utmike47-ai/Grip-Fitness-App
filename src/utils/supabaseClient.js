import { createClient } from '@supabase/supabase-js';

// Staging environment credentials
const supabaseUrl = 'https://ccbqajmoqyyytqtkrdau.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYnFham1vcXl5eXRxdGtyZGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzUyNjYsImV4cCI6MjA4MDkxMTI2Nn0.BottHsqKDV_ylXHZ4CiLvvINus9Nomgwvmp8wgJkfek';

export const supabase = createClient(supabaseUrl, supabaseKey);