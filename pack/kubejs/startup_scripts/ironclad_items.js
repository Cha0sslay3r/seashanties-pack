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
  // Legends of the Deep (collector rewards, quest-only: no recipe anywhere). Abilities live in server_scripts/ironclad_collector.js
  event.create('ironclad:tidecaller', 'sword').tier('netherite').attackDamageBaseline(5).speedBaseline(-2.4)
    .rarity('epic').glow(true).fireResistant(true)
    .tooltip(Text.aqua('Undertow: ').append(Text.gray('hits slow; +4 damage in water or rain')))
    .tooltip(Text.aqua('Tidal Wave: ').append(Text.gray('right-click to blast monsters away (8 s)')))
    .tooltip(Text.aqua('Held: ').append(Text.gray("Dolphin's Grace, Conduit Power when wet")))
    .tooltip(Text.darkGray('Reward for catching all 7 legendary fish'))
  event.create('ironclad:anglers_crown', 'helmet').material('turtle').rarity('rare').glow(true)
    .tooltip(Text.aqua('Worn: ').append(Text.gray('Luck III, Water Breathing, Night Vision underwater')))
    .tooltip(Text.darkGray('Reward for 3 legendary fish'))
})

// Well Fed: given by eating a meal (farmersdelight:meals), see server_scripts/ironclad_meals.js.
// Level I = a meal you had recently, level II = a new meal (variety pays). Attribute amounts scale with the level.
StartupEvents.registry('mob_effect', event => {
  event.create('ironclad:well_fed').beneficial().color(0xE8B44C)
    .modifyAttribute('minecraft:generic.max_health', 'ironclad:well_fed_health', 2, 'add_value')
    .modifyAttribute('minecraft:generic.movement_speed', 'ironclad:well_fed_speed', 0.04, 'add_multiplied_total')
    .modifyAttribute('minecraft:generic.attack_damage', 'ironclad:well_fed_damage', 0.5, 'add_value')
})
