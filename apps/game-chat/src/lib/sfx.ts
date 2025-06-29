import { Howl } from 'howler'

export const SFX = {
  spellPreparing: new Howl({ src: ['/sfx/spell-preparing.ogg'], preload: true }),
  spellError: new Howl({ src: ['/sfx/spell-error.ogg'], preload: true }),
  spellCast: new Howl({
    src: ['/sfx/spell-cast.ogg'],
    preload: true,
  }),
  spell: new Howl({
    src: ['/sfx/spell-sprite.ogg'],
    sprite: {
      arrow: [0, 2000],
      deflect: [5000, 2000],
      choke: [10000, 2000],
      throw: [15000, 2000],
    },
    preload: true,
  }),
  buttonClick: new Howl({
    src: ['/sfx/button-click.ogg'],
    preload: true,
  }),
}
