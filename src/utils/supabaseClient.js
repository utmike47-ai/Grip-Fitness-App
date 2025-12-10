import { createClient } from '@supabase/supabase-js';

// Staging environment credentials
const supabaseUrl = 'https://ccbqajmoqyyytqtkrdau.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYnFham1vcXl5eXRxdGtyZGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3OTY5OTQsImV4cCI6MjA0OTM3Mjk5NH0.sb_publishable_8uX1ApDiSQGBj2KlUfaIUg_deZkUZMoqFKaZCTfnY';

export const supabase = createClient(supabaseUrl, supabaseKey);