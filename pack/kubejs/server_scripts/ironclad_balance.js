// Freedom V4: Sea Shanties - power balance
// 1. One-shot protection for players (any source except void / /kill): survive on 1 heart, 30 s cooldown.
// 2. Boss hits on players capped at 60% of the player's max health (after armour).
// 3. Bosses can't be one-shot: one hit deals at most 5% of the boss's max health (at least 15).
// 4. Boss tiers (early x1.5 HP/x1.25 dmg, mid x2/x1.5, endgame x3/x1.75), health floors, +40% HP per extra player nearby (max +80%).
// 5. Endgame bosses ignore the caps against players below 20 armour (no rushing the endgame).

const $Player = Java.loadClass('net.minecraft.world.entity.player.Player')
const $DamageTypeTags = Java.loadClass('net.minecraft.tags.DamageTypeTags')
const $Attributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
const $AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
const $Operation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
const $RL = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
const $MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
const $Component = Java.loadClass('net.minecraft.network.chat.Component')

// boss id -> minimum max health (0 = no floor, just counts as a boss)
const BOSSES = {
  'cataclysm:ignis': 0, 'cataclysm:netherite_monstrosity': 0, 'cataclysm:the_harbinger': 0, 'cataclysm:maledictus': 0,
  'cataclysm:ender_guardian': 0, 'cataclysm:ancient_remnant': 0, 'cataclysm:the_prowler': 0, 'cataclysm:ender_golem': 0,
  'cataclysm:scylla': 0, 'cataclysm:the_leviathan': 0,
  'iceandfire:fire_dragon': 0, 'iceandfire:ice_dragon': 0, 'iceandfire:lightning_dragon': 0, 'iceandfire:sea_serpent': 0,
  'iceandfire:cyclops': 200, 'iceandfire:gorgon': 150, 'iceandfire:dread_lich': 150, 'iceandfire:hydra': 0, 'iceandfire:siren': 0,
  'block_factorys_bosses:pirate_captain': 200, 'block_factorys_bosses:infernal_dragon': 300, 'block_factorys_bosses:underworld_knight': 0,
  'block_factorys_bosses:sandworm': 200, 'block_factorys_bosses:yeti': 0, 'block_factorys_bosses:kraken': 0,
  'aquamirae:captain_cornelia': 0, 'aquamirae:maze_mother': 0,
  'mowziesmobs:frostmaw': 0, 'mowziesmobs:ferrous_wroughtnaut': 200, 'mowziesmobs:umvuthi': 200,
  'randy:big_randy': 200, 'randy:enraged_randy': 0, 'randy:christmas_randy': 0, 'randy:james_harden': 0,
  'friendsandfoes:wildfire': 0, 'minecraft:wither': 0, 'minecraft:warden': 0, 'minecraft:elder_guardian': 0, 'minecraft:ender_dragon': 0
}
// Endgame bosses keep full one-shot power against players who rush them under-geared (armour below MIN_ARMOR).
const ENDGAME = {
  'cataclysm:ignis': 1, 'cataclysm:netherite_monstrosity': 1, 'cataclysm:the_harbinger': 1, 'cataclysm:maledictus': 1,
  'cataclysm:ancient_remnant': 1, 'cataclysm:scylla': 1, 'cataclysm:the_leviathan': 1, 'cataclysm:ender_guardian': 1,
  'iceandfire:fire_dragon': 1, 'iceandfire:ice_dragon': 1, 'iceandfire:lightning_dragon': 1,
  'minecraft:wither': 1, 'minecraft:warden': 1, 'minecraft:ender_dragon': 1, 'randy:enraged_randy': 1, 'randy:james_harden': 1
}
const MIN_ARMOR = 20   // full diamond; below this, endgame bosses can one-shot
// Boss tiers: health and damage multipliers. Endgame = ENDGAME list; mid = MID list; everything else in BOSSES = early.
const MID = {
  'block_factorys_bosses:kraken': 1, 'aquamirae:captain_cornelia': 1, 'aquamirae:maze_mother': 1, 'mowziesmobs:frostmaw': 1,
  'mowziesmobs:ferrous_wroughtnaut': 1, 'mowziesmobs:umvuthi': 1, 'iceandfire:hydra': 1, 'iceandfire:sea_serpent': 1,
  'block_factorys_bosses:infernal_dragon': 1, 'block_factorys_bosses:underworld_knight': 1, 'cataclysm:ender_golem': 1,
  'cataclysm:the_prowler': 1, 'randy:christmas_randy': 1
}
const TIER = { early: { hp: 1.5, dmg: 1.25 }, mid: { hp: 2.0, dmg: 1.5 }, end: { hp: 3.0, dmg: 1.75 } }
function tierOf(id) { return ENDGAME[id] ? TIER.end : MID[id] ? TIER.mid : TIER.early }
const TIER_ID = $RL.parse('ironclad:boss_tier_health')
const SCALE_ID = $RL.parse('ironclad:boss_group_scaling')
const FLOOR_ID = $RL.parse('ironclad:boss_health_floor')
const LAST_STAND_COOLDOWN = 600   // ticks (30 s)

