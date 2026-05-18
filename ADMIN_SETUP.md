# Admin Module Setup

The admin feature uses the existing Supabase project, plus:

- one SQL migration for admin, subscription, payment, and test-paper tables
- one Supabase Edge Function named `admin-api`
- the React routes `/admin/login` and `/admin/dashboard`

## Deploy backend pieces

1. Apply the SQL migration in `supabase/migrations/20260517160000_admin_module.sql`.
2. Deploy the Edge Function in `supabase/functions/admin-api`.
3. Make sure the function has the default Supabase environment secrets available:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Admin account

Create the admin account in Supabase Auth with the agreed admin email and password if it does not already exist.
The migration seeds `adminspp@datawiz.com` in `public.admin_users`, so the first successful login links that Auth user to the admin record automatically.

The password is intentionally not stored in the React app or repository.
