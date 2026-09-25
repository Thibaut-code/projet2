# Facture Facile avec Supabase

1. Exécuter dans Supabase le SQL des tables `companies`, `clients`, `documents`, `document_lines`, puis celui de `profiles` si vous souhaitez les profils utilisateurs.
2. Dans **Project Settings > API Keys**, relever l'URL du projet et la clé **publishable** (`sb_publishable_...`) ou l'ancienne clé **anon**. Les renseigner dans `config.js`. Ne jamais utiliser de clé **secret** ou **service_role** dans un site GitHub Pages.
3. Dans **Authentication > Providers > Email**, activer la connexion par e-mail. Dans **Authentication > URL Configuration**, définir l'URL publique GitHub Pages comme `Site URL` et l'ajouter dans `Redirect URLs` (par exemple `https://UTILISATEUR.github.io/DEPOT/`). Conserver la confirmation e-mail si souhaitée.
4. Mettre `index.html`, `style.css`, `app.js`, `radiateur.png`, les quatre images `theme-*.png` et `config.js` à la racine du dépôt GitHub Pages, puis ouvrir le site en HTTPS. La bibliothèque Supabase est chargée depuis jsDelivr.
5. Créer un compte, confirmer l'e-mail si demandé, se connecter et renseigner « Mon entreprise » avant de créer un document.

Les données de démonstration précédentes ne sont pas importées. Les documents existants dans les anciennes sessions n'étaient pas persistés. Le brouillon en cours reste seulement dans la page jusqu'à l'enregistrement..

**Avant d'émettre de vraies factures** : mettre en place une attribution transactionnelle des numéros côté serveur, vérifier les mentions obligatoires et les règles de TVA applicables, puis contrôler les besoins de facturation électronique. Les numéros générés ici dans le navigateur peuvent se heurter entre deux appareils ou être réutilisés après suppression. Le document est enregistré avant ses lignes ; si l'enregistrement des lignes échoue, l'application tente de supprimer le document incomplet.

Pour mettre à jour un site déjà configuré, conservez votre `config.js` existant : le fichier dans cette archive est un exemple. Le dessin `radiateur.png` est nécessaire au nouvel accueil.

## Thèmes par métier

Exécutez `theme-migration.sql` dans l'éditeur SQL Supabase pour sauvegarder le thème du compte et le retrouver sur vos autres appareils. Cette migration ajoute la colonne `theme` à `public.companies` et définit `plombier` par défaut. Sans cette étape, le choix fonctionne sur l'appareil utilisé grâce au stockage local, mais ne se synchronise pas.

Après connexion, utilisez le bouton **Thème** en haut à droite pour choisir plomberie & chauffage, jardinage, électricité, peinture ou menuiserie. Les couleurs, le dessin de l'accueil, les textes d'ambiance et les prestations suggérées changent. Les factures existantes et leurs données ne sont pas modifiées. Le thème plomberie & chauffage et `radiateur.png` restent inchangés et sont sélectionnés par défaut.

Pour mettre à jour votre dépôt existant, publiez `index.html`, `style.css`, `app.js`, les quatre images `theme-*.png` et `theme-migration.sql` dans le même dossier que l'actuel `radiateur.png`. Gardez votre `config.js` déjà configuré.

## Mise à jour — prestations, abonnements, relances, QR et logo

### Installation sur votre site existant

1. Sauvegardez votre dossier actuel et votre base Supabase.
2. Dans Supabase > SQL Editor, exécutez **migration-suivi.sql**. Elle ajoute deux colonnes à `companies`, une à `documents` et la table `payment_reminders`, avec isolation des relances par utilisateur. Les tables d'origine doivent déjà exister avec leurs politiques de sécurité par utilisateur.
3. Remplacez **index.html**, **app.js**, **style.css** et ajoutez le dossier **vendor** dans le dossier `Facture` de votre site.
4. Conservez **config.js**, **radiateur.png** et vos quatre images **theme-*.png** existants. Ils ne sont pas remplacés par l'archive de mise à jour.
5. Rechargez avec Ctrl+F5, puis vérifiez une facture de test avant utilisation.

### Prestations

À l'étape « Les travaux », ouvrez **Gérer mes prestations** pour ajouter/supprimer les raccourcis et définir leurs quantités et prix. Le catalogue est propre au compte et au métier sélectionné, et se synchronise via Supabase. Les lignes de vos anciens documents ne changent pas. **Autre prestation** ajoute toujours une ligne libre. **Retirer** supprime une ligne du brouillon uniquement.

### Abonnements

