// Freedom V4: Sea Shanties - claim + spawn fixes (Nov 23).
// 1) "Lost" blocks in claims: when Open Parties and Claims stops a placement, the server keeps the item but the
//    client already took it out of the hotbar (desync). Re-send the inventory right after so the item shows again.
// 2) Nether bosses never belong in the overworld: Ignis / Netherite Monstrosity outside the Nether are removed.

const $BlockItem = Java.loadClass('net.minecraft.world.item.BlockItem')
let $OPAC = null
try { $OPAC = Java.loadClass('xaero.pac.common.server.api.OpenPACServerAPI') } catch (err) { console.warn('claims fix: OPAC API not found, using resync everywhere') }

function claimedByOther(p, pos) {
  if (!$OPAC) return true
  try {
    let claim = $OPAC.get(p.server).getServerClaimsManager().get(p.level.dimension, pos.x >> 4, pos.z >> 4)
    return claim != null && !claim.getPlayerId().equals(p.uuid)
  } catch (err) { return true }
}

function resync(p) {
  p.server.scheduleInTicks(2, () => {
    try { p.containerMenu.sendAllDataToRemote() } catch (err) { }
    try { if (p.containerMenu != p.inventoryMenu) p.inventoryMenu.sendAllDataToRemote() } catch (err) { }
  })
}

BlockEvents.rightClicked(event => {
  let p = event.player
  if (!p || event.hand != 'MAIN_HAND' && event.hand != 'OFF_HAND') return
  let it = event.item
  if (!it || it.isEmpty() || !(it.item instanceof $BlockItem)) return
  if (claimedByOther(p, event.block.pos)) resync(p)
})

const NETHER_ONLY_BOSSES = ['cataclysm:ignis', 'cataclysm:netherite_monstrosity']
EntityEvents.spawned(event => {
  let e = event.entity
  if (NETHER_ONLY_BOSSES.indexOf(String(e.type)) < 0) return
  let dim = String(event.level.dimension)
  if (dim == 'minecraft:the_nether') return
  console.info('Removed stray ' + e.type + ' in ' + dim + ' at ' + Math.round(e.x) + ' ' + Math.round(e.y) + ' ' + Math.round(e.z))
  event.cancel()
})
