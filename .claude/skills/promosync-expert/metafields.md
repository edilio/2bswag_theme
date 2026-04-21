# PromoSync Metafield Catalog

Authoritative, hardcoded catalog of every Shopify metafield PromoSync writes, reads, or expects. Last refreshed: 2026-04-20 (run `/promosync-refresh` to regenerate).

Source of truth: `/Users/ediliogallardo/projects/edilio/gallardo-corp/playground/promo_sync_app/promo_sync_app/shopify_app/services/metafields.py` and related services.

---

## Namespaces

| Namespace | Owner types | When written |
|-----------|-------------|--------------|
| `psrestful` | Product, ProductVariant | Always — core sync |
| `mm-google-shopping` | Product, ProductVariant | Only when `Shop.enable_google_merchant=true` |
| `my_fields` | Product, ProductVariant | Only when `Shop.is_hit_a_double=true` |

---

## Product-level metafields

### `psrestful.*` (product)

| Key | Type | Purpose | Example |
|-----|------|---------|---------|
| `supplier_code` | `single_line_text_field` | Supplier code | `"PCNA"`, `"SanMar"` |
| `product_id` | `single_line_text_field` | Supplier's product ID | `"B03042000"` |
| `extra_id` | `number_integer` | PromoSync internal product id | `12345` |
| `status` | `single_line_text_field` | Lifecycle status | `"active"`, `"draft"`, `"closeout"`, `"discontinued"` |
| `effective_date` | `date_time` | When product becomes available | `"2025-01-15T00:00:00"` |
| `export` | `boolean` | Export flag | `"true"` / `"false"` |
| `primary_material` | `single_line_text_field` | Main material | `"100% Polyester"` |
| `brand` | `single_line_text_field` | Brand | `"Nike"` |
| `country_of_origin` | `single_line_text_field` | ISO country | `"MX"`, `"USA"` |
| `is_caution` | `boolean` | Has caution warning | `"true"` / `"false"` |
| `caution_comment` | `multi_line_text_field` | Caution text | `"Contains latex."` |
| `line_name` | `single_line_text_field` | Product line | `"Premium Apparel"` |
| `minimum_quantity` | `number_integer` | Minimum order qty | `5`, `25`, `100` |
| `lead_time` | `number_integer` | Lead time in days | `14` |
| `is_on_demand` | `boolean` | On-demand product | `"true"` / `"false"` |
| `is_rush_service` | `boolean` | Rush service available | `"true"` / `"false"` |
| `imprint_size` | `single_line_text_field` | Imprint area size | `"1.5\" x 1.5\""` |
| `price_expires_date` | `date_time` | Price expiry | `"2025-12-31T23:59:59"` |
| `is_hazmat` | `boolean` | Hazmat flag | `"true"` / `"false"` / null |
| `default_set_up_charge` | `single_line_text_field` | Setup fee | `"$50"` or `"50"` |
| `default_run_charge` | `single_line_text_field` | Per-unit run charge | `"$0.25/unit"` |
| `unspsc_commodity_code` | `number_integer` | UNSPSC code | `23101500` |
| `location_decorations` | `json` | Decoration locations + methods | See shape below |
| `features` | `multi_line_text_field` | Feature bullets | `"Water resistant\nUV protected"` |
| `care_instructions` | `multi_line_text_field` | Care instructions | `"Machine wash warm"` |
| `charge_type` | `single_line_text_field` | Charge category | `"Setup"`, `"Run Charge"`, `"Order"` |
| `color-swatches` | linked (metaobject) | Color swatch metaobject GID | `"gid://shopify/Metaobject/123"` |

### `location_decorations` JSON shape

```json
[
  {
    "locationName": "Front Chest",
    "decorations": [
      {
        "decorationName": "Screen Print",
        "maxImprintColors": 10,
        "default": true,
        "priceIncludes": true
      },
      {
        "decorationName": "Embroidery",
        "maxImprintColors": 6,
        "default": false,
        "priceIncludes": false
      }
    ]
  },
  {
    "locationName": "Back",
    "decorations": [
      { "decorationName": "Screen Print", "maxImprintColors": 10, "default": true, "priceIncludes": true }
    ]
  }
]
```

Fields:
- `locationName` — user-facing label (e.g., "Front Chest", "Left Sleeve")
- `decorations[]` — array of methods available at that location
- `decorations[].decorationName` — method name ("Screen Print", "Embroidery", "Laser Engraving", "Full Color", etc.)
- `decorations[].maxImprintColors` — max distinct imprint colors supported
- `decorations[].default` — whether this decoration is pre-selected
- `decorations[].priceIncludes` — whether base product price already includes this decoration (i.e., no surcharge)

### `psrestful.*` (Liquid access)

