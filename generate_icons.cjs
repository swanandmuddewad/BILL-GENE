const fs = require('fs');

const svgHeader192 = `<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="192" height="192" rx="32" fill="#2563EB"/>
<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="60" font-weight="bold" fill="white">BG</text>
</svg>`;

const svgHeader512 = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="512" height="512" rx="100" fill="#2563EB"/>
<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="160" font-weight="bold" fill="white">BG</text>
</svg>`;

fs.writeFileSync('public/pwa-192x192.svg', svgHeader192);
fs.writeFileSync('public/pwa-512x512.svg', svgHeader512);

console.log("SVG created");
