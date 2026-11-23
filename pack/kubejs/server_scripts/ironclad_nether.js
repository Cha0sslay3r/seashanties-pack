// Freedom V4: Sea Shanties - the Nether Ward (Nov 23).
// The Nether is open to everyone, but it's deadly until you've proven yourself in the overworld:
//   without a Nether Ward Amulet in the Nether Ward curio slot, Nether monsters deal 2.5x damage to you
//   and take only half damage from you. With it, the Nether is normal.
// Amulet = 2 Conqueror's Shards (+ gold, crying obsidian, diamond). Every player within 48 blocks gets a shard
// when a big overworld boss dies. Shards are per player, so a crew that fights together all earn them.

const $NwEnemy = Java.loadClass('net.minecraft.world.entity.monster.Enemy')
const $NwPlayer = Java.loadClass('net.minecraft.world.entity.player.Player')
let $NwCurios = null
try { $NwCurios = Java.loadClass('top.theillusivec4.curios.api.CuriosApi') } catch (err) { console.error('nether ward: Curios API not found') }

const NW_AMULET = 'ironclad:nether_ward_amulet'
const NW_SHARD = 'ironclad:conquerors_shard'
const NW_TAKEN = 2.5, NW_DEALT = 0.5
const NW_BOSSES = [
  'mowziesmobs:ferrous_wroughtnaut', 'mowziesmobs:frostmaw', 'mowziesmobs:umvuthi',
  'aquamirae:captain_cornelia', 'aquamirae:maze_mother',
  'cataclysm:ancient_remnant', 'cataclysm:maledictus', 'cataclysm:the_leviathan', 'cataclysm:scylla', 'cataclysm:the_harbinger',
  'iceandfire:hydra', 'block_factorys_bosses:kraken', 'block_factorys_bosses:infernal_dragon'
]
const NW_DRAGONS = ['iceandfire:fire_dragon', 'iceandfire:ice_dragon', 'iceandfire:lightning_dragon']   // only grown ones (150+ max health)

const nwWarded = {}   // uuid -> true/false, refreshed every 2 s
const nwWarned = {}   // uuid -> game time of the last "you're unwarded" warning

function nwHasAmulet(p) {
  if (!$NwCurios) return true   // never punish if Curios is missing
  try {
    let inv = $NwCurios.getCuriosInventory(p)
    if (!inv.isPresent()) return false
    return inv.get().findFirstCurio(Item.of(NW_AMULET).item).isPresent()
  } catch (err) { return true }
}
function nwInNether(e) { return String(e.level.dimension) == 'minecraft:the_nether' }
function nwIsWarded(p) {
  let k = String(p.uuid)
  if (nwWarded[k] === undefined) nwWarded[k] = nwHasAmulet(p)
  return nwWarded[k]
}

PlayerEvents.tick(event => {
  let p = event.player
  if (p.age % 40 != 0) return
  let k = String(p.uuid)
  nwWarded[k] = nwHasAmulet(p)
  if (!nwInNether(p) || nwWarded[k] || p.isCreative() || p.isSpectator()) return
  let now = p.level.getGameTime()
  if (nwWarned[k] && now - nwWarned[k] < 12000) return   // every 10 min at most
  nwWarned[k] = now
  let n = p.username
  p.server.runCommandSilent('title ' + n + ' times 10 70 20')
  p.server.runCommandSilent('title ' + n + ' subtitle {"text":"Monsters here hit 2.5x harder and shrug off your blows","color":"gray"}')
  p.server.runCommandSilent('title ' + n + ' title {"text":"The Nether rejects you","color":"dark_red","bold":true}')
  p.tell(Text.darkRed('Unwarded: ').append(Text.gray('Nether monsters deal 2.5x damage and take half damage from you. Beat 2 big overworld bosses, craft a ')).append(Text.gold('Nether Ward Amulet')).append(Text.gray(' and wear it in its curio slot.')))
})

EntityEvents.beforeHurt(event => {
  let t = event.entity
  if (!nwInNether(t)) return
  let a = event.source.actual
  if (!a) return
  if (t instanceof $NwPlayer && a instanceof $NwEnemy) {
    if (!nwIsWarded(t)) event.setDamage(event.damage * NW_TAKEN)
  } else if (a instanceof $NwPlayer && t instanceof $NwEnemy) {
    if (!nwIsWarded(a)) event.setDamage(event.damage * NW_DEALT)
  }
})

EntityEvents.death(event => {
  let e = event.entity
  let id = String(e.type)
  let big = NW_BOSSES.indexOf(id) >= 0 || (NW_DRAGONS.indexOf(id) >= 0 && e.getMaxHealth() >= 150)
  if (!big || nwInNether(e)) return
  let name = e.displayName.getString()
  e.level.getPlayers().forEach(p => {
    if (p.distanceToEntity(e) > 48) return
    p.give(Item.of(NW_SHARD))
    let got = p.persistentData.getInt('nw_bosses') + 1
    p.persistentData.putInt('nw_bosses', got)
    p.tell(Text.gold("Conqueror's Shard! ").append(Text.gray('for defeating ' + name + (got < 2 ? '. One more and you can craft a Nether Ward Amulet.' : '. You can craft a Nether Ward Amulet.'))))
    p.server.runCommandSilent('execute as ' + p.username + ' at @s run playsound minecraft:ui.toast.challenge_complete player @s ~ ~ ~ 1 1.2')
  })
})

ServerEvents.recipes(event => {
  event.shaped(NW_AMULET, ['GSG', 'ODO', 'GSG'], {
    G: 'minecraft:gold_ingot', S: NW_SHARD, O: 'minecraft:crying_obsidian', D: 'minecraft:diamond'
  }).id('ironclad:nether_ward_amulet')
})
