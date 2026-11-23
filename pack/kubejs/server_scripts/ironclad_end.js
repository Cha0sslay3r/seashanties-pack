// Freedom V4: Sea Shanties - the End lock (Nov 23).
// Eyes of Ender only point the way now: End Portal Frames take Boss Eyes. Each big boss drops its own eye to every
// player within 48 blocks. A portal needs 12 DIFFERENT Boss Eyes, and Ignis, the Monstrosity and the Wither must be among them.
// Pre-placed vanilla eyes in a stronghold crumble when the first Boss Eye goes in.
// Even through a lit portal, you may only enter the End if you helped kill Ignis AND the Netherite Monstrosity yourself.

const BOSS_EYES = [
  ['ignis', ["cataclysm:ignis"]],
  ['monstrosity', ["cataclysm:netherite_monstrosity"]],
  ['wither', ["minecraft:wither"]],
  ['wroughtnaut', ["mowziesmobs:ferrous_wroughtnaut"]],
  ['frostmaw', ["mowziesmobs:frostmaw"]],
  ['umvuthi', ["mowziesmobs:umvuthi"]],
  ['cornelia', ["aquamirae:captain_cornelia"]],
  ['maze_mother', ["aquamirae:maze_mother"]],
  ['remnant', ["cataclysm:ancient_remnant"]],
  ['maledictus', ["cataclysm:maledictus"]],
  ['leviathan', ["cataclysm:the_leviathan"]],
  ['scylla', ["cataclysm:scylla"]],
  ['harbinger', ["cataclysm:the_harbinger"]],
  ['hydra', ["iceandfire:hydra"]],
  ['kraken', ["block_factorys_bosses:kraken"]],
  ['infernal', ["block_factorys_bosses:infernal_dragon"]],
  ['dragon', ["iceandfire:fire_dragon", "iceandfire:ice_dragon", "iceandfire:lightning_dragon"]],
  ['pirate', ["block_factorys_bosses:pirate_captain"]],
  ['warden', ["minecraft:warden"]]
]
const EE_REQUIRED = ['ignis', 'monstrosity', 'wither']
const EE_PERSONAL = { 'cataclysm:ignis': 'ee_killed_ignis', 'cataclysm:netherite_monstrosity': 'ee_killed_monstrosity' }
const EE_NAMES = { ignis: 'Ignis', monstrosity: 'the Netherite Monstrosity', wither: 'the Wither' }
const $EeFrameBlock = Java.loadClass('net.minecraft.world.level.block.EndPortalFrameBlock')
const $EeBlocks = Java.loadClass('net.minecraft.world.level.block.Blocks')

function eeEyeFor(entityId) {
  for (let i = 0; i < BOSS_EYES.length; i++) if (BOSS_EYES[i][1].indexOf(entityId) >= 0) return BOSS_EYES[i][0]
  return null
}
function eeStore(server) {
  if (!server.persistentData.contains('ee_frames')) server.persistentData.put('ee_frames', NBT.compoundTag())
  return server.persistentData.getCompound('ee_frames')
}
function eeKey(x, y, z) { return x + ',' + y + ',' + z }

// all portal frames of the ring around a frame (same y, within 5 blocks)
function eeRing(level, pos) {
  let out = []
  for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) {
    let b = level.getBlock(pos.x + dx, pos.y, pos.z + dz)
    if (b.id == 'minecraft:end_portal_frame') out.push(b)
  }
  return out
}

