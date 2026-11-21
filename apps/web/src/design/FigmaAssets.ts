// Original assets exported from the user's Skillflix Figma design.
export const figmaAssets = {
  logo: '/figma/a68b6.svg',
  react: '/figma/032d2.png',
  development: '/figma/29bd9.png',
  ai: '/figma/35fb2.png',
  data: '/figma/c007c.png',
  design: '/figma/5ccbe.png',
  marketing: '/figma/8cff3.png',
  categories: '/figma/ae683.png',
  guidance: '/figma/6438a.png',
  python: '/figma/16358.png',
  figma: '/figma/3c645.png',
  paths: '/figma/6af52.png',
  map: '/figma/161fd.png',
  playlists: '/figma/f9a68.png',
  javascript: '/figma/81f58.png',
  algorithms: '/figma/6f329.png',
  machineLearning: '/figma/ceb73.png',
  linux: '/figma/bb9e3.png',
  request: '/figma/40bc6.png',
};
export function figmaArtwork(title: string, category = '') {
  const text = `${title} ${category}`.toLowerCase();
  if (/react/.test(text)) return figmaAssets.react;
  if (/python/.test(text)) return figmaAssets.python;
  if (/figma/.test(text)) return figmaAssets.figma;
  if (/ui.?ux|design/.test(text)) return figmaAssets.design;
  if (/machine/.test(text)) return figmaAssets.machineLearning;
  if (/\bai\b|intelligen/.test(text)) return figmaAssets.ai;
  if (/data|excel|analy/.test(text)) return figmaAssets.data;
  if (/market|business|finance/.test(text)) return figmaAssets.marketing;
  if (/linux/.test(text)) return figmaAssets.linux;
  if (/javascript/.test(text)) return figmaAssets.javascript;
  return figmaAssets.development;
}
