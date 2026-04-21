---
description: Re-scan the PromoSync repo and regenerate the hardcoded metafield catalog and theme-blocks reference used by the promosync-expert skill.
---

You are refreshing the hardcoded PromoSync catalog used by the `promosync-expert` skill. PromoSync is actively developed, so the skill's reference files can go stale. This command regenerates them from the current state of the PromoSync repo.

## Target files

- `/Users/ediliogallardo/projects/edilio/gallardo-corp/shopify/themes/2bswag_theme/.claude/skills/promosync-expert/metafields.md`
- `/Users/ediliogallardo/projects/edilio/gallardo-corp/shopify/themes/2bswag_theme/.claude/skills/promosync-expert/theme-blocks.md`

## PromoSync repo

`/Users/ediliogallardo/projects/edilio/gallardo-corp/playground/promo_sync_app`

## Procedure

1. **Dispatch an Explore agent** (thoroughness: "very thorough") to produce an exhaustive catalog of every Shopify metafield PromoSync writes, reads, or expects. Instruct it to scan:
   - All Python source in `promo_sync_app/` — grep for `namespace`, `"key":`, `metafield`, `metafields_set`, `metafieldsSet`, `psrestful`, `promosync`, `mm-google-shopping`, `my_fields`.
   - The `docs/` folder — metafield docs are often authoritative there.
   - Shopify extension configs under `promo_sync_app/promo-sync-actions/` — all `shopify.extension.toml` files and extension source (Liquid snippets, GraphQL files, JS).
   - `example.json`, `digital.json`, `hit-a-double-*.txt`, and other data dumps at the repo root.
   - `promo_sync_app/api/` views and serializers.
   - `promo_sync_app/shopify_app/services/` — especially anything with "metafield" or "helper" in the name.

   For each metafield ask for: **namespace, key, owner resource, type, purpose, example value, who writes it, who reads it, source file path + line**. For JSON types include the full structure.

   Also ask the agent to list all PromoSync theme app blocks (in `promo-sync-actions/extensions/`) with block name, purpose, settings, metafields read, and the Shopify Function.

2. **Diff the result against the current catalog.** Read both target files and identify:
   - New metafields (not in current catalog)
   - Removed metafields (in catalog but no longer in repo)
   - Changed types / shapes
   - New theme app blocks or removed ones
   - New Shop feature flags

3. **Regenerate the files.** Preserve the structure and tone of the existing files — they're tuned for the skill. Update the "Last refreshed" date at the top of `metafields.md` to today's date (check from the context — today is given in the system prompt).

   - `metafields.md`: keep the table-per-namespace layout, the shop feature flag table, the write/read path tables, and the example payloads section. Add/remove/update rows to reflect the agent's findings.
   - `theme-blocks.md`: keep the per-block sections (heading, what it displays, metafields read, settings, positioning, when to use). Add/remove blocks to reflect the agent's findings.

4. **Summarize for the user.** Report:
   - Added: <list of new metafields / blocks>
   - Removed: <list of removed items>
   - Changed: <list of items with changed type / shape>
   - Files updated: <file paths>

   Keep the summary under 200 words. If nothing changed, say so explicitly ("No drift detected — catalog is up to date.").

## Notes

- Do NOT rewrite `SKILL.md`, `integration-patterns.md`, or `design-coordination.md` — those are curated and shouldn't change from a refresh.
- If the agent can't find the PromoSync repo, stop and tell the user (perhaps they have it at a different path).
- Run `shopify theme check` is NOT needed — we're only updating skill markdown files.
