const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const target = path.join(root, 'naruto_ascensao_v0.2.2.html');
let html = fs.readFileSync(target, 'utf8');
const start = html.indexOf('const BASELINE=') + 'const BASELINE='.length;
let end = start + 1;
for (; end < html.length; end++) {
  if (html[end] === '\\') { end++; continue; }
  if (html[end] === '"') { end++; break; }
}
let base = JSON.parse(html.slice(start, end));
base = base.replace(/<style id="shinobi-ui">[\s\S]*?<\/style>/g, '').replace(/<script id="shinobi-ui-code">[\s\S]*?<\/script>/g, '');
if (!base.includes("['glasses'")) base = base.replace("['coat','Traje',Object.keys(coats)]", "['coat','Traje',Object.keys(coats)],['glasses','Óculos',['Sem óculos','Escuros','Redondos']]");
const font = fs.readFileSync(path.join(__dirname, 'display.ttf')).toString('base64');
const css = '@font-face{font-family:Shinobi;src:url(data:font/ttf;base64,' + font + ') format("truetype");font-weight:700;font-display:swap}' + fs.readFileSync(path.join(__dirname, 'screen.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'screen.js'), 'utf8');
base = base.replace('</head>', '<style id="shinobi-ui">' + css + '</style></head>');
base = base.replace('</body></html>', '<script id="shinobi-ui-code">' + js + '</script></body></html>');
html = html.slice(0, start) + JSON.stringify(base).replace(/</g, '\\u003c') + html.slice(end);
fs.writeFileSync(target, html);
console.log('Interface incorporada à v0.2.2.');
