// Freedom V4: Sea Shanties - rescues + sea serpent fix (Nov 26).
// /rescue <player> (ops): teleport to spawn, clear effects (siren charm etc.), full health, put out fire.
// RESCUE_ONCE: players rescued automatically on their next login (once per tag).
// Sea serpents sometimes hang in the air (Ice and Fire bug): every 2 s, a serpent with 4+ air blocks under it and no water
// at its feet is pulled 3 blocks down until it's back in the sea.

const RESCUE_ONCE = { 'SaltyAsSugar': 'nov26' }
const SPAWN_TP = '2192 66 1347'

function rescuePlayer(p) {
  let n = p.username, srv = p.server
  srv.runCommandSilent('execute in minecraft:overworld run tp ' + n + ' ' + SPAWN_TP)
  srv.runCommandSilent('effect clear ' + n)
  p.setHealth(p.getMaxHealth())
  p.setRemainingFireTicks(0)
  p.tell(Text.gold('You were brought back to Brass Harbour. ').append(Text.gray('Your corpse stays where you died; sirens now only sing for 30 seconds.')))
}

PlayerEvents.loggedIn(event => {
  let p = event.player, tag = RESCUE_ONCE[p.username]
  if (!tag || p.persistentData.getBoolean('rescued_' + tag)) return
  p.persistentData.putBoolean('rescued_' + tag, true)
  p.server.scheduleInTicks(40, () => rescuePlayer(p))
})

ServerEvents.commandRegistry(event => {
  let C = event.commands, A = event.arguments
  event.register(C.literal('rescue').requires(s => s.hasPermission(2))
    .then(C.argument('player', A.PLAYER.create(event)).executes(ctx => { rescuePlayer(A.PLAYER.getResult(ctx, 'player')); return 1 })))
})

ServerEvents.tick(event => {
  let srv = event.server
  if (srv.tickCount % 40 != 0) return
  srv.runCommandSilent('execute as @e[type=iceandfire:sea_serpent] at @s unless block ~ ~ ~ minecraft:water if block ~ ~-1 ~ minecraft:air if block ~ ~-2 ~ minecraft:air if block ~ ~-3 ~ minecraft:air if block ~ ~-4 ~ minecraft:air run tp @s ~ ~-3 ~')
})
