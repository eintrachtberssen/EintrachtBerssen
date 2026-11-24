# Neue Vereinshomepage SV Eintracht Berßen – Design

Stand: 24.11.2026

## Warum

Der Verein betreibt heute ein Joomla auf Webspace bei Mittwald (eintracht-berssen.de). Dort
kommen weniger Inhalte rein als gedacht: Viele Abteilungs- und Teamseiten sind leer
(z. B. Tennis, D-Jugend), Beiträge erscheinen nur auf der Startseite. Ziel ist eine schöne,
moderne Homepage, die **alles** von der jetzigen Seite übernimmt, auf der das Schreiben eines
Beitrags so einfach ist, dass es auch passiert, und die günstiger läuft.

## Ziele

- Alle bisherigen Inhalte übernehmen: Seiten, alle 113 öffentlich sichtbaren Beiträge abzüglich der zugesagten Altlasten (mit Datum, Text, Bildern),
  Fotogalerien, Kontakte, Downloads, Impressum, Datenschutz, externe Links (Fanshop,
  Fußball-Spielplan, „Werde Schiedsrichter!“).
- Eingabemaske im Browser für neue Beiträge: Titel, Datum, Text, Bilder, **Tags**.
- Tags steuern, wo ein Beitrag erscheint: Ein Beitrag mit Tag „Tennis“ erscheint auf der
  Tennis-Seite, „D-Juniorinnen“ auf der Teamseite usw. Jede Abteilungs-/Teamseite zeigt
  automatisch die neuesten Beiträge ihres Tags – dadurch sind Teamseiten nie mehr leer.
- Hosting kostenlos über GitHub Pages; Domain + kleines Postfach bei einem günstigen
  Anbieter (z. B. INWX) statt Mittwald.
- **Deutlich moderner Look** als eigenes Ziel (klare Typografie, große Bilder, Karten,
  viel Weißraum, Rot/Weiß als Akzent).
- Gut auf dem Handy lesbar, schnell, ohne Cookie-Banner-Pflicht (keine Tracker, keine
  externen Fonts/Dienste ohne Not).

## Nicht-Ziele

- Kein Login-/Mitgliederbereich – „Intern“ entfällt ersatzlos.
- Keine Kommentare, kein Shop (Fanshop bleibt externer Link), keine eigene Spielplan-Logik
  (Spielplan bleibt Link/Einbettung von fussball.de bzw. bisheriger Quelle).
- Kein Redaktions-Workflow mit Freigaben; 2–3 Personen schreiben direkt.

## Anti-Ziele (das wäre ein Fehlschlag, auch wenn es technisch läuft)

- Beitrag schreiben ist komplizierter als in Joomla (Git, Markdown-Syntax, Terminal).
- Alte Inhalte gehen verloren oder alte Links (Google, geteilte Links) landen im Nichts.
- Laufende Pflege/Sicherheitsupdates werden nötig wie bei Joomla.

## Rahmenbedingungen

- Schreiber: 2–3 Personen am PC. Jede braucht ein kostenloses GitHub-Konto.
- Repo `sebutd/EintrachtBerssen` ist öffentlich → GitHub Pages kostenlos. Alle Inhalte
  (auch Kontaktdaten) sind damit im Repo öffentlich – sind sie heute auf der Webseite auch.
- Bildmenge der alten Seite ca. 220 MB – innerhalb der GitHub-Pages-Grenzen (1 GB), Bilder
  werden beim Import aber verkleinert (max. ~1600 px Breite), um Repo und Ladezeit klein
  zu halten.
- Datenschutz: GitHub (USA) als Hoster in die Datenschutzerklärung aufnehmen.
- Vereinsfarben Rot/Weiß, gegründet 30. Mai 1946.

## Ansätze (betrachtet)