```liquid
{{ product.metafields.psrestful.minimum_quantity }}
{{ product.metafields.psrestful.location_decorations.value }}  {# array of objects #}
{{ product.metafields.psrestful.supplier_code }}
```

### `mm-google-shopping.*` (product)

Only present when `Shop.enable_google_merchant=true`.

| Key | Type | Purpose | Example |
|-----|------|---------|---------|
| `condition` | `single_line_text_field` | Google condition | `"new"` |
| `google_product_category` | `single_line_text_field` | Taxonomy | `"Apparel & Accessories > Clothing > Shirts & Tops"` |
| `product_type` | `single_line_text_field` | Merchant category | `"T-Shirt"` |
| `brand` | `single_line_text_field` | Brand | `"Nike"` |
| `identifier_exists` | `boolean` | Has GTIN/MPN/brand | `"true"` |
| `adult` | `boolean` | Adult content | `"false"` |
| `age_group` | `single_line_text_field` | `"adult"`, `"kids"`, `"toddler"`, `"infant"`, `"newborn"` | `"adult"` |
| `gender` | `single_line_text_field` | `"male"`, `"female"`, `"unisex"` | `"unisex"` |
| `material` | `single_line_text_field` | Material | `"Cotton"` |
| `pattern` | `single_line_text_field` | Pattern | `"Striped"` |
| `size_type` | `single_line_text_field` | `"regular"`, `"petite"`, `"plus"`, `"tall"`, `"big"`, `"maternity"` | `"regular"` |
| `size_system` | `single_line_text_field` | `"US"`, `"UK"`, `"EU"`, `"DE"`, `"FR"`, `"JP"`, `"CN"`, `"IT"`, `"BR"`, `"MEX"`, `"AU"` | `"US"` |
| `custom_label_0` | `single_line_text_field` | Typically supplier code | `"PCNA"` |
| `custom_label_1` | `single_line_text_field` | Typically line name | `"Premium Apparel"` |
| `custom_label_2` | `single_line_text_field` | Typically main category | `"Shirts"` |
| `custom_label_3` | `single_line_text_field` | Campaign label | user-defined |
| `custom_label_4` | `single_line_text_field` | Campaign label | user-defined |
| `product_detail` | `json` | Structured product details | JSON object |

### `my_fields.*` (product) — Hit a Double multi-location inventory

Only present when `Shop.is_hit_a_double=true`.

| Key | Type | Purpose | Example |
|-----|------|---------|---------|
| `ds_style` | `single_line_text_field` | DropShip style/product id | `"DS12345"` |
| `sm_style` | `single_line_text_field` | SanMar style id | `"SM9876"` |
| `ss_style` | `single_line_text_field` | S&S Activewear style id | `"SS5432"` |
| `cm_style` | `single_line_text_field` | Carolina Made style id | `"CM1111"` |

---

## Variant-level metafields

### `psrestful.*` (variant)

| Key | Type | Purpose | Example |
|-----|------|---------|---------|
| `part_id` | `single_line_text_field` | Supplier part/variant id (SKU) | `"B03042847"` |
| `variant_gtin` | `single_line_text_field` | GTIN/barcode | `"07501172637351"` |
| `part_price_array` | `json` | Volume/tier pricing | See shape below |
| `dimension` | `json` | Width/height/depth/weight + UOMs | See PSRESTful Dimension object |
| `apparel_size` | `json` | Style, label size, custom size | See PSRESTful ApparelSize object |
| `specification_array` | `json` | Product specs (length, chest, etc.) | Array of objects |
| `product_package_array` | `json` | Packaging options | Array of objects |
| `shipping_package_array` | `json` | Master carton / shipping packaging | Array of objects |
| `color_array` | `json` | Available colors with hex codes | Array of objects |

### `part_price_array` JSON shape

```json
[
  { "quantityMin": 1,   "price": 2500 },
  { "quantityMin": 10,  "price": 2200 },
  { "quantityMin": 25,  "price": 2000 },
  { "quantityMin": 50,  "price": 1800 },
  { "quantityMin": 100, "price": 1500 }
]
```

**Critical rules:**
- `price` is in **cents** (2500 = $25.00)
- Tiers are sorted by `quantityMin` ascending
- **Match by iterating all tiers and taking the last one where `cart_quantity >= quantityMin`**
- Use `{{ tier.price | money_without_currency }}` — do not divide by 100 first
- The Shopify Function `quantity-price-breaks` reads this metafield and applies actual discount at checkout

### `mm-google-shopping.*` (variant)

Only present when `Shop.enable_google_merchant=true`.

