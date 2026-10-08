# Sector audit and isolation tests

Local Python tools, separate from the app. No routes, schema, UI, reports, PDFs or production write behavior are modified. Run with Python and `requests` in a trusted environment. Credentials must come from environment variables; never commit them or put them into audit output.

Required environment: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_PUBLISHABLE_KEY`). These are available in the managed execution environment; Cloud users do not need to obtain private keys.

## Commands

```sh
python -m unittest discover -s scripts/audit -p 'test_*.py' -v
python scripts/audit/sector_audit.py --output /tmp/ccb-audit/read-only.json
python scripts/audit/isolation_test.py --output /tmp/ccb-audit/isolation-run
python scripts/audit/sector_audit.py --attempts /tmp/ccb-audit/isolation-run/attempts.json --output /tmp/ccb-audit/combined.json
```

Use a new output directory per run. Output may contain personal record information: keep it private and outside served/project files. No credentials, authentication headers, passwords or tokens are written. `manifest.json` contains only exact temporary IDs, for identifying leftovers if the process is forcibly terminated. Do not delete records by a broad prefix.

The auditor only reads application tables, pages through all rows, and reports sector mismatches in both attendance tables. It never changes records. Existing events without a sector are reported as legacy warnings, not automatically repaired.

Rejected requests do not persist as attendance rows. This tool detects them from sanitized captured evidence (`attempts.json`). It does **not** provide continuous monitoring of all live user attempts. Existing attendance rows do not identify the creating user or the sector at creation, so a present-day mismatch is a possible historical sector change or bypass—not proof of bypass. Fully consistent bypass writes cannot be inferred from existing data alone. No logging trigger or change to application write paths is introduced.

The integration test creates fresh sectors, houses (including one without a sector), a function, one event and one temporary authenticated collaborator with global house access. Attendance writes use that user's validated token, not privileged writes. The service key is used only for test setup, read verification and exact-ID cleanup. The event starts with zero attendance and is never shared with another test.

Acceptance checks include valid insert, cross-sector and sectorless rejection with HTTP 400 and the sector-specific exception, unchanged counts after each rejection, sector change, preserved historical row, and valid new insertion under the new sector. Final cleanup removes all attendance associated with the exact run-owned event, including any unexpectedly accepted invalid write, and deletes only run-owned fixtures/account. All fields of all existing application records are compared before/after. Concurrent real writes cause REPROVADO rather than being ignored or undone. Failures are never automatically repaired; cleanup still runs and exit status is nonzero.

Run during a quiet period. Abrupt machine shutdown or forced termination can prevent `finally` cleanup; use the manifest for manual exact-ID review. Do not interpret an interrupted or incomplete run as APROVADO.