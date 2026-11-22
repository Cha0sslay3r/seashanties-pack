// Freedom: Ironclad — custom items (Sea Relics + crafting parts)
const RELICS = [
  ['sirens_pearl', 'rare'], ['pirate_medal', 'rare'], ['kraken_beak', 'rare'],
  ['serpent_heart', 'epic'], ['frozen_anchor', 'epic'], ['sky_compass_core', 'epic'],
  ['navigators_chart', 'uncommon'], ['leviathan_ink', 'epic']
]
StartupEvents.registry('item', event => {
  RELICS.forEach(([id, rarity]) => {
    event.create('ironclad:' + id).rarity(rarity).glow(true).maxStackSize(16)
  })
  event.create('ironclad:neptunium_sheet')
  event.create('ironclad:storage_circuit')
  event.create('ironclad:incomplete_storage_circuit')
})
