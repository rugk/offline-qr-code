# Erfragte Einstellungen

Für eine allgemeine Erklärung von Add-on-Berechtigungen siehe [diesen Support-Artikel](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Hauptberechtigungen

Diese Berechtigungen werden bei Installation des Add-ons oder beim Update abgefragt.

| Interne ID  | Berechtigung                                                                  | Erklärung                                                                                                                                                                                   |
|:------------|:------------------------------------------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloads` | Dateien herunter laden und die Browser’s Download Chronik lesen und schreiben | Benötigt um SVG-version des QR-Code herunter zu laden/zu speichern. Dieses Add-on greift nicht auf Downloads zu, es benötigt diese Berechtigung nur, um den Download des Bildes zu starten. |

## Versteckte Berechtigungen

Zusätzlich verlangt dieses Add-on folgende Berechtigungen, welche in Firefox aber nicht abgefragt werden, da sie keine tiefgreifenden Berechtigungen sind.

| Interne ID  | Berechtigung                      | Erklärung                                                                     |
|:------------|:----------------------------------|:------------------------------------------------------------------------------|
| `activeTab` | Auf aktuelle Webseite zugreifen   | Benötigt, um die URL des aktuellen Tabs für den QR-Code zu erhalten           |
| `storage`   | Zugriff auf lokalen Speicher      | Benötigt um Einstellungen abzuspeichern                                       |
| `menus`     | Browser-Kontextemnüs modifizieren | Benötigt um Kontextmenueinträge wie "QR-Code aus Auswahl" (etc.) hinzuzufügen |
