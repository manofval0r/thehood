# Forgot Password Plan - Cybersecurity 300L Site

## Problem

Currently, there is no "forgot password" flow. If a staff member loses their code, a super admin must manually reissue one via `/admin`. There is no self-service recovery.

## Requirements

1. A "Forgot code?" link on the admin login page
2. The user enters their name
3. The site looks up their email on file
4. If found, a time-limited reset code is emailed to them
5. They enter the reset code on a reset page
6. They choose a new code
7. The new code is stored and they can sign in

## Implementation Plan

### Database Schema

Add a `password_resets` table:

```sql
create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  staff_id text not null references public.staff(id),
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_resets_staff_idx
  on public.password_resets (staff_id);

create index if not exists password_resets_code_idx
  on public.password_resets (code);
```

### API Routes

1. `POST /api/auth/forgot-password` - Accept email, look up staff, generate reset code, email it
2. `POST /api/auth/reset-password` - Accept code + new code, verify, update staff secret_hash

### Email Service

Use an email service (Resend, SendGrid, or similar) to send the reset code email.

### Security Considerations

- Reset codes expire after 30 minutes
- Rate limit reset requests (max 3 per hour per email)
- Invalidate old reset codes when a new one is requested
- Invalidate the reset code after use
- Log all reset requests for audit

## Implementation Steps

1. Add `password_resets` table migration
2. Create `POST /api/auth/forgot-password` route
3. Create `POST /api/auth/reset-password` route
4. Add "Forgot code?" link to `AdminLogin.tsx`
5. Create `/auth/reset-password` page with form
6. Wire up email sending (Resend or similar)

## Files to Modify

- `src/app/api/auth/forgot-password/route.ts` (new)
- `src/app/api/auth/reset-password/route.ts` (new)
- `src/app/admin/login.tsx` - add forgot password link
- `src/app/auth/reset-password/page.tsx` (new)
- `supabase/migrations/XXXXXXXXXXXX_password_resets.sql` (new)

## Dependencies

- Need an email sending service (Resend, SendGrid, or similar)
- Need email template for the reset code email

## Testing

1. Request reset for existing staff member
2. Check email arrives with code
3. Enter code on reset page
4. Enter new code
5. Sign in with new code
6. Verify old code no longer works
