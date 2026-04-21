# Throughline skills

Drop-in slash commands that run the **Shape** flow inside your terminal AI tool, then hand off to `throughline new --from-brief`.

## Claude Code

```
throughline install claude-skills
```

Installs `shape.md` into `~/.claude/commands/`. Idempotent — re-running skips existing files (`↷ skipped`). Pass `--force` to overwrite, `--dry-run` to preview. Invoke with `/shape` inside Claude Code.

## Gemini CLI

```
throughline install gemini-skills
```

Installs `shape.toml` into `~/.gemini/commands/`. Same flags as above. Invoke with `/shape` inside Gemini CLI.

## What Shape does

Four questions. A tight argument before a single slide:

1. What's your one claim?
2. Who's the audience?
3. What do they currently believe?
4. What's your evidence?

The answers become `.throughline-brief.json`. `throughline new --from-brief` reads the brief, pre-populates the deck's `throughline` field, and maps evidence to slide sections. `throughline check` later verifies the deck still has a throughline statement.
