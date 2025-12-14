import { ItemMerge } from '../utils/ItemMerge';
import { InventoryItem } from '../types';

const mockItem = (rarity: any, statVal: number): InventoryItem =>
	({
		id: '1',
		instanceId: '1',
		baseId: '1',
		name: 'Test Item',
		type: 'ENGINE',
		rarity: rarity,
		value: 100,
		stats: { maxTorque: statVal },
		condition: 100,
	} as any);

console.log('--- Testing Merge Probabilities ---');
const probs = ItemMerge.getMergeProbabilities('COMMON', 'COMMON');
console.log('Common + CommonProbs:', probs);
if (probs.some((p) => p.rarity === 'UNCOMMON' && p.chance === 0.75)) {
	console.log('PASS: Common+Common probabilities correct.');
} else {
	console.error('FAIL: Common+Common probabilities incorrect.');
}

console.log('\n--- Testing Stat Merge ---');
const item1 = mockItem('COMMON', 0.1);
const item2 = mockItem('COMMON', 0.1);
// different instance ids
item2.instanceId = '2';

const merged = ItemMerge.mergeItems(item1, item2);
if (merged) {
	console.log(`0.10 + 0.10 = ${merged.stats.maxTorque}`);
	const expected = (0.1 + 0.1) / 1.25; // 0.20 / 1.25 = 0.16
	if (Math.abs((merged.stats.maxTorque as number) - expected) < 0.0001) {
		console.log('PASS: Stats merged correctly (boosted).');
	} else {
		console.error(
			`FAIL: Stats not boosted smoothly. Got ${merged.stats.maxTorque}, Expected ${expected}`
		);
	}
} else {
	console.error('FAIL: Merge failed (returned null).');
}
