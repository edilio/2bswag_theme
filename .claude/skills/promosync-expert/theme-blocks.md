# PromoSync Theme App Blocks

PromoSync ships theme app blocks in the `promo-storefront-widgets` extension. Merchants add them through **Online Store → Themes → Customize** without editing Liquid. This doc covers each block, what it reads, settings, and best positioning.

Extension path in PromoSync repo: `promo_sync_app/promo-sync-actions/extensions/promo-storefront-widgets/`

---

## 1. PromoSync Pricing Engine (embed) — `promo-pricing-engine`

**Type:** Theme app embed block (not visible, runs theme-wide JS)

**What it does:** Foundation block. Wires up client-side logic (`MinQuantityHandler`, `TierPricingHandler`) that listens to variant-change events and quantity input changes. Other PromoSync blocks may depend on it being present.

**Metafields read:**
- `product.metafields.psrestful.minimum_quantity` — enforces HTML5 `min` on qty input; prevents submit below minimum
- `variant.metafields.psrestful.part_price_array` — provides tier data to JS

**Settings:** Typically none beyond enable/disable.

**Positioning:** Enable as a theme app **embed** in the theme editor (not a block on a specific section). It runs site-wide.

**When to use:** Always enable if using any other PromoSync behavior — it's the substrate.

---

## 2. Tier Pricing Block — `tier-pricing`

**What it displays:** Volume pricing table (quantity → per-unit price).

**Metafields read:**
- `variant.metafields.psrestful.part_price_array`

**Snippet dependencies:** `tier-pricing-data.liquid`, `tier-pricing-table.liquid`, `tier-pricing-horizontal.liquid`

**JS:** `tier-pricing.js` — re-renders on variant change.

**Settings:**
- Display mode: collapsible / horizontal table / compact
- Heading text
- Show "save X%" column (optional)

**Positioning:** Product page, near or under the price block, before quantity input.

**When to use:** Product pages for any PromoSync product with non-trivial volume breaks. Skip if all variants have flat pricing.

---

## 3. Location Decorations Block — `location-decorations`

**What it displays:** Lets the shopper pick **where** on the product to add a decoration (e.g., "Front Chest") and **which method** (e.g., "Screen Print"). Selections flow into cart as line item properties.

**Metafields read:**
- `product.metafields.psrestful.location_decorations`

**Snippet dependencies:** `location-decorations.liquid`

**Settings:**
- **Display mode:**
  - `Dropdown selector` — cascading dropdowns (Location → Decoration). Recommended for product pages with variant-like UX.
  - `Collapsible sections` — accordion per location, each showing available decorations as read-only info.
- Location label / placeholder
- Decoration label / placeholder
- Whether selection is required

**Output on add-to-cart (line item properties):**
- `properties[Location]` — selected `locationName`
- `properties[Decoration]` — selected `decorationName`
- Optionally `properties[Max Imprint Colors]`, `properties[Price Includes]`

**Positioning:** Product page, **after** the variant picker, **before** quantity input and buy buttons.

**Install steps (from theme CLAUDE.md):**
1. Online Store → Themes → Customize
2. Navigate to **Product page** template
3. Click **Add block** → search **PromoSync Decorations**
4. Set **Display mode** to `Dropdown selector`
5. Position after variant picker, before quantity/buy buttons

**When to use:** Any decorated product. Skip for blank/undecorated SKUs.

---

## 4. Minimum Quantity Notice — `min-quantity-notice`

**What it displays:** Small informational banner: "Minimum order: N units."

**Metafields read:**
- `product.metafields.psrestful.minimum_quantity`

**Settings:** Typically only text customization (e.g., "Minimum order of {n} required").

**Positioning:** Product page, near quantity input OR above the buy buttons.

**When to use:** Products with `minimum_quantity > 1`. The **embed block** also enforces the minimum on the input — this block is the user-facing notice.

**Note:** Enforcement happens in `MinQuantityHandler` (part of the embed block). This block is just the visual notice. Both should typically be enabled together.

---

## 5. Volume Pricing Note — `volume-pricing-note`

**What it displays:** Informational call-out about volume pricing availability ("Save more when you buy in bulk").

**Metafields read:**
- `variant.metafields.psrestful.part_price_array` (to detect if tiers exist)

**Settings:** Heading, body text.

**Positioning:** Product page, above tier pricing table OR in a sidebar.

**When to use:** When you want a visual teaser pointing to the tier table. Often paired with the Tier Pricing block. Skip if tier table already has its own heading.

---

## 6. Star Rating — `star_rating`

**What it displays:** Star review rating (integrates with Shopify reviews / third-party apps).

**Metafields read:** None from PromoSync directly — uses standard `product.metafields.reviews.*` or similar.

**When to use:** Optional; not PromoSync-specific. Mentioned here for completeness because it ships in the same extension.

---

## Shopify Function: `quantity-price-breaks`

**Not a block** — but a companion extension that the blocks rely on.

**Type:** `purchase.product-discount.run` Shopify Function

**What it does:** At checkout, iterates cart lines, reads `variant.metafield(namespace: "psrestful", key: "part_price_array")`, finds the best matching tier for each line's quantity, and applies a per-unit discount equal to `variant.price - tier.price`. Uses `discountApplicationStrategy: "ALL"`.

**Requires:**
- App scope: `write_discounts`
- Shop feature flag: `enable_volume_pricing = true`

**Implication for theme work:** The theme **does not** apply the discount itself; it only shows the discounted price so the customer sees their savings before checkout. The adjusted cart total in `main-cart-footer.liquid` is visual only. The real discount appears at checkout.

---

## Recommended product-page stack

For a typical decorated promo product, enable (in order, top → bottom on the rendered page):

1. **PromoSync Pricing Engine** (embed — enables substrate)
2. Variant picker (Shopify default)
3. **PromoSync Decorations** (`Dropdown selector` mode)
4. **Minimum Quantity Notice**
5. Quantity input (Shopify default — handler enforces min)
6. **Tier Pricing Block** (or **Volume Pricing Note** + tier table)
7. Buy buttons

---

## Troubleshooting checklist

| Symptom | Check |
|---------|-------|
| Tier table empty | `variant.metafields.psrestful.part_price_array` has values; storefront access enabled on metafield definition |
| Decoration dropdown missing options | `product.metafields.psrestful.location_decorations` populated; block `Display mode` is `Dropdown selector` |
| Min qty not enforced | Pricing Engine embed enabled; `minimum_quantity > 1` on product; no other JS overriding the input's `min` |
| Discount not applied at checkout | Shop `enable_volume_pricing=true`; app has `write_discounts` scope; discount function deployed and active |
| Tier prices showing wrong magnitude ($0.25 instead of $25) | Using `money_without_currency` filter directly on tier.price (correct), not dividing by 100 first (wrong) |
| Cart total doesn't match product page tier | `main-cart-footer.liquid` not running the adjusted-total calculation; cart requires refresh after AJAX qty change |
