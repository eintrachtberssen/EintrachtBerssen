# Vereinshomepage SV Eintracht Berßen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Moderne statische Vereinsseite (Astro, GitHub Pages) mit allen Inhalten der alten Joomla-Seite und einer Pages-CMS-Eingabemaske für getaggte Beiträge.

**Architecture:** Inhalte liegen als Markdown/JSON im Repo (`src/content`, `src/data`). Ein einmaliges Import-Skript erzeugt sie aus dem wget-Spiegel der alten Seite. Astro baut daraus statische Seiten; Abteilungs-/Teamseiten zeigen per Tag-Zuordnung automatisch passende Beiträge. GitHub Actions baut und deployt bei jedem Push auf `main`; Pages CMS schreibt Commits ins Repo.

**Tech Stack:** Node 22, Astro 5, TypeScript, Vitest, cheerio + turndown (Import), sharp (Bildverkleinerung), @astrojs/rss, Playwright (vorinstalliert) für Smoke-Checks.

**Spec:** `docs/superpowers/specs/2026-11-24-vereinshomepage-design.md`

## Global Constraints

- Sprache der Seite: Deutsch. Vereinsname: „SV Eintracht Berßen e.V.“, gegründet 30. Mai 1946, Farben Rot/Weiß.
- Keine externen Skripte, Fonts, Tracker oder iframes, die ohne Klick laden. Schrift selbst gehostet (`@fontsource-variable/inter` o. ä., ins Bundle).
- Externe Inhalte (fussball.de-Widget, YouTube, Google Maps) nur über `ConsentEmbed` (Zwei-Klick).
- `site`/`base` kommen aus Umgebungsvariablen `SITE_URL` (Default `https://sebutd.github.io`) und `BASE_PATH` (Default `/EintrachtBerssen`); alle internen Links über Helfer `url(path)` → Umzug in Organisation/eigene Domain = nur Variablen ändern.
- Bilder beim Import auf max. 1600 px Breite, JPEG-Qualität 80; Zielordner `public/images/`.
- Mirror-Quelle als Pfad-Argument: `MIRROR=<pfad>/eintracht-berssen.de`. Mirror wird **nicht** ins Repo kopiert; nur kleine Test-Fixtures.
- Feste Tag-Liste (exakt): `Verein`, `Fußball`, `Herren`, `Damen`, `Junioren`, `Juniorinnen`, `1. Herren`, `2. Herren`, `1. Damen`, `2. Damen`, `Alte Herren`, `A-Jugend`, `B-Jugend`, `C-Jugend`, `D-Jugend`, `E-Jugend`, `F-Jugend`, `Minikicker`, `B-Juniorinnen`, `C-Juniorinnen`, `D-Juniorinnen`, `E-Juniorinnen`, `Tennis`, `Volleyball`, `Rückensport`, `Fitness/Gymnastik`, `Veranstaltung`, `Nachruf`, `Sponsoren`.
- Ausgeschlossene Alt-Beiträge (Joomla-IDs, zugesagt): `8, 16, 31, 32, 33, 53, 61, 81, 82, 83, 84, 86, 87, 88, 91, 92, 96, 100, 104, 107, 116, 117, 123, 124, 128, 161, 174, 179`.
- Entfallen: `/verein/intern.html`, Einzel-Kontaktseiten `/kontakte/<gruppe>/<id>-*.html` (→ Weiterleitung auf `/kontakt/`), Nextcloud-Umfrage-Links.

## Review Focus

- Tags mit Umlaut/Sonderzeichen in URLs (`Fußball`, `Fitness/Gymnastik`, `1. Herren`) → stabile Slugs `fussball`, `fitness-gymnastik`, `1-herren`; Test in Task 1.
- Beitrag ohne Titelbild und ohne Tags (CMS-Schreiber vergisst es) → Build bricht nicht, Beitrag erscheint unter Aktuelles; Test in Task 1 (Schema) und Task 4 (Fixture-Beitrag).
- Seite unter Unterpfad `/EintrachtBerssen/` → keine internen Links ohne Base; Check in Task 6 (`check-site`).
- Abteilung/Team ohne Beiträge und ohne Text → freundlicher Hinweis + Ansprechpartner statt leerer Seite; Test in Task 4.
- Handybreite 375 px → kein horizontales Scrollen, Menü bedienbar; Playwright-Check in Task 6.

