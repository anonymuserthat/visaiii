# Damander Visa 0.3.0 — installation et recuperation des donnees

## Avant de mettre a jour un ancien ordinateur

1. **Sauvegardez vos dossiers locaux avant de desinstaller quoi que ce soit.** Fermez l'application et copiez le dossier `%APPDATA%\eu.damander.visa` (notamment `requests.json`, `requests.json.bak`, `draft.json` et `runtime.env`) sur un support prive. Ne partagez pas `runtime.env` publiquement : il peut contenir le mot de passe de la base.
2. Verifiez que les demandes existent encore dans la base distante depuis un ordinateur sur lequel l'historique fonctionne, ou avec un outil SQL reserve a l'administrateur (`SELECT COUNT(*) FROM visa_request_records;`). Si elles ne sont que sur un PC, gardez precieusement son `requests.json`.
3. Ne supprimez PAS la base PostgreSQL/CockroachDB et n'utilisez PAS `prisma db push --force-reset` pour reparer un probleme de connexion.

## Construire l'installateur sous Windows

Prerequis : Windows, Node.js compatible Vite 8, Rust (rustup), Microsoft C++ Build Tools et les outils NSIS/WiX necessaires au bundle Tauri. Dans PowerShell, a la racine du projet :

```powershell
./scripts/build-windows.ps1
```

L'installateur NSIS 0.3.0 est produit sous `src-tauri\target\release\bundle\nsis\`. Le script installe les dependances avec le lockfile, execute les controles TypeScript et les tests, puis construit l'application Windows. L'option `-Demo` construit une version avec les fixtures; sans cette option, le mode reel est utilise.

La version **0.3.0** identifie la nouvelle interface. Modifier les sources ou executer `npm run build` ne met pas a jour un EXE deja installe : il faut construire puis installer le nouveau paquet. La barre de titre Windows et le pied de page affichent 0.3.0. L'identifiant `eu.damander.visa` reste identique pour conserver l'emplacement des donnees.

Le push sur la branche `codex/ui-redesign-v0.3.0` declenche automatiquement la construction Windows. Pour la relancer manuellement, apres avoir pousse les sources et le fichier `.github/workflows/windows-installer.yml`, ouvrez GitHub Actions, selectionnez **Windows 0.3 installer**, puis **Run workflow** sur la branche contenant ces changements. Telechargez l'artefact **Damander-Visa-0.3.0-Windows** du run reussi. La presence du workflow dans les sources ne signifie pas qu'un installateur a deja ete construit.

Les fichiers `.env` de developpement ne sont plus inclus dans le paquet. Les parametres du PC se configurent dans l'application ou via un fichier local fourni separement.

## Installer sur le nouveau PC

1. Installez la version 0.3.0 et ouvrez l'application.
2. Ouvrez **Mon profil** en haut a droite, puis **Base de donnees partagee > Configurer**.
3. Collez l'URL PostgreSQL/CockroachDB obtenue aupres de l'administrateur. Elle doit correspondre a **la meme base** que celle utilisee par les autres PC. Cliquez **Tester et enregistrer**. L'ancienne URL reste active si le test echoue.
4. Cliquez **Actualiser**. Verifiez le statut **Connectee**, le nombre de dossiers sur le serveur et la page **Dossiers**. Si le nombre est 0, confirmez la base choisie et la table `visa_request_records` avec votre administrateur.
5. Si le statut est rouge, l'erreur indique maintenant l'etape bloquante (DNS, serveur injoignable, SSL/certificat, identifiants, table manquante, permissions SQL). Testez l'acces Internet, le VPN, les pare-feu et les identifiants DB avec l'administrateur.

Sur un PC qui marchait auparavant, utilisez le meme panneau pour reconfigurer la connexion si son ancien mot de passe, l'adresse du serveur ou son certificat a change. Les dossiers locaux restent accessibles hors ligne.

**Emplacement des fichiers Windows :** `%APPDATA%\eu.damander.visa` (depend de l'identifiant et du chemin de donnees Tauri). Le fichier `requests.json.bak` est une sauvegarde de la derniere version valide. Ne supprimez pas ces fichiers lors d'une reinstallation.

## Protection et synchronisation

- L'application charge les demandes depuis la base si celle-ci est joignable; sinon elle affiche le cache local **et un diagnostic visible**.
- Elle ne renvoie plus toutes les anciennes demandes locales sur le serveur lors du rafraichissement. Cela evite d'ecraser de nouvelles mises a jour provenant d'autres PC.
- Les nouvelles demandes peuvent etre enregistrees localement si la connexion echoue; le nombre en attente de synchronisation est visible. Lors de la reconnexion, les enregistrements absents du serveur peuvent etre ajoutes.
- Les anciennes versions pouvaient incorporer des identifiants DB dans l'executable. La version 0.2.0 **ne le fait plus**. Dans un environnement professionnel, utilisez un service API central avec authentification plutot que de distribuer un acces SQL direct. Protegez les configurations locales et changez les secrets deja distribues.
- Le bouton **X** ouvre une boite de dialogue de confirmation native, en francais. **Annuler** laisse l'application ouverte.

## Si le statut est vert mais les demandes manquent

Verifiez que l'URL pointe vers la bonne base / le bon cluster (pas une base vide) et que les droits de lecture sur `visa_request_records` sont accordes. Si un ancien PC contient uniquement des demandes locales jamais synchronisees, sauvegardez d'abord son dossier de donnees avant toute intervention. Evitez de copier `requests.json` d'un PC vers plusieurs autres sans sauvegarde, car le cache local ne remplace pas la base partagee.
