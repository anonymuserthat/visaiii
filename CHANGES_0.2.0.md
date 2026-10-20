# ProVisa v0.2.0 — modifications

- Nouveau panneau **Base de donnees partagee** avec etat de connexion, diagnostic, nombre de demandes sur le serveur, nombre de demandes locales et demandes non synchronisees.
- URL PostgreSQL configurable par PC et testee avant enregistrement. L'executable ne contient plus de mot de passe embarque.
- Reconnexion/rafraichissement de l'historique sans redemarrage.
- Le chargement des dossiers ne lance plus des commandes DDL, evitant les permissions d'administration inutiles.
- Les donnees distantes sont prioritaires sur les anciens caches. Une ancienne demande synchronisee ne re-ecrase plus le serveur a chaque rafraichissement.
- Les mises a jour de rappel en panne reseau restent en cache, avec re-tentative lors de la synchronisation.
- Sauvegarde locale de secours `requests.json.bak` et relecture du backup si le fichier principal est illisible.
- Affichage des erreurs de connexion SQL (code SQLSTATE et causes reseau) au lieu d'un historique vide sans explication.
- Confirmation native **Voulez-vous vraiment quitter ProVisa ?** sur la fermeture de la fenetre Windows.
- Version augmentee de 0.1.0 a 0.2.0 pour faciliter le deploiement.

**Limites de verification :** validation syntaxique TypeScript effectuee. Rust/Tauri, connexions reelles a la base partagee et creation d'un executable Windows non testables dans cet environnement. Un build et un test manuel Windows sont necessaires avant deploiement.
