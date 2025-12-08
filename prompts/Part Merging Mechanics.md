Its difficult to find good parts in the game. In order to reosolve this
I want to let the player merge certain parts together. If the player has two of the same part, this will happen:

1. Hovering over one of the parts will also highlight the others of the same kind. Eg. hovering over a turbo will highlight all other turbos, doesnt matter wha trairty or condition.
2. # New button added to the options where it says "Merge". This button will be disabled if there are no others parts of the same type. Else, the game will ask the user to select another part of the same type to merge with. So if the user clicks on a turbo, then clicks "Merge", all parts excpet the turbos will be darkened so its easier to see the compatiple parts. When the user then clicks a second part, it will confim with the user if they are sure they want to merge the two parts, showing a modal in this format:
    Are you sure you want to merge these two parts?
    {Part one IMageCard} {PlusIcon} {Part two ImageCard}
    {Cancel Button} {Merge Button}
    =======================

Use this as a template, but change it to be liek the template above:

```typescript
{
	selectedBuyItem && (
		<div
			className="absolute inset-0 z-[50] flex items-center justify-center bg-black/50"
			onClick={() => setSelectedBuyItem(null)}
		>
			<div
				className="bg-gray-900 border-2 border-yellow-500 rounded p-6 shadow-2xl animate-in zoom-in-95 flex flex-col gap-4 min-w-[300px]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="text-center">
					<h3 className="text-xl font-bold text-white mb-1">
						Buy Item?
					</h3>
					<div className="text-gray-400 text-sm">
						{selectedBuyItem.name}
					</div>
				</div>

				<div className="bg-black/40 rounded p-2 text-center">
					<div className="text-xs text-gray-500 mb-1">COST</div>
					<div className="text-yellow-400 font-mono text-2xl font-bold">
						${selectedBuyItem.value.toLocaleString()}
					</div>
				</div>

				<div className="flex gap-2">
					<button
						onClick={handleBuy}
						disabled={money < selectedBuyItem.value}
						className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded pixel-text"
					>
						CONFIRM
					</button>
					<button
						onClick={() => setSelectedBuyItem(null)}
						className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded pixel-text"
					>
						CANCEL
					</button>
				</div>
				{money < selectedBuyItem.value && (
					<div className="text-red-500 text-xs text-center font-bold animate-pulse">
						Insufficient Funds!
					</div>
				)}
			</div>
		</div>
	);
}
```

Clicking the cancel button will frget everything after clicking the merge option. 3. After clicking the merge button, a new part of the same kind will be created, using these factors for creation:

-   Condition -> Part 1 Condition \* Part 2 Condition
-   Rarity:
    -   Common + Common = 75% Chance to upgrade to uncommon & 255 Chance to stay Common
    -   Common + Uncommon = 90% Chance to become Uncommon & 10% Chance to become Rare
    -   Rare + Uncommon = 90% Chance to stay Rare & 10% Chance to become Legendary
    -   Rare + Rare = 75% Chance to become legendary & 25% Chance to stay Rare. Legendary + Rare = 90% Chance to stay Rare & 10% Chance to become Exotic
    -   Legendary + Legendary = 75% Chance to become Exotic & 25% Chance to Stay Legendary.
    -   Make variables for the repeated chances such as `const DiffUpgradeChance = .75; const SameUpgradeChance = .80;`
-   Stats:
    -   If the stats are the same, the new part will have the same stats as the parts being merged.
    -   If the stats are different, the new part will have the average of the stats of the parts being merged.
    -   The average is calculated by adding the stats together and then dividing by 1.25. For example: 150hp + 200hp = 350hp / 1.25 = 280hp
-   Value:
    -   The value of the new part will be the average of the values of the parts being merged.
    -   The average is calculated by adding the values together and then dividing by 1.25. For example: 1000 + 2000 = 3000 / 1.25 = 2400

4. After this new part is created, delete the two parts that were used to create it, and add the new part to the player's inventory.
5. !IMPORTANT! Only allow the player to merge parts in the inventory section, NOT the selected car part section.
