# PromoSync Integration Patterns

Battle-tested Liquid and JS snippets for reading PromoSync metafields in theme code. Use these when the theme-provided app blocks don't fit (custom UI, cart-level logic, JSON endpoints, etc.).

Reference implementation files in this theme:
- `sections/main-cart-items.liquid` — cart line pricing + volume popover
- `snippets/cart-drawer.liquid` — drawer pricing + volume popover
- `sections/main-cart-footer.liquid` — adjusted cart total
- `sections/main-product.liquid` — product-page volume pricing display
- `docs/PROMOSYNC_VOLUME_PRICING.md` — longer walkthrough

---

## Volume pricing (`psrestful.part_price_array`)

### Match a tier for a given quantity

```liquid
{%- liquid
  assign ps_price_breaks = variant.metafields.psrestful.part_price_array.value
  assign matched_tier_price = nil

  if ps_price_breaks.size > 0
    for tier in ps_price_breaks
      if target_quantity >= tier.quantityMin
        assign matched_tier_price = tier.price
      endif
    endfor
  endif
-%}
```

Rules:
- `price` is in **cents** — render with `{{ matched_tier_price | money_without_currency }}`, never divide by 100.
- Tiers are ascending; the **last** match wins.
- `ps_price_breaks` is a Liquid array of objects (the `.value` filter unwraps the JSON metafield).

### Cart line: show discounted unit price when tier matched

```liquid
{%- liquid
  assign ps_breaks = item.variant.metafields.psrestful.part_price_array.value
  assign matched_tier_price = nil
  if ps_breaks.size > 0
    for tier in ps_breaks
      if item.quantity >= tier.quantityMin
        assign matched_tier_price = tier.price
      endif
    endfor
  endif

  assign has_tier_discount = false
  if matched_tier_price and matched_tier_price < item.original_price
    assign has_tier_discount = true
  endif
-%}

{%- if has_tier_discount -%}
  <div class="cart-item__discounted-prices">
    <s class="cart-item__old-price product-option">{{ item.original_price | money }}</s>
    <strong class="cart-item__final-price product-option">
      ${{ matched_tier_price | money_without_currency }}
    </strong>
  </div>
{%- else -%}
  <span class="price">{{ item.original_price | money }}</span>
{%- endif -%}
```

### Volume pricing popover (falls back to PromoSync when Shopify native is empty)

```liquid
{%- liquid
  assign has_vol_pricing = false
  if item.variant.quantity_price_breaks.size > 0
    assign has_vol_pricing = true
  endif

  assign psrestful_price_breaks = item.variant.metafields.psrestful.part_price_array.value
  if psrestful_price_breaks.size > 0 and has_vol_pricing == false
    assign has_vol_pricing = true
  endif
-%}

{%- if has_vol_pricing -%}
  {%- if item.variant.quantity_price_breaks.size > 0 -%}
    {%- comment -%} Shopify native breaks {%- endcomment -%}
  {%- elsif psrestful_price_breaks.size > 0 -%}
    <volume-pricing class="parent-display">
      <ul class="list-unstyled">
        {%- for tier in psrestful_price_breaks -%}
          <li>
            <span>{{ tier.quantityMin }}<span aria-hidden="true">+</span></span>
            <span>${{ tier.price | money_without_currency }}/ea</span>
          </li>
        {%- endfor -%}
      </ul>
    </volume-pricing>
  {%- endif -%}
{%- endif -%}
```

### Adjusted cart total (visual; real discount applied at checkout)

Use this in `main-cart-footer.liquid`. The Shopify Function applies the actual discount at checkout; this just shows the tier-adjusted total in the cart.

```liquid
{%- liquid
  assign adjusted_total = 0
  for item in cart.items
    assign ps_breaks = item.variant.metafields.psrestful.part_price_array.value
    assign tier_match = nil

    if ps_breaks.size > 0
      for tier in ps_breaks
        if item.quantity >= tier.quantityMin
          assign tier_match = tier.price
        endif
      endfor
    endif

    if tier_match and tier_match < item.original_price
      assign item_total = tier_match | times: item.quantity
    else
      assign item_total = item.final_line_price
    endif

    assign adjusted_total = adjusted_total | plus: item_total
  endfor
-%}

<div class="totals">
  <h2 class="totals__total">{{ 'sections.cart.estimated_total' | t }}</h2>
  {%- if adjusted_total != cart.total_price -%}
    <p class="totals__total-value">${{ adjusted_total | money_without_currency }} {{ cart.currency.iso_code }}</p>
  {%- else -%}
    <p class="totals__total-value">{{ cart.total_price | money_with_currency }}</p>
  {%- endif -%}
</div>
```

### Product page: pass all variants' tiers to JS for dynamic switching

```liquid
{% assign variant_price_breaks = '{' %}
{% for variant in product.variants %}
  {% assign pb = variant.metafields.psrestful.part_price_array.value | json %}
  {% assign variant_price_breaks = variant_price_breaks
      | append: '"' | append: variant.id | append: '":' | append: pb %}
  {% unless forloop.last %}
    {% assign variant_price_breaks = variant_price_breaks | append: ',' %}
  {% endunless %}
{% endfor %}
{% assign variant_price_breaks = variant_price_breaks | append: '}' %}

<div id="variant-data"
     data-variant-id="{{ current_variant.id }}"
     data-variants-price-breaks="{{ variant_price_breaks | escape }}">
</div>
```