function bossId(e) {
  if (e == null || e instanceof $Player) return null
  let id = e.getEncodeId()
  if (id == null) return null
  id = String(id)
  return Object.prototype.hasOwnProperty.call(BOSSES, id) ? id : null
}

EntityEvents.beforeHurt(event => {
  let e = event.entity
  let src = event.source
  if (src.is($DamageTypeTags.BYPASSES_INVULNERABILITY)) return   // void, /kill
  let dmg = event.damage

  // --- damage to a boss: no one-shots ---
  if (bossId(e) != null) {
    let cap = Math.max(15, e.getMaxHealth() * 0.05)
    if (dmg > cap) event.setDamage(cap)
    return
  }

  if (!(e instanceof $Player)) return
  // --- damage to a player ---
  let attacker = src.actual   // KubeJS name for the attacking entity (getEntity() is not reachable from scripts)
  let aid = bossId(attacker)
  if (aid != null) {
    dmg = dmg * tierOf(aid).dmg      // tier damage boost
    event.setDamage(dmg)
  }
  if (aid != null && ENDGAME[aid] && e.getArmorValue() < MIN_ARMOR) {
    return   // rushed an endgame boss under-geared: no cap, no last stand
  }
  if (aid != null) {
    let bossCap = e.getMaxHealth() * 0.6
    if (dmg > bossCap) { dmg = bossCap; event.setDamage(dmg) }
  }
  let hp = e.getHealth()
  if (dmg >= hp && hp >= e.getMaxHealth() * 0.5) {
    let now = e.level.getGameTime()
    let last = e.persistentData.getLong('ironclad_last_stand')
    if (now - last >= LAST_STAND_COOLDOWN) {
      event.setDamage(Math.max(0, hp - 2))
      e.persistentData.putLong('ironclad_last_stand', now)
      e.addEffect(new $MobEffectInstance($MobEffects.DAMAGE_RESISTANCE, 60, 2))
      e.displayClientMessage($Component.literal('§6Last stand! §7That hit would have killed you.'), true)
    }
  }
})

EntityEvents.spawned(event => {
  let e = event.entity
  let id = bossId(e)
  if (id == null || e.level.isClientSide()) return
  let hpAttr = e.getAttribute($Attributes.MAX_HEALTH)
  if (hpAttr == null) return
  let changed = false
  let floor = BOSSES[id]
  if (floor > 0 && !hpAttr.hasModifier(FLOOR_ID) && hpAttr.getValue() < floor) {
    hpAttr.addPermanentModifier(new $AttributeModifier(FLOOR_ID, floor - hpAttr.getBaseValue(), $Operation.ADD_VALUE))
    changed = true
  }
  if (!hpAttr.hasModifier(TIER_ID)) {
    hpAttr.addPermanentModifier(new $AttributeModifier(TIER_ID, tierOf(id).hp - 1, $Operation.ADD_MULTIPLIED_TOTAL))
    changed = true
  }
  if (!hpAttr.hasModifier(SCALE_ID)) {
    let players = e.level.getEntitiesOfClass($Player, e.getBoundingBox().inflate(96)).size()
    let extra = Math.min(2, Math.max(0, players - 1))
    if (extra > 0) {
      hpAttr.addPermanentModifier(new $AttributeModifier(SCALE_ID, 0.4 * extra, $Operation.ADD_MULTIPLIED_TOTAL))
      changed = true
    }
  }
  if (changed) e.setHealth(e.getMaxHealth())
})