| Key | Type | Purpose | Example |
|-----|------|---------|---------|
| `gtin` | `single_line_text_field` | Variant GTIN/barcode | `"07501172637351"` |
| `mpn` | `single_line_text_field` | Manufacturer part number | `"B03042847"` |
| `title` | `single_line_text_field` | Google variant title | `"Premium T-Shirt - Black - Large"` |
| `cost_of_goods_sold` | `single_line_text_field` | COGS with currency | `"6.04 USD"` |
| `color` | `single_line_text_field` | Color name | `"Black"`, `"Monterey Sage"` |
| `size` | `single_line_text_field` | Size | `"Large"`, `"2XL"` |
| `item_group_id` | `single_line_text_field` | Group id for variant set | `"product-123-group"` |
| `age_group` | `single_line_text_field` | Age group (if shop opts in) | `"adult"` |
| `gender` | `single_line_text_field` | Gender (if shop opts in) | `"unisex"` |

### `psrestful.*` (variant) — Hit a Double multi-location inventory

Only present when `Shop.is_hit_a_double=true`.

| Key | Type | Purpose |
|-----|------|---------|
| `ProductID_VariantID` | `single_line_text_field` | US Shopify ProductID/VariantID mapping |
| `variant_key` | `single_line_text_field` | DropShip variant/inventory key |
| `variant_sm_key` | `single_line_text_field` | SanMar variant/inventory key |
| `variant_ss_key` | `single_line_text_field` | S&S Activewear variant/inventory key |
| `variant_cm_key` | `single_line_text_field` | Carolina Made variant/inventory key |

---

## Shop-level configuration (feature flags)

These Django model fields on `Shop` control which metafields get written. If a metafield is missing on a store, check the flag.

| Field | Effect |
|-------|--------|
| `enable_google_merchant` | Adds `mm-google-shopping.*` on products and variants |
| `enable_color_swatches` | Creates/links `psrestful.color-swatches` metaobject references |
| `add_default_tier_pricing` | Overrides supplier tier pricing with distributor rules in `psrestful.part_price_array` |
| `add_default_location_decorations` | Augments `psrestful.location_decorations` with default locations/methods |
| `import_minimum_quantity_one` | Forces `psrestful.minimum_quantity = 1` regardless of supplier value |
| `is_hit_a_double` | Adds `my_fields.*` + `psrestful.variant_*_key` multi-location fields |
| `enable_volume_pricing` | Activates the `quantity-price-breaks` Shopify Function |
| `color_metafield_definition_id` | Cached GID of color-swatches metafield definition |
| `color_metaobject_definition_id` | Cached GID of color-swatch metaobject definition |

---

## Write paths (who writes each namespace)

| Writer | Namespace(s) | Trigger |
|--------|--------------|---------|
| `shopify_app/services/importer.py` | all | Product import from PromoStandards |
| `shopify_app/services/metafield_updater.py` | all | Manual update job / admin action |
| `shopify_app/services/color_swatches.py` | `psrestful.color-swatches` | Color metaobject creation |
| `shopify_app/services/decorations.py` | `psrestful.location_decorations` | Decoration import / default application |
| `shopify_app/domain/model/extra.py` | all | Metafield generation during product/variant create |
| `shopify_app/services/helpers/google_merchant.py` | `mm-google-shopping` | Google Merchant field generation |

## Read paths (who reads each namespace)

| Reader | Keys |
|--------|------|
| Theme block `tier-pricing.liquid` | `psrestful.part_price_array` |
| Theme block `location-decorations.liquid` | `psrestful.location_decorations` |
| Theme block `min-quantity-notice.liquid` | `psrestful.minimum_quantity` |
| Theme block `promo-pricing-engine.liquid` (embed) | `psrestful.minimum_quantity`, `psrestful.part_price_array` |
| Theme block `volume-pricing-note.liquid` | `psrestful.part_price_array` |
| Shopify Function `quantity-price-breaks` | `psrestful.part_price_array` |
| `metafield_updater.py` (variant matching) | `psrestful.part_id`, `psrestful.extra_id` |
| Importer (dedupe) | `psrestful.product_id`, `psrestful.supplier_code` |

---

## Example payloads (for GraphQL `metafieldsSet`)

### Variant tier pricing
```json
{
  "ownerId": "gid://shopify/ProductVariant/789012",
  "namespace": "psrestful",
  "key": "part_price_array",
  "type": "json",
  "value": "[{\"quantityMin\":50,\"price\":1250},{\"quantityMin\":100,\"price\":1100}]"
}
```

### Product location decorations
```json
{
  "ownerId": "gid://shopify/Product/123456",
  "namespace": "psrestful",
  "key": "location_decorations",
  "type": "json",
  "value": "[{\"locationName\":\"Front Chest\",\"decorations\":[{\"decorationName\":\"Screen Print\",\"maxImprintColors\":10,\"default\":true,\"priceIncludes\":true}]}]"
}
```

### Product minimum quantity
```json
{
  "ownerId": "gid://shopify/Product/123456",
  "namespace": "psrestful",
  "key": "minimum_quantity",
  "type": "number_integer",
  "value": "25"
}
```