1. **Statische Seite (Astro) auf GitHub Pages + Pages CMS als Eingabemaske** – gewählt.
   0 € Hosting, keine Software zu pflegen, Eingabe per Web-Formular. Nachteil:
   GitHub-Konto pro Schreiber, kein Passwortbereich möglich (nicht benötigt).
2. Dieselbe Seite weiter bei Mittwald – gleiche Bedienung, deutscher Server, aber keine
   Kostenersparnis. Bleibt als Ausweichoption, da die Seite überall läuft.
3. Eigenes kleines PHP-Redaktionssystem bei Mittwald – Logins ohne GitHub möglich, aber
   wieder Software- und Sicherheitspflege wie bei Joomla. Verworfen.

## Entscheidungen des Vereins

- Weg 1 (GitHub Pages + Eingabemaske).
- Domain zieht zu einem günstigeren Anbieter mit kleinem Mailspace (Beispiel INWX).
- „Intern“ wird nicht mehr gebraucht.
- Repo zieht vor Einrichtung der Eingabemaske in eine GitHub-Organisation des Vereins;
  bis dahin wird in `sebutd/EintrachtBerssen` gebaut (Astro `base`/`site` per Konfiguration
  umstellbar). Keine Frist.
- **Altlasten weglassen (zugesagt):**
  1. Erledigte Kurzhinweise (~25 Beiträge): vergangene GV-Einladungen, Spielausfälle/
     -verlegungen, Corona-Meldungen 2020, Oster-/Weihnachtsgrüße, „Neuer Homepageauftritt“
     2017, abgelaufene Kurs-/Schulungs-/Suchtermine, Glasfaserausbau. Berichte, Erfolge,
     Spenden, Nachrufe bleiben. Liste wird im Plan festgelegt.
  2. Leere Seiten entfallen; jede Abteilung/jedes Team hat eine Seite mit Tag-Beiträgen und
     Ansprechpartner statt leerem Inhalt.
  3. Einzelseiten pro Kontaktperson entfallen → eine Ansprechpartner-Seite.
  4. „Verein › Vorstand“ und „Ansprechpartner › Vorstand“ werden zusammengelegt.
  5. Abgelaufene Umfrage-Links (Nextcloud) werden entfernt, Beitrag bleibt.
- Belegungspläne (Bilder) sind aktuell → übernehmen.
- Alle Fotogalerien inkl. 2015/2016 bleiben.

## Aufbau (Calls von Claude, korrigierbar)

### Technik
- **Astro** (statischer Seitengenerator), Inhalte als Markdown-Dateien mit Frontmatter
  in `src/content/`. Build + Deploy per GitHub Actions bei jedem Speichern.
- **Pages CMS** (app.pagescms.org, kostenlos, Login mit GitHub) als Eingabemaske,
  konfiguriert über `.pages.yml`. Beitragsfelder: Titel, Datum, Titelbild, Text
  (WYSIWYG-Editor), Tags (Mehrfachauswahl aus fester Liste), optional Bildergalerie.
  Begründung: kein eigener OAuth-Server nötig (im Gegensatz zu Decap CMS auf Pages).
- Keine externen Skripte/Fonts zur Laufzeit; Schrift selbst gehostet.
- **Externe Inhalte per Zwei-Klick** (Call von Claude): fussball.de-Spielplan, YouTube-Videos
  aus alten Beiträgen und Google Maps (Anfahrt) laden erst nach Klick auf einen Platzhalter;
  vorher setzt nichts Cookies → kein Cookie-Banner nötig.
- Alte Joomla-URLs bekommen kleine Weiterleitungsseiten (GitHub Pages kennt keine
  echten 301-Weiterleitungen).

### Navigation (wie heute, leicht aufgeräumt)
- **Aktuelles** (alle Beiträge, mit Tag-Filter und Seitenblättern; RSS-Feed)
- **Verein:** Vorstand, Chronik, Fotos (Galerien nach Jahr), Sportgelände, Belegungsplan,
  Anfahrt, Downloads
