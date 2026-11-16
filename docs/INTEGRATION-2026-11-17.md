# Olympiad integration review — 2026-11-17

## Sources and scope

Baseline: `d8fd3cc` (`main`). Integrated source heads: `b1382c0` (mobile),
`ac3fd08` (olympiads, including `726d480` and `03f56b7`), `de63f4f` (archive).
The backend branch is already an ancestor of baseline. No existing branch is deleted.
The project ZIP is removed from the resulting tree; historical commits remain intact.
Its only source variation from `03f56b7` is a hardcoded “published” card label
(and line endings), superseded by the typed status rendering.

## Review and corrections

- Fixed broken rich editor type export and public-card lint violations.
- Replaced duplicate public card and inline styles with one typed CSS-module section.
- Unified create/edit/copy forms; copies get unique slugs and default to hidden drafts.
  Optional dates/capacity remain null when editing unrelated fields; same-day events work.
- Participant management uses named user/olympiad selectors and validates scores/URLs.
- Sanitized stored, pasted, saved and public HTML with DOMPurify; restricted rich links.
  No custom HTML parser was introduced. See [DOMPurify](https://github.com/cure53/DOMPurify).
- Fixed directly reproduced auth-profile loading race that redirected an authenticated
  administrator away from a direct admin URL before their profile arrived.
- Added separate forward SQL migration, preserving legacy stage data and existing content.
  Removed production sample upserts. Added publication RLS and role-column protection
  against self-promotion through the otherwise permissive existing profiles policies.
- Added regression tests and CI; repaired clean installation lockfile and updated
  compatible dependency versions to address advisories without forced major upgrades.
- Changed `db:reset` to local-only; documented that the destructive initial migration
  must never be replayed on an existing database. Interactive login explicitly uses
  `--agent no --output-format text` to avoid auto-detected JSON mode.

## Verification

Local clean `npm ci`, build, lint and strict API typecheck pass. The browser suite
contains 16 scenarios; Node tests contain 5 cases, including actual PostgreSQL/RLS
execution using isolated PGlite databases. SQL coverage includes legacy and partially
upgraded schemas, preserved records, reproduced self-promotion before the fix,
rejected escalation after it, user/admin/service writes, publication privacy,
participant privacy, uniqueness, date order and score/capacity constraints.

A separate read-only reviewer independently ran build, lint and all 5 Node tests,
and found no remaining source blockers after fixes. Browser mocks establish frontend
behavior, not a real Supabase signup or live administrative workflow.

`npm audit --omit=dev` reports zero vulnerabilities. Full audit retains 10 advisories
in development tooling (including the Vercel type/tool dependency chain); the suggested
forced changes include incompatible major changes. These are not declared resolved.

## Production verification

The effective production backend was verified from the deployed JavaScript at
`https://finathlon.vercel.app`: project `obwmhbpkkcxaimmbfogg` (owner's `finathlon`).
The ZIP contains a different project's configuration (`frdrbtuyrronizwobrmi`);
it was not used as production authority and no records were copied from it.
Production initially had the three baseline migrations recorded and no olympiad tables.

After authenticated access, `db push --dry-run --skip-vault` proposed exactly the
two new migrations. `db push --skip-vault` applied them and migration-history readback
confirmed versions `20261109130000` and `20261117000000`. Effective columns, enabled
role trigger and function, and publication RLS were read back. Both new tables are
empty; no example events or participant records were published.

Full-row aggregate fingerprints and counts of all 13 existing application tables
matched before and after migration. A live permission probe used one explicit
BEGIN/ROLLBACK transaction under `authenticated`, with matching auth.uid() for an
ordinary user. Own-role promotion was rejected with exactly SQLSTATE 42501 and
`Only administrators can assign roles`. The transaction was rolled back and all
13 original fingerprints were compared again. No user or content record was changed.
The protocol was separately reviewed before execution.

The frontend retains legacy-schema compatibility and a read-only fallback for a
missing upgrade. Column readiness alone is not proof of security policy installation;
the explicit production readback and live rejection above establish it for this release.
NOT VALID constraints protect new writes while retaining any historical invalid rows.
GitHub CI on source commit `13f4203` passed clean install, build, lint, API types,
unit/SQL tests, production dependency audit and all 16 browser scenarios. Vercel's
preview status for the same commit succeeded. Main publication and hosting status
must be verified separately after merge.

This integration includes event/result administration and informational public cards.
There is no automated per-olympiad enrollment or test engine in the source branches.
The public CTA honestly opens the account instead of claiming to start a test.

## Scoped lesson

A successful Git merge does not establish backend compatibility or identity: here
`ac3fd08` edited a table-creation migration and the ZIP pointed at a different project
than the deployed site. Verify the effective production URL and recorded migrations,
use forward changes, and gate incompatible writes. Existing own-row RLS also does
not protect an admin role column. Sources: the branch commits, deployed asset, remote
migration/schema readback, forward migration and `tests/unit/database.test.mjs`.
