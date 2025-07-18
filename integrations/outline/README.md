# Outline Integration Notes

## Auth Requirements
- Header injection: `X-User-Email`, `X-User-Id`
- JWT validation from master dashboard

## Proxy Rules
- Path: `/outline/*` → Outline container
- Headers: Inject after Supabase auth 