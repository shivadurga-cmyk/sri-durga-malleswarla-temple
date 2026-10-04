# Sri Sri Sri Durga Malleswarla Ammavari Temple — Mobile Deployment

This folder is the unified deployment package. It contains the public website at `/` and the admin dashboard at `/admin`.

## Before deployment
Edit `config.js` and replace the two placeholders with your Supabase Project URL and Publishable/Anon key. Never use the service-role/secret key.

## Mobile deployment
1. Upload everything inside this folder to a GitHub repository root.
2. Import the repository into Vercel.
3. Deploy with default settings.
4. Public site: your Vercel URL.
5. Admin: your Vercel URL + `/admin`.

## Supabase
The SQL setup has already created the database tables, RLS policies, and `temple-gallery` storage bucket. Your Auth user must also be present in `public.admin_users`.

## Content
Use the admin dashboard to update Temple Info, Events, Announcements, and Gallery. Add only confirmed festival dates.

## Security
The publishable/anon key is intended for browser use when RLS is configured. Never expose the Supabase service-role/secret key.


## CONFIGURATION
Supabase Project URL and publishable key have been configured in config.js.
