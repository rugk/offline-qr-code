# Begärda behörigheter

För en generell förklaring av tilläggets behörigheter se [denna supportartikel](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Installations behörigheter

För närvarande behövs inga behörigheter för installation eller vid uppdatering.

## Framtidsspecefika (valbara) behörigheter

Dessa behörigheter är begärda för vissa specefika åtgärder, om de behövs för det.

| Intern Id | Behörighet                                                        | Begärd vid…              | Förklaring                                                                                                                                                                                  |
|:------------|:------------------------------------------------------------------|:---------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloads` | Laddar ner filer samt läser och skriver och modifierar browserns nerladdnings historia | Nerladdning av QR-kod som SVG | Behövs för nerladdning (sparar) SVG:n och tillåter användaren att välja en destination för filen. Detta tillägg har inte tillgång till dina nerladdade filer, den använder bara behörigheten till att starta nerladdningen. |

## Dolda behörigheter
Dessutom, den begär dessa behörigheter, vilka inte är begärda i Firefox när tillägget installeras, eftersom de inte är stora behörigheter.

| Intern Id | Behörighet                   | Förklaring                                                       |
|:------------|:-----------------------------|:------------------------------------------------------------------|
| `activeTab` | Åtkomst till nuvarande flik   | Behövs för att få URL:n till den nuvarande websidan för QR-koden |
| `storage`   | Åtkomst till local storage         | Behövs för att spara val                                         |
| `menus`     | Modifiera browser kontext menyer | Behövs för att lägga till kontext menyer "QR-kod från val" (osv.)   |
