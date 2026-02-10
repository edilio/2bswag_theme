# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Shopify theme repository for SwagPath based on the Trade theme (v15.0.1). It contains custom product personalization features including logo upload and decoration selection functionality.

## Development Commands

### Theme Development
```bash
# Start development server with live preview
shopify theme dev

# Validate theme code for errors and best practices
shopify theme check

# Push theme changes to store
shopify theme push

# Pull latest theme from store
shopify theme pull

# List all themes in the store
shopify theme list

# Open theme preview in browser
shopify theme open

# Package theme as zip file
shopify theme package
```

### Common Tasks
```bash
# Start local development with hot reload
shopify theme dev --store=STORE_NAME

# Push only specific files
shopify theme push --only sections/main-product.liquid

# Check for theme issues
shopify theme check --auto-correct
```

## Architecture & Structure

### Core Directories

- **`layout/`** - Main theme layouts (theme.liquid, password.liquid)
- **`templates/`** - JSON templates that define page structures and section order
- **`sections/`** - Reusable sections that can be customized in theme editor
- **`snippets/`** - Reusable Liquid code fragments
- **`assets/`** - CSS, JavaScript, and image files
- **`config/`** - Theme settings and schema definitions
- **`locales/`** - Internationalization files

### Key Customizations

The theme includes custom product personalization features:
- **Logo Upload**: `snippets/upload-logo.liquid` - File upload for custom logos
- **Decoration Selector**: Provided by PromoSync app via theme app block (`PromoSync Decorations`)
- **Custom Buy Buttons**: `snippets/buy-buttons.liquid` - Modified purchase flow

### Important Files

- `sections/main-product.liquid` - Main product page section with personalization features
- `templates/product.json` - Product page template configuration
- `config/settings_schema.json` - Theme customization settings
- `layout/theme.liquid` - Main theme wrapper with global scripts/styles

### Liquid Template System

This theme uses Shopify's Liquid templating language. Key concepts:
- **Objects**: `{{ product.title }}` - Access Shopify data
- **Tags**: `{% if %}...{% endif %}` - Control flow
- **Filters**: `{{ 'asset.css' | asset_url | stylesheet_tag }}` - Transform output
- **Sections**: Dynamic, customizable content blocks
- **Snippets**: Reusable code fragments included with `{% render 'snippet-name' %}`

### PromoSync App Integration

The theme integrates with the PromoSync app for:
- **Volume/Tier Pricing**: Display and calculation of volume-based pricing
- **Location/Decoration Selector**: Theme app block providing cascading dropdowns for product decoration options (uses `psrestful.location_decorations` metafield)
- **Minimum Quantity Enforcement**: Cart validation for minimum order quantities

To add the decoration selector to the product page:
1. Go to **Online Store > Themes > Customize**
2. Navigate to **Product page** template
3. Click **Add block** and search for **PromoSync Decorations**
4. Set **Display mode** to `Dropdown selector`
5. Position after variant picker, before quantity/buy buttons

### Recent Changes (from git status)

Modified files indicate active development on:
- Product page functionality (`sections/main-product.liquid`)
- Purchase flow (`snippets/buy-buttons.liquid`)
- Theme structure (`layout/theme.liquid`)
- Product template (`templates/product.json`)

Personalization features:
- `snippets/upload-logo.liquid` - Logo upload interface

## Development Workflow

1. Use `shopify theme dev` to start local development
2. Changes to Liquid files reflect immediately
3. CSS/JS changes may require page refresh
4. Test across different products and page types
5. Use `shopify theme check` before pushing changes
6. Push to development theme first, test, then push to live

## Testing Considerations

- Test personalization features with various product types
- Verify metafield integrations work correctly
- Check responsive design on mobile devices
- Test checkout flow with custom options
- Validate translations if modifying locale files