# Autorisations requises

Pour une explication générale des autoristation des extensions, lis [cet article du support Mozilla](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Autorisations d'installation

Actuellement, aucune autoristation n'est requise à l'installation ou lors des mises à jour.

## Autorisations spécifiques à certaines fonctionnalités (optionnelles)

Ces autoristations sont requises pour effectuer certaines actions, si on en a besoin pour ça.

| Id Interne  | Autorisations                                                     | Requise pour…              | Explication                                                                                                                                                                                       |
|:------------|:------------------------------------------------------------------|:---------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloads` | Download files and read and modify the browser’s download history | Download of QR code as SVG | Needed for downloading (saving) the SVG and alllowing the usere to choose a file location. This add-on does not access your downloaded files, it just uses this permission to start the download. |

## Autorisations cachées
De plus, l'extension requiert ces autoristations, qui ne sont pas requises dans Firefox quand l'extension est installée, car ce ne sont pas des autoristations profondes.

| Id Interne  | Autorisations                                | Explication                                                                           |
|:------------|:---------------------------------------------|:--------------------------------------------------------------------------------------|
| `activeTab` | Accéder à l'onglet actif                     | Requis pour récupérer l'URL du site courant pour le QR-Code                           |
| `storage`   | Accéder au stockage local                    | Requis pour sauvegarder les paramètres                                                |
| `menus`     | Modifier les menus contextuels du navigateur | Requis pour ajouter les menus contextuels "QR-Code à partir de la sélection" (etc.)   |
