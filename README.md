# Orbytek — Site vitrine

Site statique, thème cuivre et noir, sans dépendances à installer. Ouvrir index.html dans un navigateur.

- index.html : accueil, services, support IT, présentation et contact.
- tarifs.html : grille de tarifs confirmée et support à 60 €/h.
- creations.html : portfolio prêt à compléter. Ajouter chaque réalisation réelle dans la zone project-grid avec une image, un titre, le besoin traité et éventuellement un lien. Retirer portfolio-empty lors du premier ajout.
- styles.css : thème commun et affichage mobile.
- orbytek-logo.png : logo original fourni.

Le formulaire de contact conserve le service FormSubmit et les coordonnées existants. Le bon fonctionnement de l’envoi dépend de son activation côté destinataire.

Les tarifs sont indicatifs ; le devis précise le périmètre et les conditions.

Les fichiers peuvent être publiés ensemble sur l’hébergement statique existant. Aucun déploiement automatique n’est effectué par ces modifications.

## Trois nouvelles démonstrations premium

Aurelia (immobilier), Maison Braise (restaurant) et Vert & Pierre (paysagisme) sont ajoutés à `creations.html`. Les exports publiables sont dans `demos/`, et les sources Next.js / Tailwind / Framer Motion dans `premium-sites/`.

Pour les ouvrir localement : `cd premium-sites`, puis `npm run serve`, et visiter http://localhost:4173/creations.html. Les détails de construction, fonctions et raccordements clients sont dans `premium-sites/README.md`.
