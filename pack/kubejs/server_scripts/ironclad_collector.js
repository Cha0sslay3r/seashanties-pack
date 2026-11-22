// Freedom V4: Sea Shanties - "Legends of the Deep" collector rewards (quest-only items, no recipes).
// Angler's Crown (3 legendary fish): worn = Luck III (helps the Midas Fish bite), Water Breathing, Night Vision underwater.
// Tidecaller (all 7 legendary fish): held = Dolphin's Grace (+ Conduit Power when wet).
//   Undertow: every hit slows the target; +4 damage when you're in water or rain (not against bosses).
//   Tidal Wave: right-click = blast monsters within 7 blocks away from you, 6 damage. 8 s cooldown.

const $MobEffects2 = Java.loadClass('net.minecraft.world.effect.MobEffects')
const $MobEffectInstance2 = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
const $Player2 = Java.loadClass('net.minecraft.world.entity.player.Player')
const $Enemy = Java.loadClass('net.minecraft.world.entity.monster.Enemy')
const TIDECALLER = 'ironclad:tidecaller'
const CROWN = 'ironclad:anglers_crown'
const WAVE_COOLDOWN = 160

function fx(p, effect, ticks, amp) {
  p.addEffect(new $MobEffectInstance2(effect, ticks, amp, true, false, true))
}

PlayerEvents.tick(event => {
  let p = event.player
  if (p.age % 40 != 0) return
  if (p.mainHandItem.id == TIDECALLER) {
    fx(p, $MobEffects2.DOLPHINS_GRACE, 60, 0)
    if (p.isInWaterOrRain()) fx(p, $MobEffects2.CONDUIT_POWER, 60, 0)
  }
  if (p.headArmorItem.id == CROWN) {
    fx(p, $MobEffects2.LUCK, 60, 2)
    fx(p, $MobEffects2.WATER_BREATHING, 60, 0)
    if (p.isUnderWater()) fx(p, $MobEffects2.NIGHT_VISION, 300, 0)
  }
})

EntityEvents.beforeHurt(event => {
  let src = event.source
  let p = src.getEntity()
  if (!(p instanceof $Player2) || src.getDirectEntity() != p) return   // melee only
  if (p.mainHandItem.id != TIDECALLER) return
  let t = event.entity
  t.addEffect(new $MobEffectInstance2($MobEffects2.MOVEMENT_SLOWDOWN, 60, 1))
  if (p.isInWaterOrRain() && t.getMaxHealth() < 150) event.setDamage(event.damage + 4)
})

ItemEvents.rightClicked(TIDECALLER, event => {
  let p = event.player
  let item = event.item
  if (p.cooldowns.isOnCooldown(item.item)) return
  p.cooldowns.addCooldown(item.item, WAVE_COOLDOWN)
  let hit = 0
  p.level.getEntitiesWithin(p.boundingBox.inflate(7)).forEach(ent => {
    if (ent == p || !ent.isLiving() || !(ent instanceof $Enemy)) return
    let dx = ent.x - p.x, dz = ent.z - p.z
    let d = Math.max(0.5, Math.sqrt(dx * dx + dz * dz))
    ent.hurt(p.damageSources().playerAttack(p), 6)
    ent.setDeltaMovement(dx / d * 1.6, 0.6, dz / d * 1.6)
    ent.hurtMarked = true
    hit++
  })
  let at = 'execute as ' + p.uuid + ' at @s run '
  p.server.runCommandSilent(at + 'particle minecraft:splash ~ ~1 ~ 3 0.6 3 0.2 300 force')
  p.server.runCommandSilent(at + 'particle minecraft:bubble_pop ~ ~0.5 ~ 3 0.4 3 0.1 120 force')
  p.server.runCommandSilent(at + 'playsound minecraft:item.trident.riptide_3 player @a ~ ~ ~ 1 0.8')
  if (hit > 0) p.displayClientMessage(Text.aqua('Tidal Wave! ').append(Text.gray('Hit ' + hit)), true)
  event.cancel()
})

// Tell everyone when someone earns a legendary reward (FTB Quests gives the item; this just celebrates it)
PlayerEvents.inventoryChanged(event => {
  let p = event.player
  let id = event.item.id
  if (id != TIDECALLER && id != CROWN) return
  let key = 'legend_announced_' + (id == TIDECALLER ? 'tide' : 'crown')
  if (p.persistentData.getBoolean(key)) return
  p.persistentData.putBoolean(key, true)
  let what = id == TIDECALLER ? 'the Tidecaller (all 7 legendary fish!)' : "the Angler's Crown"
  p.server.tell(Text.gold(p.username + ' earned ' + what))
  p.server.runCommandSilent('execute as ' + p.username + ' at @s run playsound minecraft:ui.toast.challenge_complete player @a ~ ~ ~ 1 1')
})
