# Erfragte Einstellungen

Für eine allgemeine Erklärung von Add-on-Berechtigungen siehe [diesen Support-Artikel](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Berechtigungen bei Installation

Zurzeit werden bei Installation des Add-ons oder beim Update keine Berechtigungen abgefragt.

## Feature-spezifische (optionale) Berechtigungen

Diese Berechtigungen werden bei bestimmten Aktionen abgefragt, wenn sie dafür benötigt werden.

| Interne ID  | Berechtigung                                                       | Abgefragt bei…                 | Erklärung                                                                                                                                                                                                                               |
|:------------|:-------------------------------------------------------------------|:-------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloads` | Dateien herunterladen und die Download-Chronik lesen und verändern | Speichern des QR-Codes als SVG | Benötigt um den SVG-Download zu starten und dem Nutzer eine Möglichkeit zur Auswahl des Speicherortes zu geben. Dieses Add-on greift nicht auf Downloads zu, es benötigt diese Berechtigung nur, um den Download des Bildes zu starten. |

## Versteckte Berechtigungen

Zusätzlich verlangt dieses Add-on folgende Berechtigungen, welche in Firefox aber nicht abgefragt werden, da sie keine tiefgreifenden Berechtigungen sind.

| Interne ID  | Berechtigung                      | Erklärung                                                                     |
|:------------|:----------------------------------|:------------------------------------------------------------------------------|
| `activeTab` | Auf aktuelle Webseite zugreifen   | Benötigt, um die URL des aktuellen Tabs für den QR-Code zu erhalten           |
| `storage`   | Zugriff auf lokalen Speicher      | Benötigt um Einstellungen abzuspeichern                                       |
| `menus`     | Browser-Kontextemnüs modifizieren | Benötigt um Kontextmenueinträge wie "QR-Code aus Auswahl" (etc.) hinzuzufügen |