BlockEvents.rightClicked('minecraft:end_portal_frame', event => {
  let p = event.player, item = event.item, block = event.block
  if (!p || !item || item.isEmpty()) return
  let id = String(item.id)
  if (id == 'minecraft:ender_eye') {
    event.cancel()
    p.displayClientMessage(Text.gray('Eyes of Ender only show the way now. The frame wants a ').append(Text.gold('Boss Eye')).append(Text.gray('.')), true)
    return
  }
  if (!id.startsWith('ironclad:eye_')) return
  event.cancel()
  if (String(block.properties.eye) == 'true') return
  let eye = id.substring('ironclad:eye_'.length)
  let level = block.level, store = eeStore(p.server)
  let ring = eeRing(level, block.pos)
  let used = [], empty = 0
  ring.forEach(b => {
    let k = eeKey(b.x, b.y, b.z)
    if (String(b.properties.eye) == 'true') {
      if (store.contains(k)) used.push(store.getString(k))
      else { b.set('minecraft:end_portal_frame', { facing: b.properties.facing, eye: 'false' }); empty++ }   // old vanilla eye crumbles
    } else empty++
  })
  if (used.indexOf(eye) >= 0) {
    p.displayClientMessage(Text.red('This portal already holds that eye. It needs 12 different Boss Eyes.'), true)
    return
  }
  let missing = EE_REQUIRED.filter(r => used.indexOf(r) < 0 && r != eye)
  if (EE_REQUIRED.indexOf(eye) < 0 && empty - 1 < missing.length) {
    p.displayClientMessage(Text.red('The last frames are saved for: ' + missing.map(m => EE_NAMES[m]).join(', ')), true)
    return
  }
  block.set('minecraft:end_portal_frame', { facing: block.properties.facing, eye: 'true' })
  store.putString(eeKey(block.x, block.y, block.z), eye)
  if (!p.isCreative()) item.shrink(1)
  let filled = used.length + 1
  p.server.runCommandSilent('execute in ' + level.dimension + ' run playsound minecraft:block.end_portal_frame.fill block @a ' + block.x + ' ' + block.y + ' ' + block.z + ' 1 1')
  p.displayClientMessage(Text.gold(item.hoverName.getString() + ' placed. ').append(Text.gray(filled + ' / 12')), true)
  // all 12 filled -> vanilla portal shape check + open
  try {
    let m = $EeFrameBlock.getOrCreatePortalShape().find(level, block.pos)
    if (m != null) {
      let bp = m.getFrontTopLeft().offset(-3, 0, -3)
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) level.setBlock(bp.offset(i, 0, j), $EeBlocks.END_PORTAL.defaultBlockState(), 2)
      level.globalLevelEvent(1038, bp.offset(1, 0, 1), 0)
      p.server.tell(Text.darkPurple('An End portal has opened! ').append(Text.gray('Only those who helped slay Ignis and the Netherite Monstrosity may pass.')))
    }
  } catch (err) { console.error('end portal open: ' + err) }
})

// boss deaths: an eye for everyone nearby + personal Nether-boss credit
EntityEvents.death(event => {
  let e = event.entity, id = String(e.type)
  let eye = eeEyeFor(id)
  if (!eye) return
  if (eye == 'dragon' && e.getMaxHealth() < 150) return   // only grown dragons
  e.level.getPlayers().forEach(p => {
    if (p.distanceToEntity(e) > 48) return
    p.give(Item.of('ironclad:eye_' + eye))
    if (EE_PERSONAL[id]) p.persistentData.putBoolean(EE_PERSONAL[id], true)
    p.tell(Text.darkPurple('Boss Eye! ').append(Text.gray('You got the ')).append(Text.gold(Item.of('ironclad:eye_' + eye).hoverName.getString())).append(Text.gray('. 12 different eyes open an End portal.')))
  })
})

function eeMayEnter(p) {
  return p.isCreative() || p.isSpectator() || (p.persistentData.getBoolean('ee_killed_ignis') && p.persistentData.getBoolean('ee_killed_monstrosity'))
}

// unqualified players who reach the End are sent home
PlayerEvents.tick(event => {
  let p = event.player
  if (p.age % 10 != 0) return
  if (String(p.level.dimension) != 'minecraft:the_end' || eeMayEnter(p)) return
  let need = []
  if (!p.persistentData.getBoolean('ee_killed_ignis')) need.push('Ignis')
  if (!p.persistentData.getBoolean('ee_killed_monstrosity')) need.push('the Netherite Monstrosity')
  p.server.runCommandSilent('execute in minecraft:overworld run tp ' + p.username + ' 2192 66 1347')
  p.server.runCommandSilent('title ' + p.username + ' title {"text":"The End rejects you","color":"dark_purple","bold":true}')
  p.tell(Text.darkPurple('Not yet: ').append(Text.gray('you must help slay ' + need.join(' and ') + ' before you may enter the End.')))
})

// /endcredit <player> (ops): give a player the Nether-boss credit by hand (e.g. a kill that happened before this script)
ServerEvents.commandRegistry(event => {
  let C = event.commands, A = event.arguments
  event.register(C.literal('endcredit').requires(s => s.hasPermission(2))
    .then(C.argument('player', A.PLAYER.create(event)).executes(ctx => {
      let p = A.PLAYER.getResult(ctx, 'player')
      p.persistentData.putBoolean('ee_killed_ignis', true); p.persistentData.putBoolean('ee_killed_monstrosity', true)
      p.tell(Text.gold('You may now enter the End.'))
      return 1
    })))
})
