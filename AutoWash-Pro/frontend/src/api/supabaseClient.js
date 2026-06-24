import { createClient } from '@supabase/supabase-js';

// TODO: Điền URL và Anon Key của bạn vào đây nhé!
const supabaseUrl = 'https://dqkwefcxezdgddobgffv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxa3dlZmN4ZXpkZ2Rkb2JnZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzM1MTUsImV4cCI6MjA5NjQwOTUxNX0.rmJJzJ9GysBrFfvQ-pNtZKaajSC-pjtWR6b7HYGsm90';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
