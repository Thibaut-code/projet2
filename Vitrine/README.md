# Thibaut Courtois — Site vitrine

Version Éditorial : noir et blanc, accents jaunes et portrait dans « À propos ».
Site statique autonome : aucun npm, serveur applicatif ou base de données nécessaire.

## Ouvrir dans Visual Studio Code

1. Décompressez l'archive.
2. Dans VS Code : Fichier > Ouvrir le dossier, puis sélectionnez le dossier contenant index.html.
3. Ouvrez index.html dans votre navigateur pour voir le site..

## Fichiers.

- `index.html` : tous les textes et la structure du site.
- `styles.css` : présentation, couleurs, affichage mobile et effet noir et blanc du portrait.
- `architecture.webp` : image d'accueil super.
- `thibaut-courtois.png` : portrait original ; le noir et blanc est appliqué par CSS.
- `robots.txt` : consignes aux moteurs de recherche.
- `Set-SiteUrl.ps1` : configure l'adresse canonique et génère le sitemap pour votre adresse définitive.
- `.nojekyll` : publication statique sur GitHub Pages.
- `.gitignore` : exclusions usuelles.

Aucun fichier JavaScript n'est nécessaire : les menus et liens de navigation utilisent les ancres HTML.

## Envoyer sur GitHub

Git doit être installé. Créez un dépôt GitHub vide, sans README ni .gitignore, puis ouvrez le terminal de VS Code dans ce dossier.
Remplacez VOTRE-COMPTE et VOTRE-DEPOT ci-dessous par les valeurs réelles :

```sh
git init
git add .
git commit -m "Ajout du site vitrine"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/VOTRE-DEPOT.git
git push -u origin main
```

Git peut vous demander de vous connecter à GitHub. S'il demande une identité d'auteur, configurez votre nom et votre adresse e-mail Git avant le commit.

## Publier sur GitHub Pages

1. Dans votre dépôt GitHub : Settings > Pages.
2. Source : Deploy from a branch.
3. Branche : main ; dossier : / (root).
4. Enregistrez avec Save et attendez la publication.
5. GitHub affiche l'adresse, généralement https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/.

Les fichiers doivent être à la racine du dépôt, pas dans un sous-dossier supplémentaire.
La publication GitHub Pages rend normalement le site accessible publiquement ; le contrôle d'accès privé de la version ChatGPT n'est pas inclus dans cet export.
Avec GitHub Free, utilisez un dépôt public pour GitHub Pages.

Documentation : https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Configurer le référencement pour la nouvelle adresse

L'ancienne adresse ChatGPT a été retirée de l'export. Une fois votre URL définitive connue, dans un terminal PowerShell ouvert dans le dossier :

```powershell
.\Set-SiteUrl.ps1 -SiteUrl "https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/"
```

Cela ajoute l'URL canonique à index.html, crée sitemap.xml et met à jour robots.txt.
Si Windows bloque le script, appliquez la politique de scripts autorisée sur votre poste ou faites ces trois modifications manuellement. Ne modifiez pas une politique d'entreprise sans autorisation.
Pour un domaine personnel, utilisez directement son URL définitive. Relancez le script si l'adresse change.
Sur un site GitHub Pages sous /VOTRE-DEPOT/, robots.txt n'est pas à la racine du domaine : soumettez directement l'URL du sitemap dans Google Search Console.

## Envoyer les modifications suivantes

```sh
git add .
git commit -m "Mise a jour du site"
git push
```

## À compléter avant de partager avec les clients

La section Contact présente le projet, mais ne contient encore ni adresse e-mail, ni téléphone, ni formulaire d'envoi. Ajoutez vos coordonnées réelles, par exemple un lien mailto. Les boutons actuels conduisent à cette section.

L'export contient le code du site et les images, sans identifiants, historique Git ou configuration d'hébergement ChatGPT. La version actuellement hébergée dans ChatGPT n'est pas modifiée par cet export.
