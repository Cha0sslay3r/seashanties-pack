// Freedom V4: Sea Shanties - starter kit, given once per player on first join.
// Ops: /starterkit <player> gives the kit again (e.g. someone lost theirs).

const STARTER_KIT = [
  ['sophisticatedbackpacks:backpack', 1],   // B to open
  ['waystones:waystone', 1],                // place it at your first base (more need Create electron tubes)
  ['justaraftmod:jungle_raft', 1],           // your first boat (a Small Ships cog is the next step)
  ['naturescompass:naturescompass', 1],     // point at any biome
  ['minecraft:spyglass', 1],
  ['minecraft:fishing_rod', 1],
  ['minecraft:stone_sword', 1],
  ['minecraft:stone_pickaxe', 1],
  ['minecraft:stone_axe', 1],
  ['minecraft:stone_shovel', 1],
  ['minecraft:cooked_cod', 16],
  ['minecraft:bread', 16],
  ['minecraft:torch', 32],
  ['minecraft:red_bed', 1],
  ['ftbquests:book', 1]
]

PlayerEvents.loggedIn(event => {
  let p = event.player
  if (p.persistentData.getBoolean('ironclad_starter_kit')) return
  p.persistentData.putBoolean('ironclad_starter_kit', true)
  STARTER_KIT.forEach(e => {
    try { p.give(Item.of(e[0], e[1])) } catch (err) { console.error('starter kit: ' + e[0] + ' ' + err) }
  })
  p.tell(Text.gold('Welcome aboard! ').append(Text.gray('Starter kit: backpack, a waystone for your first base, a raft, compass, spyglass, tools, food, torches and a bed.')))
  p.tell(Text.gray('Open the quest book to begin. Fair winds!'))
})

ServerEvents.commandRegistry(event => {
  let C = event.commands, A = event.arguments
  event.register(C.literal('starterkit').requires(s => s.hasPermission(2))
    .then(C.argument('player', A.PLAYER.create(event)).executes(ctx => {
      let p = A.PLAYER.getResult(ctx, 'player')
      STARTER_KIT.forEach(e => { try { p.give(Item.of(e[0], e[1])) } catch (err) { console.error('starter kit: ' + e[0] + ' ' + err) } })
      p.tell(Text.gold('You got a fresh starter kit.'))
      return 1
    })))
})
