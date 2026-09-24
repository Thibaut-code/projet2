# Facture Facile avec Supabase

1. Exécuter dans Supabase le SQL des tables `companies`, `clients`, `documents`, `document_lines`, puis celui de `profiles` si vous souhaitez les profils utilisateurs.
2. Dans **Project Settings > API Keys**, relever l'URL du projet et la clé **publishable** (`sb_publishable_...`) ou l'ancienne clé **anon**. Les renseigner dans `config.js`. Ne jamais utiliser de clé **secret** ou **service_role** dans un site GitHub Pages.
3. Dans **Authentication > Providers > Email**, activer la connexion par e-mail. Dans **Authentication > URL Configuration**, définir l'URL publique GitHub Pages comme `Site URL` et l'ajouter dans `Redirect URLs` (par exemple `https://UTILISATEUR.github.io/DEPOT/`). Conserver la confirmation e-mail si souhaitée.
4. Mettre `index.html`, `style.css`, `app.js`, `radiateur.png`, les quatre images `theme-*.png` et `config.js` à la racine du dépôt GitHub Pages, puis ouvrir le site en HTTPS. La bibliothèque Supabase est chargée depuis jsDelivr.
5. Créer un compte, confirmer l'e-mail si demandé, se connecter et renseigner « Mon entreprise » avant de créer un document.

Les données de démonstration précédentes ne sont pas importées. Les documents existants dans les anciennes sessions n'étaient pas persistés. Le brouillon en cours reste seulement dans la page jusqu'à l'enregistrement.

**Avant d'émettre de vraies factures** : mettre en place une attribution transactionnelle des numéros côté serveur, vérifier les mentions obligatoires et les règles de TVA applicables, puis contrôler les besoins de facturation électronique. Les numéros générés ici dans le navigateur peuvent se heurter entre deux appareils ou être réutilisés après suppression. Le document est enregistré avant ses lignes ; si l'enregistrement des lignes échoue, l'application tente de supprimer le document incomplet.

Pour mettre à jour un site déjà configuré, conservez votre `config.js` existant : le fichier dans cette archive est un exemple. Le dessin `radiateur.png` est nécessaire au nouvel accueil.

## Thèmes par métier

Exécutez `theme-migration.sql` dans l'éditeur SQL Supabase pour sauvegarder le thème du compte et le retrouver sur vos autres appareils. Cette migration ajoute la colonne `theme` à `public.companies` et définit `plombier` par défaut. Sans cette étape, le choix fonctionne sur l'appareil utilisé grâce au stockage local, mais ne se synchronise pas.

Après connexion, utilisez le bouton **Thème** en haut à droite pour choisir plomberie & chauffage, jardinage, électricité, peinture ou menuiserie. Les couleurs, le dessin de l'accueil, les textes d'ambiance et les prestations suggérées changent. Les factures existantes et leurs données ne sont pas modifiées. Le thème plomberie & chauffage et `radiateur.png` restent inchangés et sont sélectionnés par défaut.

Pour mettre à jour votre dépôt existant, publiez `index.html`, `style.css`, `app.js`, les quatre images `theme-*.png` et `theme-migration.sql` dans le même dossier que l'actuel `radiateur.png`. Gardez votre `config.js` déjà configuré.
