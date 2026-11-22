// Freedom V4: Sea Shanties - tag fixes (Nov 22)
// Reforged's bow and shield pools still use old Forge tags (forge:tools/bows, forge:shields) that nothing fills on NeoForge 1.21,
// so bows and shields could never be reforged. Point them at the common c: tags.
ServerEvents.tags('item', event => {
  event.add('forge:tools/bows', '#c:tools/bow')
  event.add('forge:shields', '#c:tools/shield')
})
