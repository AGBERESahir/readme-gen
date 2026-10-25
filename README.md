# readme-gen

Génère un **README.md de départ** pour ton projet en une commande, à partir de ce que ton dépôt contient déjà : `package.json`, `composer.json`, `requirements.txt`, arborescence, fichier `LICENSE`, adresse `git remote`.

Le résultat n'est pas un README final : c'est une base propre (prérequis, installation, utilisation, commandes, dépendances, structure, licence) que tu complètes en quelques minutes au lieu de partir d'une page blanche.

- Aucune dépendance, un seul fichier, Node 18 ou plus.
- Reconnaît les projets **Node**, **PHP**, **Python** et **site statique**.
- Ne remplace jamais un README existant sans `--force`.

## Installation

Sans rien installer (depuis GitHub), dans le dossier de ton projet :

```bash
npx github:AGBERESahir/readme-gen --dry-run
```

Ou en clonant le dépôt :

```bash
git clone https://github.com/AGBERESahir/readme-gen.git
cd readme-gen
node readme-gen.js /chemin/vers/ton/projet --dry-run
```

## Utilisation

```text
readme-gen [dossier] [options]
```

Sans dossier, le dossier courant est utilisé.

| Option | Effet |
|---|---|
| `--dry-run` | Affiche le README dans le terminal sans rien écrire. **Commence par là.** |
| `--force` | Écrase un `README.md` existant (sans cette option, l'outil refuse). |
| `-h`, `--help` | Affiche l'aide. |

Parcours conseillé :

```bash
readme-gen --dry-run          # je regarde le résultat
readme-gen                    # je l'écris dans README.md
# puis : je complète la description, j'ajoute un exemple et une capture d'écran
```

## Ce que l'outil détecte

| Projet reconnu | Détecté grâce à | Installation générée |
|---|---|---|
| Node | `package.json` | `npm install` |
| PHP | `composer.json` | `composer install` |
| Python | `requirements.txt` ou `pyproject.toml` | `python -m venv .venv`, activation, `pip install -r requirements.txt` |
| Site statique | `index.html` | « ouvre `index.html` dans ton navigateur » |

Informations reprises automatiquement quand elles existent :

- **Description** : champ `description` du `package.json` ou du `composer.json`.
- **Prérequis** : `engines.node`, version de PHP, Python 3.
- **Adresse de clonage** : champ `repository`, sinon `git remote get-url origin`.
- **Utilisation** : commandes du champ `bin`, ou `main.py` / `app.py` / `manage.py`.
- **Commandes** : tableau des `scripts` npm.
- **Dépendances** : production et développement.
- **Structure** : arborescence sur deux niveaux, sans `node_modules`, `.git`, `.env*`, fichiers verrous ni dossiers générés.
- **Licence** : champ `license`, sinon lecture du fichier `LICENSE` (MIT, Apache-2.0, GPL, BSD), plus l'auteur.

## Exemple de résultat

````markdown
# readme-gen

Génère un README.md de départ à partir du projet.

## Prérequis

- Node.js 18 ou plus

## Installation

```bash
git clone https://github.com/AGBERESahir/readme-gen.git
cd readme-gen
npm install
```

## Utilisation

```bash
node readme-gen.js --help   # commande « readme-gen »
```

## Licence

MIT © Sâhir AGBERE
````

## Après la génération : ce qu'il faut compléter

L'outil ne peut pas deviner ces éléments, et ce sont eux qui font un bon README :

1. une description qui dit **à quoi sert** le projet et **pour qui** ;
2. un exemple d'utilisation avec le résultat attendu ;
3. une capture d'écran ou un lien de démonstration pour un projet visuel ;
4. les limites connues.

Vérifie aussi tes liens avec [link-check](https://github.com/AGBERESahir/link-check) avant de publier.

## Limites

- Les projets d'autres langages (Go, Rust, Java…) reçoivent un README minimal : titre, structure, licence.
- L'arborescence s'arrête à deux niveaux.
- Le texte généré est en français.

## Développement

```bash
npm test     # tests node:test, aucune dépendance à installer
```

Les fonctions `analyser` et `construire` sont exportées par `readme-gen.js`.

## Licence

MIT, voir [LICENSE](LICENSE).
