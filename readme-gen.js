#!/usr/bin/env node
// readme-gen : génère un README.md de départ à partir du projet (package.json, composer.json, requirements.txt...).
// Voir README.md pour toutes les options.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AIDE = `readme-gen : génère un README.md de départ pour le projet du dossier courant.

Usage :
  readme-gen [dossier] [options]

Options :
  --force       Écrase un README.md existant
  --dry-run     Affiche le README dans le terminal sans rien écrire
  -h, --help    Affiche cette aide

Projets reconnus : Node (package.json), PHP (composer.json), Python (requirements.txt,
pyproject.toml) et site statique (index.html).`;

const IGNORES = new Set(['node_modules', '.git', '.DS_Store', 'dist', 'build', '.env', 'vendor', '__pycache__', '.venv',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock']);

function arborescence(dir, profondeur = 0, prefixe = '') {
  if (profondeur > 1) return '';
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !IGNORES.has(e.name) && !e.name.startsWith('.env'))
    .sort((a, b) => b.isDirectory() - a.isDirectory() || a.name.localeCompare(b.name))
    .map(e => `${prefixe}${e.name}${e.isDirectory() ? '/' : ''}\n` +
      (e.isDirectory() ? arborescence(path.join(dir, e.name), profondeur + 1, prefixe + '  ') : '')).join('');
}

function lireJson(fichier) {
  try { return JSON.parse(fs.readFileSync(fichier, 'utf8')); } catch { return null; }
}

function urlDepot(dir, pkg) {
  let u = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository && pkg.repository.url;
  if (!u) { try { u = execSync('git remote get-url origin', { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* pas de dépôt git */ } }
  if (!u) return null;
  return u.replace(/^git\+/, '').replace(/^git@([^:]+):/, 'https://$1/').replace(/\.git$/, '');
}

function licence(dir, pkg) {
  if (pkg.license) return pkg.license;
  const f = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING'].map(n => path.join(dir, n)).find(fs.existsSync);
  if (!f) return null;
  const t = fs.readFileSync(f, 'utf8').slice(0, 400);
  return /MIT License/i.test(t) ? 'MIT' : /Apache License/i.test(t) ? 'Apache-2.0'
    : /GNU (AFFERO |LESSER )?GENERAL PUBLIC/i.test(t) ? 'GPL' : /BSD/i.test(t) ? 'BSD' : 'voir le fichier LICENSE';
}

function analyser(dir) {
  const a = f => fs.existsSync(path.join(dir, f));
  const pkg = lireJson(path.join(dir, 'package.json')) || {};
  const composer = lireJson(path.join(dir, 'composer.json')) || {};
  const type = a('package.json') ? 'node' : a('composer.json') ? 'php'
    : (a('requirements.txt') || a('pyproject.toml')) ? 'python' : a('index.html') ? 'web' : 'inconnu';
  const nom = pkg.name || composer.name || path.basename(path.resolve(dir));
  return {
    type, nom,
    description: pkg.description || composer.description || null,
    pkg, composer,
    depot: urlDepot(dir, pkg),
    licence: licence(dir, pkg) || composer.license,
    auteur: typeof pkg.author === 'string' ? pkg.author : pkg.author && pkg.author.name,
    arbre: arborescence(dir),
    python: a('requirements.txt') ? 'requirements.txt' : null,
    principal: ['main.py', 'app.py', 'manage.py'].find(a),
  };
}

function construire(p) {
  const s = [];
  s.push(`# ${p.nom}`, '', p.description || 'Décris ici en une phrase ce que fait le projet.', '');

  const prerequis = [];
  if (p.pkg.engines && p.pkg.engines.node) prerequis.push(`Node.js ${p.pkg.engines.node.replace(/^>=\s*/, '')} ou plus`);
  if (p.type === 'php') prerequis.push(`PHP${p.composer.require && p.composer.require.php ? ' ' + p.composer.require.php : ''} et Composer`);
  if (p.type === 'python') prerequis.push('Python 3');
  if (prerequis.length) s.push('## Prérequis', '', ...prerequis.map(x => `- ${x}`), '');

  const cloner = p.depot ? `git clone ${p.depot}.git\ncd ${path.basename(p.depot)}` : `cd ${p.nom}`;
  const etapes = { node: 'npm install', php: 'composer install',
    python: `python -m venv .venv\nsource .venv/bin/activate   # Windows : .venv\\Scripts\\activate${p.python ? '\npip install -r requirements.txt' : ''}`,
    web: '', inconnu: '' }[p.type];
  s.push('## Installation', '', '```bash', cloner + (etapes ? '\n' + etapes : ''), '```', '');
  if (p.type === 'web') s.push('Aucune installation : ouvre `index.html` dans ton navigateur.', '');

  const bin = p.pkg.bin && (typeof p.pkg.bin === 'string' ? { [p.nom]: p.pkg.bin } : p.pkg.bin);
  if (bin) {
    s.push('## Utilisation', '', '```bash', ...Object.entries(bin).map(([nom, f]) => `node ${f.replace(/^\.\//, '')} --help   # commande « ${nom} »`), '```', '');
  } else if (p.principal) {
    s.push('## Utilisation', '', '```bash', `python ${p.principal}`, '```', '');
  }

  const scripts = Object.entries(p.pkg.scripts || {});
  if (scripts.length) s.push('## Commandes', '', '| Commande | Action |', '|---|---|', ...scripts.map(([k, v]) => `| \`npm run ${k}\` | \`${v}\` |`), '');

  const deps = [...Object.keys(p.pkg.dependencies || {}), ...Object.keys(p.composer.require || {}).filter(k => k !== 'php')];
  const dev = [...Object.keys(p.pkg.devDependencies || {}), ...Object.keys(p.composer['require-dev'] || {})];
  if (deps.length || dev.length) {
    s.push('## Dépendances', '');
    if (deps.length) s.push(...deps.map(d => `- \`${d}\``));
    if (dev.length) s.push('', 'Développement :', ...dev.map(d => `- \`${d}\``));
    s.push('');
  }

  s.push('## Structure', '', '```text', p.arbre.trimEnd(), '```', '');
  s.push('## Licence', '', `${p.licence || 'À préciser'}${p.auteur ? ` © ${p.auteur}` : ''}`, '');
  return s.join('\n');
}

function main(argv) {
  if (argv.includes('-h') || argv.includes('--help')) { console.log(AIDE); return 0; }
  const dir = argv.find(a => !a.startsWith('-')) || '.';
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) { console.error(`Dossier introuvable : ${dir}`); return 1; }
  const fichier = path.join(dir, 'README.md');
  const md = construire(analyser(dir));
  if (argv.includes('--dry-run')) { process.stdout.write(md); return 0; }
  if (fs.existsSync(fichier) && !argv.includes('--force')) {
    console.error('README.md existe déjà. Utilise --force pour l’écraser, ou --dry-run pour voir le résultat.');
    return 1;
  }
  fs.writeFileSync(fichier, md);
  console.log(`${fichier} généré (projet ${analyser(dir).type}). Relis-le et complète la description.`);
  return 0;
}

module.exports = { analyser, construire };
if (require.main === module) process.exit(main(process.argv.slice(2)));
