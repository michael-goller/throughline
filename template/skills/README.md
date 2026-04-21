# Throughline skills

Drop-in slash commands that run the **Shape** flow inside your terminal AI tool, then hand off to `throughline new --from-brief`.

## Claude Code

```
cp template/skills/claude/shape.md .claude/commands/shape.md
```

Invoke with `/shape` inside Claude Code. The command runs the four Shape questions, writes `.throughline-brief.json`, and runs `throughline new <name> --from-brief`.

## Gemini CLI

```
cp template/skills/gemini/shape.toml .gemini/commands/shape.toml
```

Invoke with `/shape` inside Gemini CLI.

## What Shape does

Four questions. A tight argument before a single slide:

1. What's your one claim?
2. Who's the audience?
3. What do they currently believe?
4. What's your evidence?

The answers become `.throughline-brief.json`. `throughline new --from-brief` reads the brief, pre-populates the deck's `throughline` field, and maps evidence to slide sections. `throughline check` later verifies the deck still has a throughline statement.
