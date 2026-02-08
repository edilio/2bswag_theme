# PromoSync Volume Pricing Integration

This document explains how to integrate and use PromoSync volume/tier pricing in your Shopify theme using the `variant.metafields.psrestful.part_price_array` metafield.

## Overview

PromoSync stores volume pricing tiers in a variant metafield that contains an array of price breaks. This allows you to display quantity-based discounts throughout your store (product pages, cart, cart drawer) even when Shopify's native quantity price breaks are not available.

## Metafield Structure

The pricing data is stored in:

```
variant.metafields.psrestful.part_price_array
```

### Data Format

The metafield contains a JSON array of price tier objects:

```json
[
  { "quantityMin": 1, "price": 2500 },
  { "quantityMin": 10, "price": 2200 },
  { "quantityMin": 25, "price": 2000 },
  { "quantityMin": 50, "price": 1800 },
  { "quantityMin": 100, "price": 1500 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `quantityMin` | Integer | Minimum quantity to qualify for this tier |
| `price` | Integer | Price in cents (e.g., 2500 = $25.00) |

**Important:** Tiers are ordered by `quantityMin` ascending. When matching a quantity, iterate through all tiers and use the last one where `quantity >= quantityMin`.

## Implementation Guide

### 1. Accessing the Metafield in Liquid

```liquid
{%- assign ps_price_breaks = variant.metafields.psrestful.part_price_array.value -%}
```

### 2. Finding the Matched Tier Price

To find the correct tier price for a given quantity:

```liquid
{%- liquid
  assign ps_price_breaks = item.variant.metafields.psrestful.part_price_array.value
  assign matched_tier_price = nil

  if ps_price_breaks.size > 0
    for tier in ps_price_breaks
      if item.quantity >= tier.quantityMin
        assign matched_tier_price = tier.price
      endif
    endfor
  endif
-%}
```

### 3. Displaying Volume Pricing in Cart

Show the tier price when it's lower than the original price:

```liquid
{%- liquid
  assign has_tier_discount = false
  if matched_tier_price and matched_tier_price < item.original_price
    assign has_tier_discount = true
    assign tier_line_total = matched_tier_price | times: item.quantity
  endif
-%}

{%- if has_tier_discount -%}
  <div class="cart-item__discounted-prices">
    <s class="cart-item__old-price product-option">
      {{- item.original_price | money -}}
    </s>
    <strong class="cart-item__final-price product-option">
      ${{ matched_tier_price | money_without_currency }}
    </strong>
  </div>
{%- else -%}
  <!-- Show regular price -->
  <span class="price">{{ item.original_price | money }}</span>
{%- endif -%}
```

### 4. Displaying Volume Pricing Popover

Show all available tiers in a popover (falls back to PromoSync when Shopify native breaks are empty):

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
    <!-- Render Shopify native quantity_price_breaks -->
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

### 5. Calculating Adjusted Cart Total

Since Shopify Functions apply discounts only at checkout, you need to calculate the tier-adjusted total in the cart:

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

### 6. Product Page JavaScript Integration

For dynamic variant switching on product pages, store all variant price breaks in a data attribute:

```liquid
{% assign variant_price_breaks = '{' %}
{% for variant in product.variants %}
  {% assign pb = variant.metafields.psrestful.part_price_array.value | json %}
  {% assign variant_price_breaks = variant_price_breaks
    | append: '"'
    | append: variant.id
    | append: '":'
    | append: pb
  %}
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

Then in JavaScript:

```javascript
// On variant change
function updateVariantPricing(newVariant) {
  const priceBreaks = document.querySelector("#variant-data");
  const data = JSON.parse(priceBreaks.getAttribute("data-variants-price-breaks"));
  const metafield = data[newVariant.id];

  if (metafield && metafield.length > 0) {
    // Update volume pricing display
    renderVolumePricing(metafield);
  }
}
```

## Files Modified for This Feature

| File | Purpose |
|------|---------|
| `sections/main-cart-items.liquid` | Cart page item pricing display and volume popover |
| `snippets/cart-drawer.liquid` | Cart drawer item pricing display and volume popover |
| `sections/main-cart-footer.liquid` | Adjusted cart total calculation |
| `sections/main-product.liquid` | Product page volume pricing display |

## Important Notes

1. **Price Format:** Prices in the metafield are stored in cents. Use `money_without_currency` filter directly on `tier.price` - do not divide by 100 first as the filter handles the conversion.

2. **Tier Matching Logic:** Always iterate through all tiers and keep the last match where `quantity >= quantityMin`. Tiers are ordered ascending, so the last match is the best price.

3. **Checkout Discount:** The actual discount is applied by a Shopify Function at checkout. The cart display is purely visual to show customers their expected savings.

4. **Fallback Behavior:** Check for Shopify's native `quantity_price_breaks` first, then fall back to PromoSync data if native breaks are empty.

5. **Currency Display:** When displaying adjusted prices, use the format `${{ price | money_without_currency }} {{ cart.currency.iso_code }}` for consistency.

## Troubleshooting

### Prices showing incorrectly (e.g., $0.25 instead of $25.00)

The `money_without_currency` filter expects cents. Don't divide by 100 before applying the filter:

```liquid
<!-- Correct -->
${{ tier.price | money_without_currency }}

<!-- Incorrect - causes double conversion -->
{%- assign tier_price_dollars = tier.price | divided_by: 100.0 -%}
${{ tier_price_dollars | money_without_currency }}
```

### Volume pricing not showing in cart

Ensure the metafield is accessible. Check that:
1. The variant has the `psrestful.part_price_array` metafield populated
2. The metafield definition allows storefront access
3. The array contains valid tier objects with `quantityMin` and `price` fields

### Cart total doesn't match tier pricing

The adjusted total calculation runs server-side in Liquid. If items are added via AJAX, the cart may need to refresh to show updated totals. Consider implementing a cart refresh after quantity changes.