Activez la récurrence à l'étape « Les travaux », ou depuis une facture enregistrée avec **Ajouter une récurrence**. Choisissez une fréquence mensuelle, trimestrielle ou annuelle et la prochaine date (par exemple 2026-12-20 pour chaque 20 décembre).

L'accueil affiche les facturations arrivées à échéance ; l'onglet **Abonnements** affiche aussi les prochaines. **Préparer la facture** crée un nouveau brouillon sans modifier l'ancienne facture. Relisez-le, enregistrez-le et envoyez-le. Revenez ensuite dans Abonnements et cliquez sur **Échéance traitée** pour avancer d'une période. Cette action confirme uniquement votre suivi : elle ne prouve aucun envoi. Vous pouvez préparer un brouillon en avance. Une échéance oubliée reste visible jusqu'à son traitement. Pour arrêter, décochez la récurrence dans **Modifier / arrêter**.

Les rappels sont affichés dans l'application lorsqu'elle est ouverte ou rechargée. Aucun e-mail automatique, notification en arrière-plan ni tâche serveur n'est installé.

### Relances des impayés

Sur une facture non payée dont la date limite est dépassée, choisissez **Relancer : retard de paiement**. Vous pouvez corriger le destinataire, l'objet et le message. L'application enregistre la préparation puis ouvre votre messagerie avec `mailto:`. Si elle ne s'ouvre pas, utilisez le lien proposé ou copiez le message de l'historique. Ajoutez vous-même le PDF si nécessaire et envoyez le message depuis votre messagerie.

Après l'envoi, cliquez sur **J’ai envoyé cette relance**. L'historique conserve le destinataire, le texte, la date de préparation et la date de confirmation. Une confirmation est déclarative : il ne s'agit pas d'une preuve de livraison. Fermer la fenêtre ne confirme pas l'envoi. Chaque nouvelle préparation produit une entrée distincte. La suppression d'une facture supprime aussi ses relances.

### QR de paiement SEPA

Le QR est créé localement, sans transmission des coordonnées bancaires à un générateur tiers, puis affiché sur les factures enregistrées non payées et dans l'impression PDF. Il contient le bénéficiaire, l'IBAN belge, le total en EUR et le numéro de facture en communication. Il n'est pas affiché sur les devis, les brouillons non numérotés ou les factures payées. Une application bancaire compatible EPC / SEPA est nécessaire ; la compatibilité dépend de la banque. Le statut payé doit être mis à jour manuellement.

**L'IBAN fourni BE12 4567 1245 1245 est invalide (contrôle modulo 97 : 40 au lieu de 1). Aucun QR n'est généré avec ce compte.** Renseignez votre IBAN correct dans **Mon entreprise**. Aucun compte existant n'est remplacé arbitrairement. Les anciennes factures conservent les coordonnées bancaires enregistrées lors de leur création. Cette version prend en charge les comptes belges.

Format : EPC069-12 v3.1, BCD/002, UTF-8, correction M, maximum 331 octets/version 13. Source : https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation
La bibliothèque locale qrcode-generator 1.4.4 est distribuée sous licence MIT, incluse dans vendor/LICENSE-qrcode.

### Logo

Dans **Mon entreprise**, sélectionnez un PNG, JPEG ou WebP (maximum 2 Mo). L'aperçu apparaît avant l'enregistrement. Cliquez sur **Enregistrer mes coordonnées**. L'image est réduite à 640 × 320 au maximum et conservée dans Supabase. **Retirer le logo**, puis enregistrer, supprime le logo des prochaines factures. Les factures et devis déjà enregistrés gardent leur logo d'origine.

### Limites conservées de l'application initiale

La numérotation reste générée dans le navigateur et l'enregistrement du document/de ses lignes n'est pas transactionnel. Aucun envoi Peppol ni envoi d'e-mail serveur n'est ajouté. Ces points doivent être traités avant d'en faire une solution complète de facturation professionnelle.

### Vérifications de cette livraison

Tests exécutés avec un DOM et des réponses Supabase simulés : catalogue (ajout, suppression et sauvegarde), ajout de lignes, récurrence dans les données enregistrées, préparation mailto et confirmation des relances, aperçu et retrait du logo, passage d'une échéance à la suivante, création du brouillon récurrent, cas de fin de mois/année bissextile, validation IBAN. Le QR a été décodé avec un décodeur indépendant et comparé au bénéficiaire UTF-8, au montant et à la communication attendus.

La base Supabase réelle, la réception des e-mails, le chargement/redimensionnement d'un logo dans un navigateur et le rendu visuel mobile/PDF n'ont pas pu être validés dans cet environnement. Après installation, testez ces parcours avec une facture de test.
