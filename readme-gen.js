#!/usr/bin/env node
// readme-gen : génère un README.md de départ à partir de package.json et de l’arborescence.
// Usage : node dev/readme-gen.js [--force]
const fs = require('fs');
const path = require('path');

if (fs.existsSync('README.md') && !process.argv.includes('--force')) {
  console.error('README.md existe déjà. Utilise --force pour l’écraser.');
  process.exit(1);
}
const pkg = fs.existsSync('package.json') ? JSON.parse(fs.readFileSync('package.json', 'utf8')) : {};
const IGNORE = new Set(['node_modules', '.git', '.DS_Store', 'dist', 'build']);

function tree(dir, depth = 0, prefix = '') {
  if (depth > 1) return '';
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !IGNORE.has(e.name)).sort((a, b) => b.isDirectory() - a.isDirectory() || a.name.localeCompare(b.name));
  return entries.map(e => {
    const line = `${prefix}${e.name}${e.isDirectory() ? '/' : ''}\n`;
    return line + (e.isDirectory() ? tree(path.join(dir, e.name), depth + 1, prefix + '  ') : '');
  }).join('');
}

const name = pkg.name || path.basename(process.cwd());
const scripts = Object.entries(pkg.scripts || {}).map(([k, v]) => `- \`npm run ${k}\` : \`${v}\``).join('\n') || '- (aucun script défini)';
const deps = Object.keys(pkg.dependencies || {}).map(d => `- ${d}`).join('\n') || '- (aucune dépendance)';

const md = `# ${name}

${pkg.description || 'Décris ici en une phrase ce que fait le projet.'}

## Installation

\`\`\`bash
git clone <url-du-depot>
cd ${name}
npm install
\`\`\`

## Commandes

${scripts}

## Dépendances

${deps}

## Structure

\`\`\`
${tree('.')}\`\`\`

## Licence

${pkg.license || 'À préciser'}
`;
fs.writeFileSync('README.md', md);
console.log('README.md généré.');
