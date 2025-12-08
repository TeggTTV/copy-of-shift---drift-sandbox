## ItemCard Component Integration Guide

The `ItemCard` component has been successfully created at `components/ui/ItemCard.tsx` and integrated into `Inventory.tsx`.

### To integrate into AuctionHouse.tsx:

1. **Add the import** at the top of the file (after line 5):

```tsx
import { ItemCard } from '../ui/ItemCard';
```

2. **Replace the marketplace cards** (around lines 280-356):

Find this code:

```tsx
{filteredMarketItems.map((item) => (
  <div key={item.instanceId} ... [large card JSX] ... </div>
))}
```

Replace with:

```tsx
{
	filteredMarketItems.map((item) => (
		<ItemCard
			key={item.instanceId}
			item={item}
			onClick={() => setSelectedBuyItem(item)}
			onMouseEnter={() => setHoveredMarketItem(item)}
			onMouseLeave={() => setHoveredMarketItem(null)}
			isSelected={selectedBuyItem?.instanceId === item.instanceId}
			showCondition={true}
		/>
	));
}
```

3. **Replace the inventory cards** (around lines 444-519):

Find this code:

```tsx
{inventory.map((item) => (
  <div key={item.instanceId} ... [large card JSX] ... </div>
))}
```

Replace with:

```tsx
{
	inventory.map((item) => (
		<ItemCard
			key={item.instanceId}
			item={item}
			onClick={() => handleSelectSellItem(item)}
			onMouseEnter={() => setHoveredMarketItem(item)}
			onMouseLeave={() => setHoveredMarketItem(null)}
			isSelected={selectedSellItem?.instanceId === item.instanceId}
			showCondition={true}
		/>
	));
}
```

### Benefits:

-   ✅ Consistent styling across Inventory and AuctionHouse
-   ✅ Easier to maintain and update
-   ✅ Cleaner, more readable code
-   ✅ Single source of truth for item card styling
