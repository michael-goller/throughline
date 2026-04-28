# Comment moderation runbook

Use this runbook when something offensive, sensitive, or wrong shows up in the
viewer feedback layer (reactions/comments/questions on a published deck) and
needs to be hidden quickly.

The viewer can't delete. `instant.perms.ts` blocks anonymous deletes by design
(DIG-120 invariant) and pins immutable fields. The only safe path is to drive
InstantDB with the admin SDK from a laptop you trust — not from a public
endpoint. That's what `scripts/mod-comment.ts` does.

## When to reach for which mode

| Mode | What it does | When to use |
| --- | --- | --- |
| `resolve` | Flips `resolved=true`. Comment hides from PresenterView's open list, replies survive. | Default. Off-topic, duplicate, or already-handled comments. |
| `stub` | Overwrites `text` with a placeholder, also flips `resolved=true`. | Body itself must disappear (PII, profanity, leaked secrets). |
| `delete` | Hard-deletes the row. Replies, position, author all gone. | Last resort — legal/sensitive content where stub isn't enough. Prompts for confirmation unless `--yes`. |

`resolve` and `stub` are non-destructive enough that you can usually undo them
by hand from the InstantDB dashboard if needed. `delete` is permanent.

## Prereqs

1. You're on the laptop that owns the InstantDB app.
2. `template/` has dev deps installed (`npm install` already run).
3. You have these env vars available — either exported in your shell or set in
   `template/.env` (gitignored). Both names work for the app id; the second is
   the same value the Vite client uses, so you can borrow it.

   ```
   INSTANT_APP_ID=<your-instantdb-app-id>          # or VITE_INSTANTDB_APP_ID
   INSTANT_APP_ADMIN_TOKEN=<rotate-from-dashboard-if-leaked>
   ```

   Get / rotate the admin token at https://instantdb.com/dash → your app →
   Admin → tokens. Treat it like a production secret. Never commit it, never
   paste it into a deck or PR description.

## Find the comment id

You almost always have one of:

- **Deck slug** (the part after `/decks/` in the viewer URL). Use `list`:
  ```sh
  cd template
  npx tsx scripts/mod-comment.ts list <deck-slug> --unresolved --limit 30
  ```
  Output is one row per comment: `<status>  <iso-timestamp>  <commentId>  [comment|question]  <author> — <truncated body>`.

- **Direct comment id** (someone forwarded a screenshot from the InstantDB
  dashboard or copied it from the network tab). Skip `list` — go straight to
  `show`.

When in doubt, `show` first to confirm you're touching the right row:

```sh
npx tsx scripts/mod-comment.ts show <commentId>
```

## Hide it

Pick the lightest mode that does the job.

```sh
# 1. Hide from PresenterView's open list (recommended default).
npx tsx scripts/mod-comment.ts resolve <commentId>

# 2. Replace the body with a placeholder, then resolve.
npx tsx scripts/mod-comment.ts stub <commentId>
npx tsx scripts/mod-comment.ts stub <commentId> --text "[redacted — contact LT]"

# 3. Hard delete (asks "y/N?" unless you pass --yes).
npx tsx scripts/mod-comment.ts delete <commentId>
npx tsx scripts/mod-comment.ts delete <commentId> --yes
```

Each command prints what it changed. `stub` echoes the before/after text so
you can sanity-check.

Realtime: anonymous viewers update via InstantDB's live socket. After a
`resolve` / `stub` / `delete`, viewers see the change within a second, no
deploy needed.

## Manual fallback (no admin SDK)

If for some reason you can't run the script (laptop down, token rotated mid
LT-week, npm install rotted), use the dashboard:

1. https://instantdb.com/dash → app → **Explorer** tab → `comments` namespace.
2. Find the row by `id` or filter by `deckId`.
3. Edit `resolved` to `true`, or rewrite `text`, or click delete.

This is "Option C" from [DIG-138](/DIG/issues/DIG-138). Slower, no audit trail
beyond the InstantDB activity log, but always works.

## Audit trail

The script doesn't log to anywhere central. If you want a record:

- Note the commentId, deck slug, action, and reason in the LT incident channel
  before you run the command.
- `show <commentId>` before you mutate is the cheapest way to capture the
  pre-state in your scrollback.

DIG-130 (server-mediated identity) is the long-term fix — once that lands,
moderation can move into the cloud admin route with proper auth + logging.
