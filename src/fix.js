const fs = require('fs');

const path = './src/App.jsx';

let text = fs.readFileSync(path, 'utf8');

text = text
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/…/g, '...');

fs.writeFileSync(path, text, 'utf8');

console.log('App.jsx fixad!');
