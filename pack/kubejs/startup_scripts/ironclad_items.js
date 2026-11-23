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
  // Nether Ward (Nov 23): the Nether is deadly until you've beaten 2 big overworld bosses. See server_scripts/ironclad_nether.js
  event.create('ironclad:conquerors_shard').rarity('rare').glow(true).maxStackSize(16)
    .tooltip(Text.gray('Dropped for everyone nearby when a big overworld boss dies'))
    .tooltip(Text.darkGray('2 of these make a Nether Ward Amulet'))
  event.create('ironclad:nether_ward_amulet').rarity('epic').glow(true).maxStackSize(1).fireResistant(true)
    .tooltip(Text.gold('Nether Ward slot: ').append(Text.gray('Nether monsters fight you fairly')))
    .tooltip(Text.red('Without it: ').append(Text.gray('Nether monsters hit 2.5x harder and take half damage')))

  // Boss Eyes (Nov 23): only these light an End portal frame (12 different ones). See server_scripts/ironclad_end.js
  const BOSS_EYE_IDS = ['ignis', 'monstrosity', 'wither', 'wroughtnaut', 'frostmaw', 'umvuthi', 'cornelia', 'maze_mother', 'remnant',
    'maledictus', 'leviathan', 'scylla', 'harbinger', 'hydra', 'kraken', 'infernal', 'dragon', 'pirate', 'warden']
  BOSS_EYE_IDS.forEach(k => {
    event.create('ironclad:eye_' + k).rarity('epic').glow(true).maxStackSize(16).fireResistant(true)
      .tooltip(Text.gray('Place in an End Portal Frame. A portal needs 12 different Boss Eyes.'))
      .tooltip(Text.darkGray('Ignis, the Monstrosity and the Wither must all be among them'))
  })
})


// Well Fed: given by eating a meal (farmersdelight:meals), see server_scripts/ironclad_meals.js.
// Level I = a meal you had recently, level II = a new meal (variety pays). Attribute amounts scale with the level.
StartupEvents.registry('mob_effect', event => {
  event.create('ironclad:well_fed').beneficial().color(0xE8B44C)
    .modifyAttribute('minecraft:generic.max_health', 'ironclad:well_fed_health', 2, 'add_value')
    .modifyAttribute('minecraft:generic.movement_speed', 'ironclad:well_fed_speed', 0.04, 'add_multiplied_total')
    .modifyAttribute('minecraft:generic.attack_damage', 'ironclad:well_fed_damage', 0.5, 'add_value')
})
