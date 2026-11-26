# Anleitung: Umzug von Joomla/Mittwald zu GitHub Pages + INWX

Reihenfolge einhalten: Die alte Seite läuft weiter, bis die neue unter eurer Domain funktioniert. **Mittwald erst ganz am Ende kündigen.**

## 1. GitHub-Organisation für den Verein

1. Auf GitHub angemeldet: oben rechts **+ → New organization** → Plan **Free**.
   Name z. B. `eintracht-berssen`, Kontakt-E-Mail des Vereins.
2. Ein bis zwei weitere Vorstandsmitglieder mit eigenem GitHub-Konto als **Owner** einladen (*People → Invite member*).
3. Repository übertragen: `sebutd/EintrachtBerssen` → **Settings → General → Danger Zone → Transfer ownership** → Ziel `eintracht-berssen`.
   Die Historie bleibt erhalten, alte Links leitet GitHub weiter.
4. Im übertragenen Repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Den Entwicklungsstand auf `main` bringen (Pull Request mergen). Danach baut GitHub die Seite automatisch.
   Testadresse: `https://eintracht-berssen.github.io/EintrachtBerssen/`.
   Dafür unter **Settings → Secrets and variables → Actions → Variables** setzen:
   - `SITE_URL` = `https://eintracht-berssen.github.io`
   - `BASE_PATH` = `/EintrachtBerssen`

## 2. Domain und Postfächer bei INWX

1. Konto bei <https://www.inwx.de> anlegen.
2. Bei Mittwald den **Auth-Code** (Transfer-Code) für `eintracht-berssen.de` anfordern.
3. Bei INWX den **Domain-Transfer** mit dem Auth-Code starten (ca. 1–5 Tage). Dabei ein **Mail-Paket** dazubuchen (kleinster Tarif reicht für einige Postfächer).
4. Bei INWX die benötigten Postfächer anlegen – mindestens die, die heute genutzt werden (z. B. `info@`, `tennis@`).
5. **Alte Mails übernehmen:** in einem Mailprogramm (z. B. Thunderbird) altes und neues Postfach per IMAP einrichten und die Ordner per Drag & Drop kopieren – oder den IMAP-Umzugsdienst von INWX nutzen, falls angeboten.

## 3. DNS-Einträge bei INWX

| Typ | Name | Wert |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |
| CNAME | www | eintracht-berssen.github.io. |
| MX, SPF (TXT), DKIM | – | wie im INWX-Mailpaket angegeben |

## 4. Eigene Domain in GitHub aktivieren

1. Repository → **Settings → Pages → Custom domain**: `eintracht-berssen.de` → *Save*. Warten, bis der DNS-Check grün ist.
2. **Enforce HTTPS** anhaken (das Zertifikat kommt automatisch, kann bis zu einer Stunde dauern).
3. Variablen anpassen (**Settings → Secrets and variables → Actions → Variables**):
   - `SITE_URL` = `https://eintracht-berssen.de`
   - `BASE_PATH` = `/`
4. Unter **Actions** den Workflow „Seite bauen und veröffentlichen“ einmal per **Run workflow** starten.
5. Testen: `https://eintracht-berssen.de` und eine alte Adresse wie `https://eintracht-berssen.de/impressum.html` (muss auf die neue Seite weiterleiten).

## 5. Eingabemaske einrichten

1. <https://app.pagescms.org> → mit GitHub anmelden → Pages CMS für die Organisation `eintracht-berssen` installieren und das Repository freigeben.
2. Schreiber in Pages CMS per **E-Mail** einladen (im Projekt unter *Collaborators*). Sie brauchen kein GitHub-Konto und melden sich per Anmeldelink an; die E-Mail-Adresse muss nur eine sein, die sie abrufen.
   Alternativ: Wer ein GitHub-Konto hat, kann als **Collaborator** (Rolle *Write*) zum Repository eingeladen werden (**Settings → Collaborators → Add people**) und meldet sich mit GitHub an.
3. Den Schreibern [docs/redaktion.md](redaktion.md) schicken.

## fussball.de-Widgets

fussball.de liefert ein Widget nur an die Website aus, die beim Erstellen im Widgetcenter angegeben wurde. Der Vereinsspielplan ist für `eintracht-berssen.de` angelegt – unter der Testadresse `….github.io` zeigt er deshalb „Uuups… hier ist ein Fehler aufgetreten“. Nach dem Domain-Umzug (Schritt 4) funktioniert er ohne Änderung. Ein Eintrag im Head-Bereich der Seite ist nicht nötig; die Seite lädt das fussball.de-Skript nach dem Klick auf „Inhalt laden“ selbst.

## 6. Aufräumen

- Alles läuft (Seite, HTTPS, E-Mails empfangen **und** senden)? Dann den **Mittwald-Vertrag kündigen**.
- Vorher eine Sicherung des Joomla-Webspace (Dateien + Datenbank) herunterladen und aufbewahren.
