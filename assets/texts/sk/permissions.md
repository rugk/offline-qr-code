# Vyžadované povolenia

Pre základné vysvetlenie povoelní rozšírení sa pozriete [na tento článok](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Inštalačné povolenia

Aktuálne nevyžaduje žiadne povolenia pri inštalácií alebo pri aktualizácií.

## Funkciovo-špecifické (voliteľné) povolenia

Tieto povolenia sú vyžadované pri špecifických akciách, keď sú pre nich potrebné.

| Interné Id | Povolenie                                                        | Vyžadované na…              | Vysvetlenie                                                                                                                                                                                       |
|:------------|:------------------------------------------------------------------|:---------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloads` | Sťahovanie súbotov a čítanie a modifikácia historie sťahovaní prehliadača | Sťahovanie QR kódu ako SVG | Potrebné na sťahovanie (ukladanie) SVG a povolenie užívateľovi vybrať si miesto uloženia. Toto rozšírenie nepristupuje k tvojim stiahnutým súborom, používa toto povolenie iba na začatie sťahovania. |

## Skryté povolenia
Navyše sú vyžadované tieto povolenia, ktoré nie sú vyžadované vo Firefox-e, keď je rozširenie nainštalované, keďžeto nie sú základné rozšírenia.

| Interné Id | Povolenia                   | Vysvetlenie                                                       |
|:------------|:-----------------------------|:------------------------------------------------------------------|
| `activeTab` | Prístup ku stránke na aktuálnej karte   | Potrebné na získanie URL adresy aktuálnej stránky | 
| `storage`   | Prístup k lokálnemu úložisku        | Potrebné na ukladanie nastavení                                        |
| `menus`     | Zmena kontextových menu prehliadača | Potrebné na pridanie kontextových menu "QR kód z výberu" (atď.)   |
