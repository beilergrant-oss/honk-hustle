// sceneArt.js - the painted scenery and button artwork. The paths are swapped for inlined data URLs by the bundler,
// so every lookup must go through artUrl()/uiUrl() with a plain string argument.
export const ART_THEMES = ['city', 'beach', 'forest', 'winter', 'halloween', 'space', 'autumn', 'jungle', 'candy', 'desert', 'ocean', 'spring'];
export const hasArt = (bd) => ART_THEMES.includes(bd);
export const artUrl = (bd, side) => 'img/bg/' + bd + '_' + side + '.png';
export const uiUrl = (name) => 'img/ui/' + name + '.png';
// The two painted columns that frame the board (and the home screen) for a theme.
export const sideArt = (bd) => (hasArt(bd) ? `<img class="sa sa-l" src="${artUrl(bd, 'l')}" alt="" draggable="false"><img class="sa sa-r" src="${artUrl(bd, 'r')}" alt="" draggable="false">` : '');

const _imgs = new Map();
// A preloaded image of one painted column, for drawing into the game canvas.
export function artImg(bd, side) {
  const k = bd + '_' + side;
  if (!_imgs.has(k)) { const im = new Image(); im.src = artUrl(bd, side); _imgs.set(k, im); }
  return _imgs.get(k);
}
