// Freedom V4: Sea Shanties - Well Fed. Eating a proper meal (anything in #farmersdelight:meals: bowls, plates, feast servings)
// gives the Well Fed effect on top of the meal's own buffs.
//   A meal you haven't had in your last 4 meals -> Well Fed II for 8 min (+4 max health, +8% speed, +1 attack damage)
//   Repeating a recent meal                    -> Well Fed I for 4 min  (+2 max health, +4% speed, +0.5 attack damage)
// Cooking a variety of food pays off; living on one stew doesn't.

const $MobEffectInstance3 = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
const $BuiltInRegistries3 = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $RL3 = Java.loadClass('net.minecraft.resources.ResourceLocation')
const RECENT_MEALS = 4

ItemEvents.foodEaten(event => {
  let p = event.player
  if (!p) return
  let item = event.item
  if (!item.hasTag('farmersdelight:meals')) return
  let id = String(item.id)
  let recent = String(p.persistentData.getString('ironclad_recent_meals') || '')
  let list = recent.length ? recent.split(',') : []
  let fresh = list.indexOf(id) < 0
  list = list.filter(x => x != id)
  list.unshift(id)
  p.persistentData.putString('ironclad_recent_meals', list.slice(0, RECENT_MEALS).join(','))

  let effect = $BuiltInRegistries3.MOB_EFFECT.getHolder($RL3.parse('ironclad:well_fed')).get()
  let amp = fresh ? 1 : 0
  let ticks = fresh ? 9600 : 4800
  p.addEffect(new $MobEffectInstance3(effect, ticks, amp, false, true, true))
  if (fresh) p.displayClientMessage(Text.gold('Well Fed II ').append(Text.gray('- a new dish! 8 minutes')), true)
  else p.displayClientMessage(Text.yellow('Well Fed I ').append(Text.gray('- try a different meal for level II')), true)
})