---

### Task 1: Projektgerüst, Datenmodell, Layout, Deploy

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`
- Create: `src/content.config.ts`, `src/data/tags.ts`, `src/data/sections.ts`, `src/lib/slug.ts`, `src/lib/url.ts`, `src/lib/posts.ts`
- Create: `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/styles/global.css`, `public/favicon.svg`, `public/images/logo.*` (aus Mirror übernommen)
- Create: `.github/workflows/deploy.yml`
- Test: `tests/lib.test.ts`

**Interfaces:**
- Produces:
  - `TAGS: readonly string[]` (exakte Liste aus Global Constraints), `type Tag`.
  - `slugify(s: string): string` – lowercase, `ß→ss`, `ä→ae`, `ö→oe`, `ü→ue`, alles andere Nicht-[a-z0-9] → `-`, zusammengefasst, getrimmt.
  - `url(path: string): string` – setzt `import.meta.env.BASE_URL` davor, genau ein `/` dazwischen.
  - `type Section = { slug: string; title: string; tags: Tag[]; contactGroups: string[]; children?: Section[] }`; `SECTIONS: Section[]` mit Baum: `fussball` (Tags `Fußball`) › `herren` (`1. Herren`,`2. Herren`,`Alte Herren` als Kinder), `damen` (`1. Damen`,`2. Damen`), `junioren` (Minikicker, F–A), `juniorinnen` (E–B); `tennis`, `volleyball`, `rueckensport`, `fitness-gymnastik`. Eltern erben die Tags ihrer Kinder (`allTags(section)`).
  - `allTags(s: Section): Tag[]`, `findSection(path: string[]): Section | undefined`.
  - `postsForTags(posts: Post[], tags: Tag[]): Post[]` – Beiträge mit mindestens einem Tag, neueste zuerst.
  - Collections in `src/content.config.ts` (Astro glob loader):
    - `posts` (`src/content/posts/*.md`): `title: string`, `date: date`, `tags: Tag[]` default `[]`, `image?: string`, `gallery?: string[]` default `[]`, `legacyId?: number`.
    - `sections` (`src/content/sections/<slug>.md`): `title`, `image?`, `training?: string` (Freitext), Body = fester Text.
    - `galleries` (`src/content/galleries/*.md`): `title`, `year: number`, `images: string[]`.
    - `pages` (`src/content/pages/*.md`): `title`, Body (Chronik, Sportgelände, Anfahrt, Impressum, Datenschutz, Belegungsplan, Downloads-Einleitung).
  - `src/data/contacts.json`: `{ group: string; name: string; role: string; phone?: string; email?: string; image?: string }[]`; Gruppen exakt: `Vorstand`, `Vorstand Tennis`, `Fußball Senioren`, `Fußball Junioren`, `Fußball Juniorinnen`, `Fitness/Gymnastik`.

- [ ] **Step 1: `npm create astro@latest` (minimal, TS strict) anlegen, Abhängigkeiten installieren** (`astro`, `@astrojs/rss`, `vitest`, `cheerio`, `turndown`, `sharp`, Schrift-Paket). `astro.config.mjs`: `site`/`base` aus Env (Global Constraints), `trailingSlash: 'always'`, `build.format: 'directory'`.
- [ ] **Step 2: Failing tests in `tests/lib.test.ts`**

```ts
expect(slugify('Fußball')).toBe('fussball');
expect(slugify('Fitness/Gymnastik')).toBe('fitness-gymnastik');
expect(slugify('1. Herren')).toBe('1-herren');
expect(slugify('Rückensport')).toBe('rueckensport');
expect(new Set(TAGS.map(slugify)).size).toBe(TAGS.length); // keine Slug-Kollision
expect(allTags(findSection(['fussball'])!)).toEqual(expect.arrayContaining(['Fußball','1. Herren','D-Juniorinnen','Minikicker']));
expect(SECTIONS.flatMap(function f(s): Tag[] { return [...s.tags, ...(s.children ?? []).flatMap(f)]; }).every(t => TAGS.includes(t))).toBe(true);
// postsForTags: Beitrag mit tags [] taucht nicht auf, Sortierung absteigend nach date
```

- [ ] **Step 3: `npx vitest run` → FAIL (Module fehlen).**
- [ ] **Step 4: Implementieren** (`slug.ts`, `tags.ts`, `sections.ts`, `posts.ts`, `url.ts`, `content.config.ts` mit `z.enum(TAGS)` für Tags).
- [ ] **Step 5: Layout & Design-System.** `global.css` mit Tokens (`--red: #c8102e`, Weiß, neutrale Grautöne, Radius, Schatten), Inter selbst gehostet, Container max. 1200 px, 16 px Gutter mobil. `Header`: Logo + Name, Navigation Aktuelles / Verein ▾ / Sport ▾ / Kontakt, auf Mobil Burger-Menü (reines `<details>`/CSS, kein Framework). `Footer`: Adresse, Links Impressum, Datenschutz, Fanshop (`https://eintracht-berssen.pd-server.com/`), Spielplan (`/spielplan/`), „Werde Schiedsrichter!“ (Ziel-URL aus Mirror-Startseite übernehmen). Platzhalter-`src/pages/index.astro`.
- [ ] **Step 6: `.github/workflows/deploy.yml`** – `actions/checkout`, `actions/setup-node@v4` (22, npm cache), `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact`, `actions/deploy-pages`; Trigger `push` auf `main` + `workflow_dispatch`; Env `SITE_URL`/`BASE_PATH` aus Repo-Variablen mit obigen Defaults.
- [ ] **Step 7: `npx vitest run` und `npm run build` → PASS.**
- [ ] **Step 8: Commit** `feat: Astro-Gerüst, Datenmodell, Layout, Deploy-Workflow`.

### Task 2: Import der Beiträge

**Files:**
- Create: `scripts/import/article.mjs`, `scripts/import/tagging.mjs`, `scripts/import/images.mjs`, `scripts/import/posts.mjs` (CLI)
- Create: `tests/fixtures/article-182.html`, `tests/fixtures/article-94.html` (aus Mirror kopiert: Galerie bzw. YouTube-iframe)
- Test: `tests/import.test.ts`
- Generated: `src/content/posts/*.md`, `public/images/posts/<slug>/*`

**Interfaces:**
- Consumes: `TAGS`, `slugify` (Task 1).
- Produces:
  - `EXCLUDED_IDS: Set<number>` (exakte Liste aus Global Constraints).
  - `parseArticle(html: string, file: string): { id: number; slug: string; title: string; date: string /*ISO*/; bodyHtml: string; images: string[] /*absolute Original-URLs, Body + SIGE-Galerie*/; embeds: {kind:'youtube'|'other'; src:string}[] }` – liest `<main>`, `h1`, `time[datetime]`, `.com-content-article__body`; ID/Slug aus Dateiname `<id>-<slug>.html`; „Weiterlesen“-Teaser ignorieren.
  - `htmlToMarkdown(bodyHtml: string, imageMap: Record<string,string>): string` – turndown; SIGE-`<ul class="sige">` entfernt (Bilder gehen in `gallery`), iframes → `<ConsentEmbed>`-kompatibler Marker `::embed{kind="youtube" src="…"}` (Remark-Direktive, in Task 4 gerendert), Links auf `nextcloud.` entfernt (Linktext bleibt), interne Joomla-Links → neue URLs via `mapLegacyUrl`.
  - `suggestTags(title: string, text: string): Tag[]` – Stichwortregeln (z. B. `/tennis/i→Tennis`, `/volleyball/i→Volleyball`, `/d-juniorinnen/i→D-Juniorinnen,Juniorinnen,Fußball`, `/1\.\s*herren/i→1. Herren,Herren,Fußball`, `/nachruf|verstorben/i→Nachruf`, `/generalversammlung|jubiläum/i→Verein`, `/spende|sponsor|trikot/i→Sponsoren`), Ergebnis dedupliziert, Fallback `['Verein']`.
  - `importImage(srcUrl: string, destDir: string): Promise<string>` – liest Datei aus `MIRROR` (URL → lokaler Pfad), sharp resize ≤1600 px, gibt öffentlichen Pfad `/images/posts/<slug>/<datei>` zurück.
  - CLI: `MIRROR=… node scripts/import/posts.mjs` schreibt `src/content/posts/<YYYY-MM-DD>-<slug>.md` mit Frontmatter `title,date,tags,image(erstes Bild),gallery,legacyId` und gibt Tabelle `id | Titel | Tags` nach `docs/import-report.md` aus.

- [ ] **Step 1: Failing tests**

```ts
const a = parseArticle(fixture182, '182-ein-besonderer-tag-fuer-unsere-jsg-suedhuemmling-c-juniorinnen.html');
expect(a.id).toBe(182);
expect(a.date.startsWith('2026-08-10')).toBe(true);
expect(a.title).toContain('JSG Südhümmling C- Juniorinnen');
expect(a.images.length).toBeGreaterThanOrEqual(4);
expect(htmlToMarkdown(a.bodyHtml, {})).not.toContain('sige');
expect(parseArticle(fixture94, '94-fussballcamp-auf-unserem-sportgelaende.html').embeds.some(e => e.kind === 'youtube')).toBe(true);
expect(EXCLUDED_IDS.has(179)).toBe(true); expect(EXCLUDED_IDS.has(185)).toBe(false);
expect(suggestTags('Neue Trikots für unsere D-Juniorinnen', '')).toEqual(expect.arrayContaining(['D-Juniorinnen','Juniorinnen','Fußball','Sponsoren']));
expect(suggestTags('Mixed-Turnier der Tennisabteilung', '')).toContain('Tennis');
expect(suggestTags('Irgendwas', '')).toEqual(['Verein']);
expect(htmlToMarkdown('<p><a href="https://nextcloud.x/apps/forms/s/1">Zur Umfrage</a></p>', {})).toBe('Zur Umfrage');
```

- [ ] **Step 2: `npx vitest run tests/import.test.ts` → FAIL.**
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4: Tests → PASS.**
- [ ] **Step 5: Import laufen lassen** mit `MIRROR=/tmp/claude-0/-home-user-EintrachtBerssen/a475599d-3c52-5514-8a0b-8812423a54b4/scratchpad/mirror/eintracht-berssen.de`. Erwartet: 113 − 28 = **85** Dateien in `src/content/posts/`, `npm run build` grün. Stichprobe von 10 Einträgen im Report auf plausible Tags prüfen und Regeln nachschärfen.
- [ ] **Step 6: Commit** `feat: Import der Alt-Beiträge` (Skripte, Tests, generierte Inhalte, Bilder, Report).

### Task 3: Import von Kontakten, Seiten, Galerien, Downloads

**Files:**
- Create: `scripts/import/contacts.mjs`, `scripts/import/pages.mjs`, `scripts/import/galleries.mjs`
- Test: `tests/import-static.test.ts`, Fixture `tests/fixtures/kontakte-vorstand.html`
- Generated: `src/data/contacts.json`, `src/content/pages/*.md`, `src/content/sections/*.md`, `src/content/galleries/*.md`, `public/images/galerien/**`, `public/downloads/*.pdf`, `public/images/belegung/*.png`, `src/data/downloads.json`

**Interfaces:**
- Consumes: `importImage`, `htmlToMarkdown` (Task 2), Collection-Schemas (Task 1).
- Produces:
  - `decodeHiddenMail(el): string` – Joomla `<joomla-hidden-mail first=… last=…>`: `atob(first) + '@' + atob(last)`.
  - `parseContactList(html: string, group: string): Contact[]` aus `/kontakte/<gruppe>.html` (Name, Funktion, Telefon, E-Mail).
  - `src/data/downloads.json`: `{ category: 'Mitgliedschaft'|'Fußball'|'Protokolle'; title: string; href: string; note?: string }[]` – Aufnahmeantrag Sportverein, Aufnahmeantrag Tennisverein (Hinweis „Der Tennisverein bietet eine separate Mitgliedschaft an.“), NFV-Spielerlaubnis (extern), GV-Protokoll 2025.
  - Pages: `chronik`, `sportgelaende`, `anfahrt` (Google-Maps-iframe → `::embed{kind="maps" src=…}`), `belegungsplan` (beide Bilder), `impressum`, `datenschutz` (übernommen; Joomla-/Mittwald-spezifische Abschnitte in Task 5 ersetzt).
  - Sections-Texte aus `/sportabteilungen/*` und Unterseiten, nur wenn nicht leer (Volleyball, Rückensport, Tennis-Termine → `tennis.md` `training`, Fußball-Übersicht). Leere Seiten erzeugen **keine** Datei.
  - Galerien: alle 11 aus `/verein/fotos/<jahr>/<name>.html` mit Jahr.

- [ ] **Step 1: Failing tests**

```ts
const c = parseContactList(fixtureVorstand, 'Vorstand');
expect(c.find(x => x.name === 'Sebastian Untiedt')).toMatchObject({ role: '1. Vorsitzender', phone: '0162/2050448' });
expect(c.find(x => x.name === 'Sebastian Untiedt')!.email).toMatch(/@/);
expect(c.length).toBe(11);
```

- [ ] **Step 2: → FAIL. Step 3: implementieren. Step 4: → PASS.**
- [ ] **Step 5: Skripte gegen Mirror laufen lassen.** Erwartet: 6 Gruppen in `contacts.json` (~35 Einträge), 11 Galerien, 4 Downloads (3 lokal), 6 Pages. `npm run build` grün.
- [ ] **Step 6: Commit** `feat: Import von Kontakten, Seiten, Galerien, Downloads`.

### Task 4: Seiten und Komponenten

**Files:**
- Create: `src/components/PostCard.astro`, `PostList.astro`, `Pagination.astro`, `TagChips.astro`, `ConsentEmbed.astro`, `Gallery.astro`, `ContactCard.astro`, `SectionNav.astro`
- Create: `src/lib/remark-embed.mjs` (Direktive `::embed` → `ConsentEmbed`-HTML)
- Create pages: `src/pages/index.astro`, `aktuelles/[...page].astro`, `aktuelles/tag/[tag]/[...page].astro`, `beitrag/[slug].astro`, `sport/index.astro`, `sport/[...path].astro`, `verein/index.astro`, `verein/[page].astro` (chronik, sportgelaende, anfahrt, belegungsplan), `verein/vorstand.astro`, `verein/downloads.astro`, `verein/fotos/index.astro`, `verein/fotos/[slug].astro`, `kontakt.astro`, `spielplan.astro`, `impressum.astro`, `datenschutz.astro`, `404.astro`, `rss.xml.ts`
- Test: `tests/pages.test.ts` (Astro Container API)

**Interfaces:**
- Consumes: alles aus Task 1, Inhalte aus Task 2/3.
- Produces: URL-Schema (für Task 5): `/aktuelles/`, `/aktuelles/2/`, `/aktuelles/tag/<tagSlug>/`, `/beitrag/<datei-slug>/`, `/sport/<pfad…>/` (z. B. `/sport/fussball/juniorinnen/d-juniorinnen/`), `/verein/<seite>/`, `/verein/fotos/<slug>/`, `/kontakt/`, `/spielplan/`, `/impressum/`, `/datenschutz/`, `/rss.xml`.
- `ConsentEmbed` Props: `{ kind: 'youtube'|'maps'|'fussballde'|'other'; src: string; title: string }` – zeigt Platzhalter mit Anbietername, Hinweis „Beim Laden werden Daten an <Anbieter> übertragen“ und Button „Inhalt laden“; erst Klick fügt iframe/Script ein (kleines Inline-Script, kein externes).

Inhalte je Seite:
- **Start:** Hero (Foto Sportanlage aus Mirror, Vereinsname, „seit 1946“), 6 neueste Beiträge als Karten, Kacheln der Abteilungen (Fußball, Tennis, Volleyball, Rückensport), Box „Mitglied werden“ → Downloads.
- **Aktuelles:** 12 pro Seite, Tag-Filter-Chips oben (alle Tags mit ≥1 Beitrag).
- **Beitrag:** Titelbild, Datum (`10. August 2026`), Tags als Links, Text, Galerie mit Lightbox (CSS/`<dialog>`), „Weitere Beiträge“ (3 mit gleichem Tag).
- **Sport-Seite:** Titel, Bild, fester Text + Trainingszeiten (falls vorhanden), Unterbereiche als Kacheln, Ansprechpartner aus `contactGroups`, Beiträge `postsForTags(allTags(section))` (10 + Link zu `/aktuelles/tag/<erster Tag>/`); wenn weder Text noch Beiträge: „Hier gibt es noch keine Beiträge. Fragen? Sprich unsere Ansprechpartner an.“
- **Kontakt** = alle Gruppen; **Verein › Vorstand** = Gruppe `Vorstand` (gleiche Komponente). E-Mails per `data-`Attribut verschleiert, per Inline-Script zusammengesetzt; ohne JS sichtbar als „name [at] domain“.
- **Spielplan:** `ConsentEmbed kind="fussballde"` mit Widget-ID aus Mirror-Startseite + Link zu fussball.de.

- [ ] **Step 1: Failing tests** (Astro Container API, `experimental_AstroContainer`):

```ts
// Sport-Seite ohne Beiträge/Text
expect(await render(SportPage, { section: findSection(['fitness-gymnastik'])!, posts: [] })).toContain('noch keine Beiträge');
// PostCard ohne Bild und ohne Tags rendert
expect(await render(PostCard, { post: { id:'x', data:{ title:'T', date:new Date('2026-01-01'), tags:[], gallery:[] } } })).toContain('T');
// ConsentEmbed rendert vor Klick kein iframe
const html = await render(ConsentEmbed, { kind:'youtube', src:'https://www.youtube.com/embed/abc', title:'Video' });
expect(html).not.toContain('<iframe'); expect(html).toContain('Inhalt laden');
```

- [ ] **Step 2: → FAIL. Step 3: Komponenten und Seiten implementieren. Step 4: → PASS, `npm run build` grün.**
- [ ] **Step 5: Commit** `feat: Seiten, Tag-Logik, Zwei-Klick-Embeds`.

### Task 5: Weiterleitungen, Datenschutz, Eingabemaske, Anleitungen

**Files:**
- Create: `scripts/import/redirects.mjs` → `src/data/redirects.json` (`Record<altPfad, neuPfad>`), in `astro.config.mjs` als `redirects` eingebunden (Astro erzeugt Meta-Refresh-Seiten)
- Modify: `src/content/pages/datenschutz.md`, `src/content/pages/impressum.md`
- Create: `.pages.yml`, `docs/redaktion.md`, `docs/umzug.md`
- Test: `tests/redirects.test.ts`

**Interfaces:**
- Consumes: URL-Schema (Task 4), `legacyId` in Posts, Mirror-Dateiliste.
- Produces: `mapLegacyUrl(oldPath: string): string | null` (auch von Task 2 für interne Links genutzt – falls Task 2 vorher läuft, dort vorläufig nur Beitrags-IDs mappen und hier vervollständigen).
  Regeln: `/<id>-<slug>.html` → `/beitrag/<neuer-slug>/` bzw. ausgeschlossene IDs → `/aktuelles/`; `/index.html?start=N` → `/aktuelles/`; `/sportabteilungen/...` → passende `/sport/...`; `/kontakte/**` → `/kontakt/`; `/verein/vorstand.html` → `/verein/vorstand/`; `/verein/fotos/<jahr>/<name>.html` → `/verein/fotos/<slug>/`; `/verein/intern.html` → `/`; sonstige `/verein/x.html` → `/verein/x/`; `/impressum.html`, `/datenschutzerklaerung.html` → `/impressum/`, `/datenschutz/`.

- [ ] **Step 1: Failing test** – für **jede** `.html`-Datei im Mirror (Liste als `tests/fixtures/legacy-paths.txt` committet) liefert `mapLegacyUrl` ein Ziel, und jedes Ziel ist eine Route aus Task 4 (Abgleich gegen `dist/` erfolgt in Task 6; hier gegen Muster-Regex). Plus: `mapLegacyUrl('/183-rot-weisse-nacht-beim-sv-eintracht-berssen.html')` endet auf `rot-weisse-nacht-beim-sv-eintracht-berssen/`, `mapLegacyUrl('/179-einladung-zur-generalversammlung-2026.html') === '/aktuelles/'`.
- [ ] **Step 2: → FAIL. Step 3: implementieren. Step 4: → PASS.**
- [ ] **Step 5: Datenschutz anpassen:** Joomla-/Mittwald-Teile ersetzen durch: Hosting GitHub Pages (GitHub Inc., USA, Server-Logs mit IP, EU-US Data Privacy Framework), keine Cookies, keine Tracker, Zwei-Klick-Inhalte (YouTube, Google Maps, fussball.de) mit jeweiligem Hinweis, selbst gehostete Schrift. Impressum unverändert übernehmen (Hoster-Angaben, falls vorhanden, aktualisieren). Markieren als „bitte vom Vorstand prüfen“ im Abschlussbericht.
- [ ] **Step 6: `.pages.yml`** – `media: { input: public/images/uploads, output: /images/uploads }`; Content `posts` (Label „Beiträge“, Pfad `src/content/posts`, Dateiname `{year}-{month}-{day}-{primary}`, Felder: Titel (string, Pflicht), Datum (date, Default heute), Titelbild (image), Tags (select, multiple, Optionen = TAGS), Text (rich-text), Galerie (image, multiple)); `sections` (Label „Abteilungen & Teams“: Titel, Bild, Trainingszeiten, Text); `contacts` (Datei `src/data/contacts.json`, Liste mit Feldern); `galleries` (Label „Fotoalben“). Schlüssel und Feldnamen müssen den Schemas aus Task 1 entsprechen.
- [ ] **Step 7: `docs/redaktion.md`** (Deutsch, für Laien): GitHub-Konto anlegen, Einladung annehmen, app.pagescms.org öffnen, Repo wählen, „Beiträge → Neu“, Felder ausfüllen, Tags wählen, Speichern, nach ca. 2 Minuten online; Bild ersetzen; Kontakt ändern; Beitrag löschen. **`docs/umzug.md`**: (1) GitHub-Organisation anlegen, Repo übertragen, Repo-Variablen `SITE_URL=https://eintracht-berssen.de`, `BASE_PATH=/` setzen, Pages auf „GitHub Actions“; (2) bei INWX Domain-Transfer mit Auth-Code von Mittwald + Mailpaket; Postfächer anlegen, Mails per IMAP umziehen; (3) DNS: A `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, AAAA `2606:50c0:8000::153` … `8003::153`, `www` CNAME `<org>.github.io.`, MX/SPF/DKIM laut INWX; (4) Custom Domain + „Enforce HTTPS“ in GitHub; (5) Pages CMS einrichten und Schreiber einladen; (6) erst danach Mittwald kündigen.
- [ ] **Step 8: Commit** `feat: Weiterleitungen, Datenschutz, Pages-CMS-Konfiguration, Anleitungen`.

### Task 6: Gesamtprüfung

**Files:**
- Create: `scripts/check-site.mjs`, `scripts/smoke.mjs`; `package.json` Scripts `check` (`astro build && node scripts/check-site.mjs`) und `smoke`

**Interfaces:**
- Consumes: `dist/`, `src/data/redirects.json`.

- [ ] **Step 1: `check-site.mjs`** – durchsucht alle HTML-Dateien in `dist/`: jeder interne `href`/`src` beginnt mit `BASE_PATH` und existiert in `dist/`; kein `<script src="http…">`, kein `<iframe` im ausgelieferten HTML, keine `fonts.googleapis`; jedes Redirect-Ziel existiert. Exit 1 mit Liste bei Fehlern.
- [ ] **Step 2: `npm run check` → PASS** (Fehler beheben, bis grün).
- [ ] **Step 3: `smoke.mjs`** – `astro preview`, Playwright (vorinstalliert, `require('playwright')`) öffnet Start, Aktuelles, einen Beitrag, `/sport/tennis/`, `/sport/fussball/juniorinnen/d-juniorinnen/`, `/kontakt/`, `/spielplan/` bei 375 px und 1280 px: Status 200, `document.documentElement.scrollWidth <= innerWidth`, Burger-Menü öffnet; Screenshots (deviceScaleFactor 2) in den Scratchpad für den Abschlussbericht.
- [ ] **Step 4: `npm run smoke` → PASS.**
- [ ] **Step 5: Commit** `test: Link-, Datenschutz- und Mobil-Checks` und `git push`.
