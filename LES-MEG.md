# Matverket Bodø — nettside

Statisk nettside. Ingen byggesteg, ingen avhengigheter. Åpne `index.html`
i en nettleser, eller last hele mappen opp til et webhotell.

## Filer

```
index.html      All markup og tekst
styles.css      Design og layout
script.js       Meny, scroll-avsløring, kornaksnavigasjon, skjema
images/         Nettoptimaliserte bilder + logomaske og favicon
```

Originalbildene ligger urørt i `~/Downloads/Matverket/`. Bildene i `images/`
er nedskalerte og komprimerte kopier — til sammen ca. 2,6 MB mot 25 MB for
originalene.

## Før publisering

### 1. Koble opp kontaktskjemaet

Skjemaet har ingen server å sende til ennå. Slik kobler du det opp:

1. Opprett en gratis konto på [formspree.io](https://formspree.io)
2. Lag et nytt skjema og velg `Belinda@matverketbodo.com` som mottaker
3. Kopier endepunktet du får — det ser slik ut: `https://formspree.io/f/abcdwxyz`
4. Åpne `index.html`, søk etter `DITT-ENDEPUNKT-HER` og bytt ut hele URL-en

Fram til dette er gjort viser skjemaet en beskjed om å ringe eller sende
e-post i stedet. Telefon og e-post fungerer uansett.

Gratisplanen tar 50 innsendinger i måneden. Blir det for lite, koster neste
nivå omtrent 10 dollar i måneden.

Telefonfeltet viser `+47` som fast tekst foran inntastingen. Landkoden legges
på verdien når skjemaet sendes, så du mottar for eksempel `+47 123 45 678`.

### 2. Organisasjonsnummer

Bunnteksten mangler org.nr. Skal det inn, legg det i `index.html` under
`bunn__bunnlinje`:

```html
<p class="bunn__bunnlinje"><span>© <span data-ar>2026</span> Matverket Bodø · Org.nr 000 000 000</span></p>
```

### 3. Domene og deling

`og:image` i toppen av `index.html` peker på et relativt bilde. Når siden
ligger på et domene bør den byttes til full URL, ellers vises ikke
forhåndsvisningsbildet når lenken deles i Facebook eller Messenger:

```html
<meta property="og:image" content="https://matverketbodo.no/images/buffet-lg.jpg">
```

## Redigere innhold

All tekst står direkte i `index.html`, på norsk, med kommenterte seksjoner.
Teksten i «Om Matverket» og de tre kurskortene er gjengitt ordrett slik den
ble levert.

### Bytte et bilde

Legg det nye bildet i `images/` i to størrelser og oppdater `srcset` på
`<img>`-taggen. Slik lager du størrelsene:

```bash
sips -Z 560 nytt.png --out images/nytt-sm.jpg -s format jpeg -s formatOptions 62
```

### Legge til et kurskort

Kopier en hel `<li class="kort">` i kurs-seksjonen og bytt bilde, tittel og
tekst. Rutenettet håndterer fire kort like godt som tre.

## Design

| Token | Verdi | Rolle |
|---|---|---|
| `--blekk` | `#04452C` | fra logoen; tekst og overskrifter |
| `--blekk-dyp` | `#04331F` | mørk flate: kontakt og bunn |
| `--salvie` | `#DAE5DE` | lys flate; fra kundens eget materiale |
| `--papir` | `#FBFAF6` | lys flate |
| `--varsel` | `#E8A87C` | semantisk: feil i skjema |

Tre verdier må være literaler fordi de tegnes utenfor seksjonenes
fargearv: `--felt` for rullefeltet, `--feltramme` og `--plassholder`
for skjemaet.

Alt annet avledes av `currentColor`, så samme regel virker på både lys og
mørk bakgrunn: `--dempet-tone` (76 %) til dempet tekst, `--strek-tone`
(22 %) til skillelinjer. Det er grunnen til at det ikke finnes egne
lys- og mørkvarianter av hver farge.

Overskrifter i **Fraunces**, brødtekst i **Karla**, begge fra Google Fonts.
Paletten er bevisst tofarget uten aksentfarge — maten leverer all annen farge.

### Kontrast

Målt i nettleseren, ikke bare regnet ut. Tekst er sjekket mot WCAG AA (4,5:1)
og grensen rundt grensesnittelementer mot WCAG 1.4.11 (3:1).

| | Måling |
|---|---|
| Dempet tekst på papir | 5,46:1 |
| Dempet tekst på salvie | 4,77:1 |
| Dempet tekst på mørk grønn | 6,87:1 |
| Skjemafeltenes ramme | 3,46:1 |
| Plassholdertekst | 5,07:1 |

Rene skillelinjer ligger under 3:1. Det er tillatt — dekorative skiller har
ikke noe minstekrav. Endrer du en farge, mål på nytt før publisering.

## Merknader

- Logoen ligger som to ferdig innfargede PNG-er: `logo-gronn.png` til
  toppen og `logo-lys.png` til bunnen. Tidligere var det én maske som ble
  farget av CSS, men masken forsvant i enkelte nettlesere. To filer koster
  30 KB mer og har ingen slik risiko.
- Bildet `Foredrag` er hevet i midttonene så det står bedre sammen med de to
  andre kursbildene, som er lysere. Originalen er urørt.
- Fire bilder er ikke i bruk: `Rundstykke` (byttet ut med `Buffet` i
  heroen 23.08.2026), og `Biff`, `Kake` og `Selvplukk`, som ble tatt ut da
  catering- og om-seksjonene ble ryddet. Originalene ligger i `~/Downloads/Matverket/`.
  Skal ett av dem inn igjen, lag nye web-versjoner slik:

  ```bash
  sips -Z 700 kilde.png --out images/navn-sm.jpg -s format jpeg -s formatOptions 62
  ```
- Åpningssetningen i «Om Matverket» er satt større som inngang til resten.
  Ordene er nøyaktig de samme; bare skriftstørrelsen skiller de to delene.
- **Bevegelse.** To typer, ikke flere. Bildene i catering og om oss
  avdekkes nedenfra mens de setter seg fra 105 % til 100 %. Hero-bildet og
  kurskortene toner bare inn. Tekst flytter seg aldri — den toner inn på
  stedet.

  I tillegg: stengelen i kornaksmerket fylles etter hvor langt du har
  scrollet, bladet for gjeldende seksjon vokser, understreker tegnes fra
  venstre, knapper synker litt ved trykk, og menypunktene på mobil trappes
  inn. Alt slås av for brukere som har bedt om redusert bevegelse.

  Animasjonene spilles én gang. Blar du opp igjen, blir innholdet stående.

- **Masken må ligge på `<img>`, ikke på `<figure>`.** `IntersectionObserver`
  regner skjæring ut fra klippet areal, så en maske på selve elementet som
  observeres gir null areal — og da avsløres det aldri. Bildene blir borte.
- **`color-mix()` med `currentColor` virker ikke som `fill` på SVG.** Den
  fungerer for `color`, `background` og `border-color`, men kollapser til
  gjennomsiktig på `fill`. Derfor har bladene i kornaksmerket faste verdier.
  Samme grunn som at rullefeltet må ha literaler.
