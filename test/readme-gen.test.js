const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { analyser, construire } = require('../readme-gen.js');

function projet(fichiers) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rg-'));
  for (const [nom, contenu] of Object.entries(fichiers)) {
    fs.mkdirSync(path.dirname(path.join(dir, nom)), { recursive: true });
    fs.writeFileSync(path.join(dir, nom), contenu);
  }
  return dir;
}

test('projet Node : prérequis, utilisation (bin), commandes et dépendances', () => {
  const dir = projet({ 'package.json': JSON.stringify({
    name: 'outil', description: 'Un outil', license: 'MIT', engines: { node: '>=18' },
    bin: { outil: 'outil.js' }, scripts: { test: 'node --test' }, dependencies: { chalk: '^5' },
    repository: { url: 'git+https://github.com/moi/outil.git' } }), 'outil.js': '' });
  const md = construire(analyser(dir));
  assert.match(md, /^# outil/);
  assert.match(md, /Node\.js 18 ou plus/);
  assert.match(md, /git clone https:\/\/github\.com\/moi\/outil\.git/);
  assert.match(md, /node outil\.js --help/);
  assert.match(md, /`npm run test`/);
  assert.match(md, /- `chalk`/);
});

test('projet Python : venv et pip', () => {
  const md = construire(analyser(projet({ 'requirements.txt': 'flask\n', 'main.py': '' })));
  assert.match(md, /pip install -r requirements\.txt/);
  assert.match(md, /python main\.py/);
});

test('site statique : ouvrir index.html', () => {
  const md = construire(analyser(projet({ 'index.html': '<html></html>' })));
  assert.match(md, /ouvre `index\.html`/);
});

test('la licence est lue dans le fichier LICENSE et les secrets sont masqués', () => {
  const dir = projet({ 'LICENSE': 'MIT License\n\nCopyright', '.env': 'A=1', 'package-lock.json': '{}', 'a.js': '' });
  const p = analyser(dir);
  assert.strictEqual(p.licence, 'MIT');
  assert.ok(!p.arbre.includes('.env') && !p.arbre.includes('package-lock'));
});
