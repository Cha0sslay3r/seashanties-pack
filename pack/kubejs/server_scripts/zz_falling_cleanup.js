// Stuck falling sand/gravel cleanup (Nov 21). 59k falling_block entities had piled up near spawn and dragged the
// overworld to 5 TPS (every @e loop in Stellarity/Mob Heads/Sable walks all of them). A real falling block lands
// in a few seconds; anything still falling after 30-60 s is stuck -> removed. Runs every 30 s, costs ~nothing.
let zzFallTick = 0
ServerEvents.tick(event => {
  if (++zzFallTick < 600) return
  zzFallTick = 0
  event.server.runCommandSilent('kill @e[type=minecraft:falling_block,tag=zz_old_fall]')
  event.server.runCommandSilent('tag @e[type=minecraft:falling_block] add zz_old_fall')
})