```js
function updateVariantPricing(newVariant) {
  const el = document.querySelector("#variant-data");
  const data = JSON.parse(el.getAttribute("data-variants-price-breaks"));
  const tiers = data[newVariant.id];
  if (tiers && tiers.length > 0) renderVolumePricing(tiers);
}

function matchTier(tiers, qty) {
  let best = null;
  for (const t of tiers) if (qty >= t.quantityMin) best = t;
  return best;
}
```

---

## Minimum quantity (`psrestful.minimum_quantity`)

### Read in Liquid

```liquid
{%- assign min_qty = product.metafields.psrestful.minimum_quantity | default: 1 -%}
<input
  type="number"
  name="quantity"
  min="{{ min_qty }}"
  value="{{ min_qty }}"
  step="1">
```

### Show a notice above the quantity input

```liquid
{%- if product.metafields.psrestful.minimum_quantity and product.metafields.psrestful.minimum_quantity > 1 -%}
  <p class="product__min-qty-notice">
    Minimum order: {{ product.metafields.psrestful.minimum_quantity }} units
  </p>
{%- endif -%}
```

### Enforcement

The PromoSync Pricing Engine embed block (`MinQuantityHandler`) enforces the minimum on the input client-side. If you're building a custom quantity component, replicate that logic:

```js
const min = parseInt(inputEl.dataset.min || "1", 10);
inputEl.addEventListener("change", () => {
  if (parseInt(inputEl.value, 10) < min) inputEl.value = min;
});
```

---

## Location decorations (`psrestful.location_decorations`)

### Read in Liquid

```liquid
{%- assign loc_decos = product.metafields.psrestful.location_decorations.value -%}
{%- if loc_decos.size > 0 -%}
  {%- for loc in loc_decos -%}
    <h3>{{ loc.locationName }}</h3>
    <ul>
      {%- for deco in loc.decorations -%}
        <li>
          {{ deco.decorationName }}
          {%- if deco.maxImprintColors %} (up to {{ deco.maxImprintColors }} colors){%- endif -%}
          {%- if deco.priceIncludes %} — included{%- else %} — additional charge{%- endif -%}
        </li>
      {%- endfor -%}
    </ul>
  {%- endfor -%}
{%- endif -%}
```

### Cascading dropdowns → cart line item properties

The recommended pattern is to use the **PromoSync Decorations** theme app block with Display mode = `Dropdown selector`. If you must build it yourself:

```liquid
<select name="properties[Location]" required>
  <option value="">Select location</option>
  {%- for loc in product.metafields.psrestful.location_decorations.value -%}
    <option value="{{ loc.locationName | escape }}">{{ loc.locationName }}</option>
  {%- endfor -%}
</select>

<select name="properties[Decoration]" required disabled>
  <option value="">Select decoration</option>
</select>
```

```js
// Expose the full structure to JS
const locationData = {{ product.metafields.psrestful.location_decorations.value | json }};

locationSelect.addEventListener("change", () => {
  const loc = locationData.find(l => l.locationName === locationSelect.value);
  decorationSelect.innerHTML = '<option value="">Select decoration</option>';
  if (!loc) { decorationSelect.disabled = true; return; }
  for (const d of loc.decorations) {
    const opt = document.createElement("option");
    opt.value = d.decorationName;
    opt.textContent = d.decorationName +
      (d.maxImprintColors ? ` (${d.maxImprintColors} colors)` : "") +
      (d.priceIncludes ? "" : " — additional charge");
    if (d.default) opt.selected = true;
    decorationSelect.appendChild(opt);
  }
  decorationSelect.disabled = false;
});
```

The values end up as `properties[Location]` and `properties[Decoration]` on cart lines, visible in admin and order confirmations. Preserve them through cart templates.

---

## Supplier / brand / classification metafields

```liquid
{%- assign supplier = product.metafields.psrestful.supplier_code -%}
{%- assign brand = product.metafields.psrestful.brand -%}
{%- assign material = product.metafields.psrestful.primary_material -%}
{%- assign lead_time = product.metafields.psrestful.lead_time -%}

{%- if lead_time -%}
  <p class="product__lead-time">Ships in ~{{ lead_time }} business days</p>
{%- endif -%}
```

---

## Cautions and compliance flags

```liquid
{%- if product.metafields.psrestful.is_caution -%}
  <div class="product__caution" role="alert">
    {{ product.metafields.psrestful.caution_comment | newline_to_br }}
  </div>
{%- endif -%}

{%- if product.metafields.psrestful.is_hazmat -%}
  <span class="badge badge--hazmat">Hazardous material</span>
{%- endif -%}
```

---

## Debugging tips

1. **Metafield returns nothing?** Check that storefront access is enabled on the metafield definition in Shopify admin. PromoSync may write the value, but `product.metafields.*` won't expose it to the storefront unless the definition allows it.
2. **Use `| json` in Liquid to dump a value to HTML for inspection:** `<script>window.__ps_debug = {{ product.metafields.psrestful.location_decorations.value | json }};</script>`
3. **Check write status via admin:** `Products → [product] → Metafields` — should show `psrestful.*` entries.
4. **`.value` matters for JSON metafields:** `product.metafields.psrestful.location_decorations` (raw metafield object) vs `.value` (parsed JSON). Always use `.value` to iterate.
5. **Run `shopify theme check` after every Liquid change.**
