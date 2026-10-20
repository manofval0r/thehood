-- A person waiting for approval has no code yet, so there is no hash of one.
--
-- The sign-in path checks the status before it ever looks at the hash, and a
-- pending person is told the code is not the problem, but the column has to
-- allow the row to exist in the first place.

alter table public.staff alter column secret_hash drop not null;

comment on column public.staff.secret_hash is
  'scrypt hash of the code. Null until a super admin approves the person and a code is issued.';
