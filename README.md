# Site vitrine — Patrick Morin Rembourrage

Projet statique (HTML/CSS/JS) prêt pour déploiement sur Vercel.

## Prérequis

- Git installé
- Compte GitHub (ou GitLab/Bitbucket)
- Compte Vercel

## Lancer en local

1. Ouvrir le dossier du projet
2. Double-cliquer `index.html` (ou):

```bash
npx serve . --listen 3000 --single --yes
```

Puis ouvrir `http://localhost:3000`.

## Structure

- `index.html` — page unique avec toutes les sections
- `assets/style.css` — styles (palette beige/doré/noir)
- `assets/script.js` — soumission Formspree + année footer
- `assets/img/` — images des réalisations
- `vercel.json` — configuration Vercel (statique)

## Configurer Formspree

- Remplacer l’URL dans `index.html` (attribut `action`) et/ou `assets/script.js` (`FORM_ENDPOINT`).

## Déploiement sur Vercel

1. Pousser le code sur un dépôt Git (GitHub recommandé):

```bash
git init
git add .
git commit -m "Initial commit: site vitrine PM"
# crée un repo GitHub, puis :
# git remote add origin https://github.com/<compte>/<repo>.git
# git push -u origin main
```

2. Aller sur Vercel → New Project
3. Importer le dépôt GitHub
4. Root directory: racine du projet
5. Framework preset: Other
6. Build & Output Settings: (laisser vide, c’est statique)
7. Output Directory: `./` (racine)
8. Déployer

Le fichier `vercel.json` gère les URLs propres. Aucune build n’est nécessaire.

## Donner un accès développeur (collaboration)

- GitHub: Settings → Collaborators → Add people → saisir l’email GitHub
- Vercel (projet): Settings → Members → Invite Member → saisir l’email → rôle `Developer`
- Vercel (team, si utilisée): Team Settings → Members → Invite

## Bonnes pratiques

- Placer les images dans `assets/img/`
- Nommer les fichiers `*-avant.jpg` et `*-apres.jpg` pour la section Réalisations (ou mettre à jour les `src`)
- Garder des commits courts et explicites

## Licence

Usage privé pour le site de Patrick Morin Rembourrage.

