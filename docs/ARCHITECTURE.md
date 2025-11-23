# Albion Enchanting Calculator - Code Architecture

## 📁 Project Structure

```
src/
├── types/              # Shared TypeScript type definitions
│   └── index.ts        # Tier, ResourceType, ItemKey, PriceBreakdown, etc.
├── lib/                # Core business logic & utilities
│   ├── utility.ts      # Helper functions (parseNumber, formatNumber, constants)
│   ├── calculations.ts # Profit calculation logic
│   ├── constants.ts    # Global constants (MARKET_TAX)
│   └── supabase.ts     # Database client & CRUD operations
├── hooks/              # Custom React hooks
│   └── useResourcePrices.ts  # Hook for loading resource prices
├── components/         # Reusable UI components
│   ├── ItemCard/       # Display item with prices
│   └── PriceInputSection/  # Reusable price input component
├── app/                # Next.js pages
│   ├── calculate/      # Profit calculator
│   ├── prices/         # Resource price management
│   └── discovery/      # Item discovery with API prices
└── services/           # External API integration
    └── api.ts          # Albion Online Data API client
```

## 🎯 Key Improvements

### 1. **Type Safety**
All types centralized in `src/types/index.ts`:
- `Tier`, `ResourceType`, `ItemKey`
- `PriceBreakdown`, `ResourcePrice`, `ItemData`, `PriceData`
- `ResourcePriceMap`, `ResourceInputMap`

### 2. **Business Logic Separation**
- **`lib/calculations.ts`**: Pure function for profit calculation
  - Easy to test
  - No React dependencies
  - Clear input/output contract

### 3. **Custom Hooks**
- **`useResourcePrices`**: Centralized data fetching
  - Loads prices from Supabase
  - Returns `{ prices, loading }`
  - Reusable across components

### 4. **Utility Functions**
All in `lib/utility.ts`:
- `parseNumber()` - Handles string/number conversion
- `formatNumber()` - Locale-aware formatting
- `calculateSellAfterTax()` - Tax calculation
- `calculateTaxAmount()` - Tax amount only
- Constants: `TIERS`, `RESOURCE_TYPES`, `ITEM_COUNTS`

### 5. **Reusable Components**
- **`PriceInputSection`**: Generic price input for any resource type
  - Props: `title`, `resourceKey`, `values`, `onChange`, `showDecimal`
  - Reduces code duplication by ~70%

### 6. **State Management**
Prices page now uses single state object:
```ts
const [resourcePrices, setResourcePrices] = useState<ResourceInputMap>({
  runes: { T4: "0", T5: "0", ... },
  souls: { T4: "0", T5: "0", ... },
  // ... all resources in one object
});
```

## 🚀 Usage Examples

### Using the calculation logic
```ts
import { calculateProfit } from '@/lib/calculations';

const result = calculateProfit({
  itemCost: "1000",
  sellPrice: "5000",
  item: "armor_bag",
  tier: "T6",
  clothCount: "10",
  leatherCount: "5",
  // ... other inputs
  prices: resourcePrices
});

if (result) {
  console.log(result.profit); // Final profit
  console.log(result.breakdown); // Detailed breakdown
}
```

### Using the resource prices hook
```ts
import { useResourcePrices } from '@/hooks/useResourcePrices';

function MyComponent() {
  const { prices, loading } = useResourcePrices();
  
  if (loading) return <p>Loading...</p>;
  
  // prices is a ResourcePriceMap ready to use
  const runeT6Price = prices.runes.T6;
}
```

### Using utility functions
```ts
import { parseNumber, formatNumber, calculateSellAfterTax } from '@/lib/utility';

const price = parseNumber("1,234.56"); // 1234.56
const formatted = formatNumber(1234567); // "1,234,567"
const afterTax = calculateSellAfterTax(10000); // 9350 (after 6.5% tax)
```

## 📊 Benefits

1. **Maintainability**: Logic separated from UI
2. **Testability**: Pure functions easy to unit test
3. **Reusability**: Hooks and components shared across app
4. **Type Safety**: Full TypeScript coverage
5. **DRY**: No code duplication
6. **Clarity**: Clear separation of concerns

## 🔧 Migration Notes

### Old Pattern (Before)
```ts
// 7 separate useState calls
const [runes, setRunes] = useState(...);
const [souls, setSouls] = useState(...);
// ... 5 more

// Complex handleChange with if-else chains
function handleChange(resource, tier, value) {
  if (resource === "runes") setRunes(prev => ...);
  else if (resource === "souls") setSouls(prev => ...);
  // ... 5 more branches
}
```

### New Pattern (After)
```ts
// Single state object
const [resourcePrices, setResourcePrices] = useState<ResourceInputMap>({
  runes: {...}, souls: {...}, // ... all resources
});

// Simple handleChange
function handleChange(resource, tier, value) {
  setResourcePrices(prev => ({
    ...prev,
    [resource]: { ...prev[resource], [tier]: value }
  }));
}
```

## 🎨 Component Simplification

Prices page went from **~260 lines** to **~100 lines** by using `PriceInputSection` component.

Before: 7 duplicate `<section>` blocks
After: 7 `<PriceInputSection>` calls

---

*Generated after refactoring on ${new Date().toLocaleDateString()}*
