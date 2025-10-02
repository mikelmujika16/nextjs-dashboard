# Supabase Migration Setup

This guide will help you migrate from PostgreSQL to Supabase for your Next.js dashboard project.

## Steps to Complete the Migration

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Wait for the project to be set up

### 2. Set Up Environment Variables
1. Copy `.env.example` to `.env.local`
2. In your Supabase dashboard, go to Settings > API
3. Copy the following values to your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project API Key (anon key)
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (keep this secret!)

### 3. Create Database Schema
1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `supabase-schema.sql` 
3. Run the SQL script to create all tables, indexes, and security policies

### 4. Test the Seed Route
1. Start your Next.js development server: `pnpm dev`
2. Visit `http://localhost:3000/seed` in your browser
3. You should see: `{"message":"Database seeded successfully"}`
4. Check your Supabase dashboard > Table Editor to verify the data was inserted

## What Changed

### Files Modified:
- `app/seed/route.ts` - Converted from PostgreSQL to Supabase client
- `app/lib/supabase.ts` - New Supabase client configuration

### Files Created:
- `supabase-schema.sql` - Database schema for Supabase
- `.env.example` - Environment variables template

### Dependencies:
- ➕ Added: `@supabase/supabase-js`
- ➖ Removed: `postgres`

## Key Differences from PostgreSQL

1. **Authentication**: Supabase includes built-in authentication
2. **Row Level Security**: Enabled by default for all tables
3. **Real-time**: Supabase supports real-time subscriptions
4. **Dashboard**: Built-in admin dashboard for data management

## Next Steps

After migration, you may want to:
1. Update your data fetching functions in `app/lib/data.ts` to use Supabase
2. Implement Supabase authentication
3. Configure more specific RLS policies based on your needs
4. Set up real-time subscriptions for live data updates

## Troubleshooting

If you encounter errors:
1. Verify environment variables are set correctly
2. Check that the database schema was created successfully
3. Ensure the service role key is being used for the seed route
4. Check the browser console and server logs for error details