- **Sport:** Fußball (Herren 1/2, Damen 1/2, Junioren: Minikicker, F–A,
  Juniorinnen: E–B), Tennis (Aktuelles, Termine, Vorstand), Volleyball, Rückensport,
  Fitness/Gymnastik
- **Kontakt:** Ansprechpartner (Vorstand, Vorstand Tennis, Fußball Senioren, Junioren,
  Juniorinnen, Fitness/Gymnastik) – als eine Seite mit Gruppen
- Footer: Impressum, Datenschutz, Fanshop, Spielplan, Werde Schiedsrichter!

### Startseite
Kopfbereich mit Logo/Vereinsfarben und Bild der Sportanlage, darunter die neuesten
Beiträge als Karten, Schnellzugriff auf die Abteilungen, Hinweisbox (z. B. nächste
Veranstaltung) optional.

### Tags
Feste Liste, damit nicht „Tennis“/„tennis“/„Tennisabteilung“ entstehen:
`Verein`, `Fußball`, `Herren`, `Damen`, `Junioren`, `Juniorinnen`, je Team
(`A-Jugend` … `Minikicker`, `B-Juniorinnen` … `E-Juniorinnen`, `1. Herren`, `2. Herren`,
`1. Damen`, `2. Damen`, `Alte Herren`), `Tennis`, `Volleyball`, `Rückensport`,
`Fitness/Gymnastik`, `Veranstaltung`, `Nachruf`, `Sponsoren`.
Jede Abteilungs-/Teamseite ist einem oder mehreren Tags zugeordnet und zeigt deren
Beiträge. Die Tag-Liste ist in einer Datei pflegbar.

### Teamseiten
Fester Teil (Trainingszeiten, Ansprechpartner, Teamfoto – über die Eingabemaske
editierbar) + automatisch die Beiträge mit passendem Tag.

### Kontakte
Strukturierte Datei (Name, Funktion, Telefon, E-Mail, Gruppe, optional Foto), über die
Eingabemaske editierbar. E-Mail-Adressen leicht verschleiert gegen Spam-Bots.

### Migration
- Einmaliges Import-Skript aus der gesicherten Kopie (wget-Spiegel, einzige Quelle; E-Mails
  werden aus der Joomla-Verschleierung dekodiert) der alten Seite: Beiträge →
  Markdown mit Originaldatum, Bildern (verkleinert) und automatisch vorgeschlagenen Tags
  (anhand von Stichwörtern im Titel/Text; Stichprobenkontrolle).
- Fotogalerien, Belegungspläne, PDFs, Kontakte, Chronik, Impressum, Datenschutz übernehmen.
- **Weiterleitungen** von alten Joomla-URLs (`/183-rot-weisse-nacht-….html`,
  `/sportabteilungen/tennis.html` …) auf die neuen Seiten, damit alte Links weiter
  funktionieren.
- Seiten, die heute leer sind, werden mit Platzhalter + Tag-Beiträgen befüllt.

### Domain & Mail (Anleitung, kein Code)
Kurzanleitung im Repo (`docs/umzug.md`): Postfächer bei INWX anlegen, Mails von Mittwald
übertragen, Domain-Transfer (Auth-Code bei Mittwald), DNS: A/AAAA-Records auf GitHub
Pages, `www` als CNAME, MX auf INWX-Mail, Custom Domain + HTTPS in GitHub aktivieren,
erst danach Mittwald kündigen. Bis zum Umzug ist die Seite unter
`sebutd.github.io/EintrachtBerssen` testbar.

### Redaktionsanleitung
Einseitige Anleitung mit Screenshots für die Schreiber: anmelden, Beitrag anlegen, Bild
hochladen, Tags wählen, speichern – online nach ca. 2 Minuten.

## Dem Builder überlassen

Genaue Gestaltung im Rahmen Rot/Weiß, Komponentenstruktur, Bildoptimierung,
Stichwortliste für die automatische Tag-Zuordnung, Darstellung der Galerien.
