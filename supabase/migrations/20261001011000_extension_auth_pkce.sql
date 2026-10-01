-- Strengthen the Chrome extension authorization-code exchange with a PKCE-style
-- verifier so access does not depend on the Origin header from an extension service worker.
delete from public.extension_auth_codes;

alter table public.extension_auth_codes
  add column if not exists code_challenge text;

alter table public.extension_auth_codes
  alter column code_challenge set not null;

alter table public.extension_auth_codes
  drop constraint if exists extension_auth_codes_code_challenge_format;

alter table public.extension_auth_codes
  add constraint extension_auth_codes_code_challenge_format
  check (code_challenge ~ '^[A-Za-z0-9_-]{43}$');

comment on column public.extension_auth_codes.code_challenge is
  'Base64url SHA-256 challenge for the single-use extension authorization code.';
