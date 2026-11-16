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

## Production and remaining work

Live read-only schema probe confirmed that `olympiads` exists but `format` does not.
The Supabase CLI initially had no account access. Until the forward migration is
applied, both new admin pages disable writes and display a read-only notice. Public
reads support the original schema. Column readiness is not proof that the security
trigger/RLS migration was applied; only the database readback can establish that.

After Supabase login: inspect remote migration history and schema, apply only the
reviewed additive upgrade (never the initial reset migration), then verify columns,
policies, role trigger and unchanged record counts. NOT VALID constraints preserve
historical invalid rows and enforce new writes; validation of old data is separate.

This integration includes event/result administration and informational public cards.
There is no automated per-olympiad enrollment or test engine in the source branches.
The public CTA honestly opens the account instead of claiming to start a test.

## Scoped lesson

A successful Git merge does not establish release compatibility: here `ac3fd08`
edited a table-creation migration, while the effective database retained the schema
from `726d480`. Preserve forward migrations, verify the live columns, and gate writes
until compatible. Likewise, existing own-row RLS is insufficient to protect an admin
role column. Sources: the two commits, the live schema probe, the forward migration
and `tests/unit/database.test.mjs`.
