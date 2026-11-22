// Freedom: Ironclad — recipe changes.
// Rule: vanilla recipes are NOT touched. Only strong modded items get a Create step.
ServerEvents.recipes(event => {
  const mc = (pattern, key, result) => event.custom({ type: 'create:mechanical_crafting', accept_mirrored: false, category: 'misc', key: key, pattern: pattern, result: result, show_notification: true })
  const I = id => ({ item: id })
  const T = tag => ({ tag: tag })

  // ---- One metal system: metal armour & weapons use Create sheets ----
  ;['magistuarmory', 'simplyswords', 'musketmod'].forEach(mod => {
    event.replaceInput({ mod: mod }, 'minecraft:iron_ingot', 'create:iron_sheet')
    event.replaceInput({ mod: mod }, 'minecraft:gold_ingot', 'create:golden_sheet')
  })

  // ---- Neptunium (Aquaculture): pressed into sheets first ----
  event.custom({ type: 'create:pressing', ingredients: [I('aquaculture:neptunium_ingot')], results: [{ id: 'ironclad:neptunium_sheet' }] })
  event.replaceInput({ mod: 'aquaculture', output: /aquaculture:neptunium_(helmet|chestplate|leggings|boots|sword|axe|pickaxe|shovel|hoe|bow|fishing_rod|fillet_knife)/ }, 'aquaculture:neptunium_ingot', 'ironclad:neptunium_sheet')

  // ---- Jetpacks (Create Stuff 'N Additions): each tier needs the one before ----
  event.remove({ output: 'create_sa:brass_jetpack_chestplate' })
  mc([' B ', 'PJP', 'BEB'], { B: I('create:brass_sheet'), P: I('create:precision_mechanism'), J: I('create_sa:copper_jetpack_chestplate'), E: I('create:electron_tube') }, { id: 'create_sa:brass_jetpack_chestplate' })
  event.remove({ output: 'create_sa:netherite_jetpack_chestplate' })
  mc([' N ', 'PJP', 'NSN'], { N: I('minecraft:netherite_ingot'), P: I('create:precision_mechanism'), J: I('create_sa:brass_jetpack_chestplate'), S: I('ironclad:sky_compass_core') }, { id: 'create_sa:netherite_jetpack_chestplate' })

  // ---- Waystones & explorer's compass: need Create parts ----
  event.remove({ output: 'waystones:waystone' })
  event.shaped('waystones:waystone', [' E ', 'AWA', 'SSS'], { E: 'create:electron_tube', A: 'create:andesite_alloy', W: 'waystones:warp_stone', S: 'minecraft:stone_bricks' })
  event.remove({ output: 'explorerscompass:explorerscompass' })
  event.shaped('explorerscompass:explorerscompass', ['CPC', 'PMP', 'CPC'], { C: 'minecraft:cracked_stone_bricks', P: 'create:brass_sheet', M: 'create:precision_mechanism' })

  // ---- Backpack & chest upgrades: sheets instead of ingots ----
  ;['sophisticatedbackpacks', 'sophisticatedstorage'].forEach(mod => {
    event.replaceInput({ mod: mod, output: /upgrade|backpack|tier/ }, 'minecraft:iron_ingot', 'create:iron_sheet')
    event.replaceInput({ mod: mod, output: /upgrade|backpack|tier/ }, 'minecraft:gold_ingot', 'create:golden_sheet')
  })

  // ---- Refined Storage: processors come off a Create assembly line ----
  ;['basic', 'improved', 'advanced'].forEach(tier => event.remove({ output: `refinedstorage:raw_${tier}_processor` }))
  const proc = (tier, metal, loops) => event.custom({
    type: 'create:sequenced_assembly', ingredient: I('create:iron_sheet'), loops: loops,
    transitional_item: { id: 'ironclad:incomplete_storage_circuit' },
    sequence: [
      { type: 'create:deploying', ingredients: [I('ironclad:incomplete_storage_circuit'), I('refinedstorage:silicon')], results: [{ id: 'ironclad:incomplete_storage_circuit' }] },
      { type: 'create:deploying', ingredients: [I('ironclad:incomplete_storage_circuit'), I(metal)], results: [{ id: 'ironclad:incomplete_storage_circuit' }] },
      { type: 'create:deploying', ingredients: [I('ironclad:incomplete_storage_circuit'), I('minecraft:redstone')], results: [{ id: 'ironclad:incomplete_storage_circuit' }] },
      { type: 'create:pressing', ingredients: [I('ironclad:incomplete_storage_circuit')], results: [{ id: 'ironclad:incomplete_storage_circuit' }] }
    ],
    results: [{ id: `refinedstorage:raw_${tier}_processor` }]
  })
  proc('basic', 'create:iron_sheet', 1)
  proc('improved', 'create:golden_sheet', 2)
  proc('advanced', 'create:brass_sheet', 3)

  // ---- Legendary gear (needs Sea Relics) ----
  // Captain's Musket: bayonet musket + Pirate Captain's Medal
  mc(['  M ', 'BGPB'], { M: I('ironclad:pirate_medal'), B: I('create:brass_sheet'), G: I('musketmod:musket_with_bayonet'), P: I('create:precision_mechanism') },
     { id: 'musketmod:musket_with_bayonet', components: { 'minecraft:custom_name': '{"text":"Captain\'s Musket","color":"gold","italic":false}', 'minecraft:enchantments': { levels: { 'minecraft:unbreaking': 5, 'ironclad:plunder': 3 } } } })
  // Tidecaller Trident: Loyalty AND Riptide together
  mc([' S ', 'HTH', ' N '], { S: I('ironclad:sirens_pearl'), H: I('minecraft:heart_of_the_sea'), T: I('minecraft:trident'), N: I('ironclad:neptunium_sheet') },
     { id: 'minecraft:trident', components: { 'minecraft:custom_name': '{"text":"Tidecaller","color":"aqua","italic":false}', 'minecraft:enchantments': { levels: { 'minecraft:loyalty': 3, 'minecraft:riptide': 3, 'ironclad:tidebreaker': 3 } } } })
  // Dragonsteel Cutlass (any dragonsteel sword + Leviathan Ink)
  ;['fire', 'ice', 'lightning'].forEach(e => mc([' L ', 'PSP', ' B '], { L: I('ironclad:leviathan_ink'), P: I('create:precision_mechanism'), S: I(`iceandfire:dragonsteel_${e}_sword`), B: I('create:brass_sheet') },
     { id: `iceandfire:dragonsteel_${e}_sword`, components: { 'minecraft:custom_name': `{"text":"Dragonsteel Cutlass","color":"light_purple","italic":false}`, 'minecraft:enchantments': { levels: { 'ironclad:tidebreaker': 5, 'ironclad:krakens_grip': 3 } } } }))
})
