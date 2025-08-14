# Language System Usage Guide

## Overview
The language switching system has been successfully implemented in your inventory management app with support for Myanmar (မြန်မာ) and English.

## Features
- **Modern Toggle Design**: Sleek language switcher with flag icons
- **Persistent Storage**: Language preference saved in localStorage
- **Smooth Animations**: Beautiful transitions and hover effects
- **Accessibility**: Proper ARIA labels and keyboard support
- **Reactive Updates**: All text updates immediately when language changes

## Components Created

### 1. Language Store (`/src/lib/stores/language.ts`)
- Manages current language state
- Handles localStorage persistence
- Provides translation functions

### 2. Language Switcher (`/src/lib/components/LanguageSwitcher.svelte`)
- Modern toggle switch design
- Myanmar and English flags
- Hover tooltips
- Smooth animations

## How to Use

### In Components
```svelte
<script>
  import { currentLanguage, translate } from '../stores/language';
</script>

<!-- Reactive text that updates when language changes -->
<h1>{translate('dashboard.title', $currentLanguage)}</h1>
<button>{translate('common.save', $currentLanguage)}</button>
```

### Adding New Translation Keys
Edit `/src/lib/stores/language.ts` and add to both `my` and `en` objects:

```typescript
export const translations = {
  my: {
    // ... existing translations
    'new.key': 'မြန်မာစာ',
  },
  en: {
    // ... existing translations  
    'new.key': 'English Text',
  }
};
```

## Available Translation Keys

### Navigation
- `nav.dashboard` - Dashboard / ခြုံငုံကြည့်ရှုမှု
- `nav.inventory` - Inventory / ကုန်ပစ္စည်း
- `nav.pos` - Point of Sale / အရောင်းစနစ်
- `nav.reports` - Reports / အစီရင်ခံစာ

### Common Actions
- `common.search` - Search / ရှာဖွေရန်
- `common.add` - Add / ထည့်ရန်
- `common.edit` - Edit / ပြင်ဆင်ရန်
- `common.delete` - Delete / ဖျက်ရန်
- `common.save` - Save / သိမ်းဆည်းရန်
- `common.cancel` - Cancel / ပယ်ဖျက်ရန်

### Inventory Management
- `inventory.title` - Inventory Management / ကုန်ပစ္စည်း စီမံခန့်ခွဲမှု
- `inventory.addItem` - Add Item / ကုန်ပစ္စည်းထည့်ရန်
- `inventory.itemName` - Item Name / ပစ္စည်းအမည်
- `inventory.price` - Price / ဈေးနှုန်း
- `inventory.stock` - Stock / လက်ကျန်

### Status Messages
- `inventory.available` - Available / ရရှိနေသည်
- `inventory.lowStock` - Low Stock / လက်ကျန်နည်းသည်
- `inventory.outOfStock` - Out of Stock / ကုန်သွားပြီ

### Notifications
- `notification.itemAdded` - Item added successfully / ပစ္စည်းအောင်မြင်စွာ ထည့်သွင်းပြီးပါသည်
- `notification.itemUpdated` - Item updated successfully / ပစ္စည်းအောင်မြင်စွာ ပြင်ဆင်ပြီးပါသည်
- `notification.saleCompleted` - Sale completed successfully / အရောင်းအောင်မြင်စွာ ပြီးစီးပါသည်

## Language Switcher Location
The language switcher is located in the app header, next to the notifications button.

## Design Features
- **Modern Toggle Switch**: Inspired by popular apps like iOS Settings
- **Flag Icons**: Visual indicators for Myanmar and English
- **Smooth Animations**: CSS transitions for all interactions
- **Hover Effects**: Tooltips and scale animations
- **Accessibility**: Proper focus states and ARIA labels

## Extending the System

### Adding New Languages
1. Add new language type to `Language` union in `language.ts`
2. Add translation object for the new language
3. Update flag icons in `LanguageSwitcher.svelte`
4. Modify toggle logic to cycle through all languages

### Using in Other Components
To make any component support translations:

```svelte
<script>
  import { currentLanguage, translate } from '../stores/language';
  
  // Use reactive statement for complex translations
  $: buttonText = translate('common.save', $currentLanguage);
</script>

<button>{buttonText}</button>
```

## Best Practices

1. **Consistent Key Naming**: Use dot notation (e.g., `section.item`)
2. **Complete Coverage**: Always provide both Myanmar and English translations
3. **Context Aware**: Use descriptive keys that indicate context
4. **Fallback**: The system falls back to the key name if translation is missing

## Browser Support
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Progressive enhancement for older browsers
- Graceful fallback to English if localStorage is unavailable

## Performance
- Translations are loaded once at app startup
- No network requests for language switching
- Efficient reactive updates using Svelte stores
