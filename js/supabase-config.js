// supabase-config.js

// 1. You will get these two values from your Supabase Dashboard
// (Go to Project Settings -> API)
const SUPABASE_URL = 'https://atebajfrbqmruqntoqik.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aHPW2wHETJ8eQzQqodD4Jg_CatNVHN9';

// 2. Initialize the Supabase Client
// We use the global 'supabase' object provided by the CDN script we will add to HTML
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase Client Initialized!");
