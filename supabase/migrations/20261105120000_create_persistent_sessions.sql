create table if not exists public.student_sessions (
  session_hash text primary key,
  student_id text not null,
  sii_token_ciphertext text not null,
  sii_token_iv text not null,
  csrf_token_ciphertext text not null,
  csrf_token_iv text not null,
  csrf_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists student_sessions_expires_at_idx
  on public.student_sessions (expires_at);

alter table public.student_sessions enable row level security;
revoke all on table public.student_sessions from anon, authenticated;
grant all on table public.student_sessions to service_role;

comment on table public.student_sessions is
  'Sesiones opacas del SII; acceso exclusivo desde Edge Functions con service role.';
