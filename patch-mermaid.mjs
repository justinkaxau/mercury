import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetFile = path.join(__dirname, 'node_modules', '@quartz-community', 'obsidian-flavored-markdown', 'dist', 'index.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  let modified = false;
  const oldInit = 't.initialize({startOnLoad:!1,securityLevel:"loose",theme:a?"dark":"base",themeVariables:{fontFamily:r["--codeFont"],primaryColor:r["--light"],primaryTextColor:r["--darkgray"],primaryBorderColor:r["--tertiary"],lineColor:r["--darkgray"],secondaryColor:r["--secondary"],tertiaryColor:r["--tertiary"],clusterBkg:r["--light"],edgeLabelBackground:r["--highlight"]}})';
  const newInit = 't.initialize({startOnLoad:!1,securityLevel:"loose",theme:a?"dark":"base"})';
  if (content.includes(oldInit)) {
    content = content.replace(oldInit, newInit);
    modified = true;
  }
  const oldBtn = 'let a=e[r],i=a.parentElement,d=i.querySelector(".clipboard-button"),u=i.querySelector(".expand-button"),v=window.getComputedStyle(d),w=d.offsetWidth+parseFloat(v.marginLeft||"0")+parseFloat(v.marginRight||"0");';
  const newBtn = 'let a=e[r],i=a.parentElement,d=i.querySelector(".clipboard-button"),u=i.querySelector(".expand-button"),v=d?window.getComputedStyle(d):null,w=d&&v?(d.offsetWidth+parseFloat(v.marginLeft||"0")+parseFloat(v.marginRight||"0")):0;';
  if (content.includes(oldBtn)) {
    content = content.replace(oldBtn, newBtn);
    modified = true;
  }
  if (modified) {
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-mermaid] Patched successfully.');
  }
}
