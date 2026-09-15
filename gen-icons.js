const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const SRC = 'C:/Users/liuyu/WorkBuddy/2026-09-15-20-37-25/study-whale';
const svg = fs.readFileSync(path.join(SRC, 'icon.svg'), 'utf8');

function render(svgString, size) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: size },
    background: '#FFF4FA',
  });
  return resvg.render().asPng();
}

// 1) 普通图标 192 / 512
fs.writeFileSync(path.join(SRC, 'icon-192.png'), render(svg, 192));
fs.writeFileSync(path.join(SRC, 'icon-512.png'), render(svg, 512));

// 2) maskable 图标：把原图缩到 80% 居中，背景铺满，留出安全区
const inner = svg
  .replace(/^[\s\S]*?<svg[^>]*>/i, '')   // 去掉开头的 <svg ...>
  .replace(/<\/svg>\s*$/i, '');          // 去掉结尾的 </svg>
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="-30 -30 300 300">
  <rect x="-30" y="-30" width="300" height="300" fill="#FFF4FA"/>
  ${inner}
</svg>`;
fs.writeFileSync(path.join(SRC, 'icon-maskable-512.png'), render(maskable, 512));

console.log('icons generated: icon-192.png, icon-512.png, icon-maskable-512.png');
