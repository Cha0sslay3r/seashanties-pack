// Freedom V4: Sea Shanties - starter kit, given once per player on first join.
// Ops: /starterkit <player> gives the kit again (e.g. someone lost theirs).

// Everything below is packed INSIDE the backpack (B to open). Only the backpack + quest book go in the hotbar.
const BackpackWrapper = Java.loadClass('net.p3pp3rf1y.sophisticatedbackpacks.backpack.wrapper.BackpackWrapper')
const ItemHandlerHelper = Java.loadClass('net.neoforged.neoforge.items.ItemHandlerHelper')
const STARTER_KIT = [
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
  ['minecraft:red_bed', 1]
]

function giveKit(p) {
  let bp = Item.of('sophisticatedbackpacks:backpack')
  let inv = null
  try { inv = BackpackWrapper.fromStack(bp).getInventoryHandler() } catch (err) { console.error('starter kit backpack: ' + err) }
  STARTER_KIT.forEach(e => {
    try {
      let st = Item.of(e[0], e[1])
      let rest = inv ? ItemHandlerHelper.insertItem(inv, st, false) : st
      if (!rest.isEmpty()) p.give(rest)   // fallback: straight to inventory
    } catch (err) { console.error('starter kit: ' + e[0] + ' ' + err) }
  })
  p.give(bp)
  p.give(Item.of('ftbquests:book'))
}

PlayerEvents.loggedIn(event => {
  let p = event.player
  if (p.persistentData.getBoolean('ironclad_starter_kit')) return
  p.persistentData.putBoolean('ironclad_starter_kit', true)
  giveKit(p)
  p.tell(Text.gold('Welcome aboard! ').append(Text.gray('Your starter kit is packed in your backpack (press B): a waystone for your first base, a raft, compass, spyglass, tools, food, torches and a bed.')))
  p.tell(Text.gray('Open the quest book to begin. Fair winds!'))
  // First join only: big on-screen welcome, then open the quest book for them once the world has loaded
  let name = p.username, srv = p.server
  srv.scheduleInTicks(100, () => {
    srv.runCommandSilent('title ' + name + ' times 10 100 30')
    srv.runCommandSilent('title ' + name + ' subtitle {"text":"Your quest book opens in a moment. It shows you everything.","color":"yellow"}')
    srv.runCommandSilent('title ' + name + ' title {"text":"Welcome aboard!","color":"gold","bold":true}')
    srv.runCommandSilent('tellraw ' + name + ' ["",{"text":"\u2693 START HERE: ","color":"gold","bold":true},{"text":"the Quest Book","color":"yellow"},{"text":" teaches the whole pack and pays you coins.","color":"gray"}]')
    srv.runCommandSilent('tellraw ' + name + ' ["",{"text":"Open it any time: right-click the ","color":"gray"},{"text":"book in your hotbar","color":"yellow"},{"text":", or click the ","color":"gray"},{"text":"scroll icon top-left of your inventory","color":"yellow"},{"text":".","color":"gray"}]')
  })
  srv.scheduleInTicks(200, () => srv.runCommandSilent('execute as ' + name + ' run ftbquests open_book'))
})

ServerEvents.commandRegistry(event => {
  let C = event.commands, A = event.arguments
  event.register(C.literal('starterkit').requires(s => s.hasPermission(2))
    .then(C.argument('player', A.PLAYER.create(event)).executes(ctx => {
      let p = A.PLAYER.getResult(ctx, 'player')
      giveKit(p)
      p.tell(Text.gold('You got a fresh starter kit.'))
      return 1
    })))
})
