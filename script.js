/* =========================================================
   Matverket Bodø – oppførsel
   Alt er progressivt: uten JS vises innholdet som normalt,
   og skjemaet sender seg som et vanlig POST-skjema.
   ========================================================= */

document.documentElement.classList.add('js');

const roligBevegelse = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- Topplinje ---------- */

(function topplinje(){
  const topp = document.querySelector('[data-topp]');
  if (!topp) return;

  // getBoundingClientRect gir desimaler. offsetHeight runder av, og et avrundet
  // tall som er større enn menyen etterlater en stripe av forrige seksjon.
  const settHoyde = () =>
    document.documentElement.style.setProperty(
      '--topp-hoyde', topp.getBoundingClientRect().height + 'px');

  const settSkygge = () => {
    if (window.scrollY > 8) topp.setAttribute('data-festet', '');
    else topp.removeAttribute('data-festet');
  };

  settHoyde();
  settSkygge();
  window.addEventListener('resize', settHoyde);
  window.addEventListener('scroll', settSkygge, { passive: true });
})();

/* ---------- Mobilmeny ---------- */

(function mobilmeny(){
  const knapp = document.querySelector('[data-menyknapp]');
  const meny  = document.querySelector('[data-meny]');
  if (!knapp || !meny) return;

  const lukk = () => {
    knapp.setAttribute('aria-expanded', 'false');
    meny.removeAttribute('data-apen');
    document.body.classList.remove('meny-apen');
  };

  const apne = () => {
    knapp.setAttribute('aria-expanded', 'true');
    meny.setAttribute('data-apen', '');
    document.body.classList.add('meny-apen');
  };

  knapp.addEventListener('click', () => {
    if (knapp.getAttribute('aria-expanded') === 'true') lukk();
    else apne();
  });

  meny.addEventListener('click', (e) => {
    if (e.target.closest('a')) lukk();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && knapp.getAttribute('aria-expanded') === 'true') {
      lukk();
      knapp.focus();
    }
  });

  // Lukk hvis vinduet vokser forbi mobilbruddpunktet
  window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
    if (e.matches) lukk();
  });
})();

/* ---------- Avsløring ved scroll ---------- */

(function avslor(){
  const elementer = document.querySelectorAll('[data-avslor]');
  if (!elementer.length) return;

  if (roligBevegelse.matches || !('IntersectionObserver' in window)) {
    elementer.forEach(el => el.classList.add('er-synlig'));
    return;
  }

  const vokter = new IntersectionObserver((oppforinger) => {
    oppforinger.forEach((oppforing) => {
      if (!oppforing.isIntersecting) return;

      // Søsken som treffer samtidig trappes litt for rytmens skyld
      const sosken = [...oppforing.target.parentElement.children]
        .filter(el => el.hasAttribute('data-avslor'));
      const plass = Math.max(0, sosken.indexOf(oppforing.target));

      oppforing.target.style.transitionDelay = Math.min(plass * 70, 280) + 'ms';
      oppforing.target.classList.add('er-synlig');
      vokter.unobserve(oppforing.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  elementer.forEach(el => vokter.observe(el));
})();

/* ---------- Kornaksnavigasjon ---------- */

(function kornaks(){
  const stilk = document.querySelector('.stilk');
  const stengel = document.querySelector('.stilk__stengel');
  const blader = document.querySelectorAll('.stilk__blad');
  const seksjoner = document.querySelectorAll('[data-seksjon]');
  if (!stilk || !stengel || !blader.length
      || blader.length !== seksjoner.length) return;

  const settAktiv = (navn) => {
    blader.forEach(blad => {
      if (blad.dataset.mal === navn) blad.setAttribute('aria-current', 'true');
      else blad.removeAttribute('aria-current');
    });
  };

  // Bladgeometrien måles utenom rulling og mellomlagres: stilken ligger
  // fast i vinduet, så bladene flytter seg bare når oppsettet endres.
  // Måling per rulleramme ga dessuten selvsving – et markert blad er
  // skalert, og et blad som vokser flytter sin egen terskel.
  //
  // Det er SVG-en som måles, ikke lenkeboksen: på skrivebord er bladet
  // festet i bunnen av boksen og vokser oppover, så boksens senter treffer
  // ikke det synlige bladet. Stilken er loddrett på skrivebord og vannrett
  // på telefon; aksen leses av selv, siden bruddpunktene ikke skal gjentas
  // her.
  let geo = null;
  const mal = () => {
    const sr = stengel.getBoundingClientRect();
    const loddrett = sr.height > sr.width;
    const lengde = loddrett ? sr.height : sr.width;
    if (!lengde) { geo = null; return; }
    // Vannrett ligger alle bladene i topplinja, så terskelen (se under)
    // er like under stilken – med nok monn til at ankerhopp, som lander
    // 2 px over stilkbunnen (scroll-padding), havner forbi terskelen.
    const stilkBunn = stilk.getBoundingClientRect().bottom + 6;
    geo = [...blader].map(b => {
      const k = b.querySelector('svg').getBoundingClientRect();
      return {
        // Bladsenterets andel av stengelen – hit skal streken rekke idet
        // bladet markeres. Måles i stedet for å regnes ut, siden bladene
        // fordeles med space-between og stengelen stikker forbi dem.
        andel: loddrett
          ? (k.top + k.height / 2 - sr.top) / lengde
          : (k.left + k.width / 2 - sr.left) / lengde,
        // Skjermhøyden seksjonstoppen må krysse for at bladet markeres:
        // høyden der bladet selv står. Da tennes bladet i samme øyeblikk
        // som seksjonstoppen og strekfronten passerer det.
        terskel: loddrett ? k.top + k.height / 2 : stilkBunn
      };
    });
    // Full strek og «siste blad markert» skal være samme øyeblikk, og det
    // er hele stengelen som skal fylles – også stykket forbi bladet.
    geo[geo.length - 1].andel = 1;
  };

  // Hvilken seksjon som gjelder, og hvor langt vi er kommet mot den neste.
  // Knutepunktet er rulleposisjonen der seksjonens topp krysser bladets
  // terskel. Seksjonene måles hver ramme – de flytter seg etter hvert som
  // bilder og fonter lastes – mens bladene ligger fast i vinduet.
  const seksjonsposisjon = () => {
    const y = window.scrollY;
    const knuter = [...seksjoner].map((s, i) =>
      s.getBoundingClientRect().top + y - geo[i].terskel);
    // Første seksjon er aktiv allerede ved rullestart, men knutepunktet
    // dens ligger på negativ y. Uten denne startet streken et stykke
    // forbi første blad ved lasting.
    knuter[0] = Math.max(knuter[0], 0);
    // Er siden for kort til at siste seksjonstopp rekker opp til
    // terskelen, markeres siste blad ved bunnen av siden i stedet –
    // ellers ville verken bladet eller resten av streken kunne nås.
    const maks = document.documentElement.scrollHeight - window.innerHeight;
    knuter[knuter.length - 1] = Math.min(knuter[knuter.length - 1], maks);
    for (let i = knuter.length - 1; i >= 0; i--) {
      if (y >= knuter[i]) {
        const neste = knuter[i + 1];
        const spenn = neste === undefined ? 0 : neste - knuter[i];
        const andel = spenn > 0 ? Math.min(1, Math.max(0, (y - knuter[i]) / spenn)) : 0;
        return { indeks: i, andel };
      }
    }
    return { indeks: 0, andel: 0 };
  };

  // Fremdriftslinje i stengelen, og lys variant over mørke flater
  const morkeFlater = document.querySelectorAll('.seksjon--mork, .bunn');
  let planlagt = false;
  const tegn = () => {
    planlagt = false;

    if (!geo) mal();
    if (geo) {
      const p = seksjonsposisjon();
      settAktiv(seksjoner[p.indeks].dataset.seksjon);
      if (!roligBevegelse.matches) {
        const fra = geo[p.indeks].andel;
        const til = geo[Math.min(p.indeks + 1, geo.length - 1)].andel;
        stilk.style.setProperty('--fremdrift', (fra + (til - fra) * p.andel).toFixed(4));
      }
    }

    // Stilken sitter loddrett midt i vinduet – sjekk hva som ligger bak den
    const midt = window.innerHeight / 2;
    const overMork = [...morkeFlater].some(f => {
      const r = f.getBoundingClientRect();
      return r.top <= midt && r.bottom >= midt;
    });
    if (overMork) stilk.setAttribute('data-mork', '');
    else stilk.removeAttribute('data-mork');
  };
  const be = () => { if (!planlagt) { planlagt = true; requestAnimationFrame(tegn); } };
  const malOgTegn = () => { mal(); tegn(); };

  window.addEventListener('scroll', be, { passive: true });
  window.addEventListener('resize', malOgTegn);
  // Fonter og bilder som lander etter første måling flytter topplinja,
  // og dermed stilken på telefon
  window.addEventListener('load', malOgTegn);
  if (document.fonts) document.fonts.ready.then(malOgTegn);
  malOgTegn();

  // IntersectionObserver er fjernet herfra med vilje. Den valgte blad etter
  // hvor stor andel av en seksjon som var synlig, og en høy seksjon får
  // lavere andel enn en lav selv når den fyller mer av skjermen. Rullereglen
  // over er både enklere og den eneste som kan treffe streken.
})();

/* ---------- Kurskortene som sveipefelt på telefon ----------
   Et vannrett rullefelt uten fokuserbart innhold kan ikke rulles med
   tastatur. Feltet gjøres derfor fokuserbart, men bare når det faktisk
   er et sveipefelt – ellers ville det blitt et unødig tabulatorstopp. */

(function sveipefelt(){
  const felt = document.querySelector('.kurs');
  if (!felt) return;

  const smal = window.matchMedia('(max-width: 639px)');
  const still = () => {
    if (smal.matches) {
      felt.setAttribute('tabindex', '0');
      felt.setAttribute('role', 'group');
      felt.setAttribute('aria-label', 'Kurs – sveip for å se flere');
    } else {
      felt.removeAttribute('tabindex');
      felt.removeAttribute('role');
      felt.removeAttribute('aria-label');
    }
  };

  still();
  smal.addEventListener('change', still);

  // Bladprikkene følger hvilket kort som står framme
  const prikker = [...document.querySelectorAll('.kursprikker svg')];
  if (prikker.length) {
    let planlagt = false;
    const merk = () => {
      planlagt = false;
      const kort = felt.querySelector('.kort');
      if (!kort) return;
      const steg = kort.getBoundingClientRect().width
                 + (parseFloat(getComputedStyle(felt).columnGap) || 0);
      const i = steg > 0 ? Math.round(felt.scrollLeft / steg) : 0;
      const valgt = Math.min(Math.max(i, 0), prikker.length - 1);
      prikker.forEach((p, n) => {
        if (n === valgt) p.setAttribute('data-aktiv', '');
        else p.removeAttribute('data-aktiv');
      });
    };
    felt.addEventListener('scroll', () => {
      if (!planlagt) { planlagt = true; requestAnimationFrame(merk); }
    }, { passive: true });
    window.addEventListener('resize', merk);
    merk();
  }
})();

/* ---------- Skjema ---------- */

(function skjema(){
  const form = document.querySelector('[data-skjema]');
  if (!form) return;

  const status = form.querySelector('[data-status]');
  const knapp  = form.querySelector('[data-send]');
  const pakrevde = [...form.querySelectorAll('[required]')];

  const feilmelding = (felt) => {
    if (felt.validity.valueMissing) {
      return felt.type === 'email'
        ? 'Skriv inn e-postadressen din.'
        : 'Dette feltet må fylles ut.';
    }
    if (felt.validity.typeMismatch && felt.type === 'email') {
      return 'Sjekk e-postadressen – den mangler noe.';
    }
    return 'Sjekk dette feltet.';
  };

  const visFeil = (felt, tekst) => {
    felt.setAttribute('aria-invalid', 'true');
    let boks = felt.parentElement.querySelector('.skjema__feil');
    if (!boks) {
      boks = document.createElement('span');
      boks.className = 'skjema__feil';
      boks.id = felt.id + '-feil';
      felt.parentElement.appendChild(boks);
    }
    boks.textContent = tekst;
    felt.setAttribute('aria-describedby', boks.id);
  };

  const fjernFeil = (felt) => {
    felt.removeAttribute('aria-invalid');
    felt.removeAttribute('aria-describedby');
    const boks = felt.parentElement.querySelector('.skjema__feil');
    if (boks) boks.remove();
  };

  // Valider når brukeren forlater feltet, ikke ved hvert tastetrykk
  pakrevde.forEach(felt => {
    felt.addEventListener('blur', () => {
      if (felt.value.trim() && felt.checkValidity()) fjernFeil(felt);
      else if (felt.value.trim()) visFeil(felt, feilmelding(felt));
    });
    felt.addEventListener('input', () => {
      if (felt.hasAttribute('aria-invalid') && felt.checkValidity()) fjernFeil(felt);
    });
  });

  const settStatus = (tekst, tilstand) => {
    status.textContent = tekst;
    if (tilstand) status.setAttribute('data-tilstand', tilstand);
    else status.removeAttribute('data-tilstand');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    settStatus('', null);

    const ugyldige = pakrevde.filter(felt => !felt.checkValidity());
    ugyldige.forEach(felt => visFeil(felt, feilmelding(felt)));
    pakrevde.filter(felt => felt.checkValidity()).forEach(fjernFeil);

    if (ugyldige.length) {
      ugyldige[0].focus();
      settStatus('Fyll ut feltene som er merket, så sender vi forespørselen.', 'feil');
      return;
    }

    if (form.action.includes('DITT-ENDEPUNKT-HER')) {
      settStatus('Skjemaet er ikke koblet opp ennå. Ring 91 33 92 80 eller send e-post i mellomtiden.', 'feil');
      console.warn('Matverket: sett inn Formspree-endepunktet i action= på skjemaet i index.html.');
      return;
    }

    knapp.disabled = true;
    const opprinnelig = knapp.textContent;
    knapp.textContent = 'Sender …';
    settStatus('Sender forespørselen …', null);

    try {
      // Landkoden vises som fast tekst i feltet, så den må legges på verdien
      const data = new FormData(form);
      const tlf = String(data.get('telefon') || '').trim();
      if (tlf) data.set('telefon', '+47 ' + tlf);

      const svar = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });

      if (svar.ok) {
        form.reset();
        settStatus('Takk – forespørselen er sendt. Vi svarer så snart vi kan.', 'ok');
      } else {
        settStatus('Noe gikk galt under sendingen. Prøv igjen, eller ring 91 33 92 80.', 'feil');
      }
    } catch {
      settStatus('Fikk ikke kontakt med serveren. Sjekk nettforbindelsen, eller ring 91 33 92 80.', 'feil');
    } finally {
      knapp.disabled = false;
      knapp.textContent = opprinnelig;
    }
  });
})();

/* ---------- Årstall i bunnen ---------- */

(function arstall(){
  const felt = document.querySelector('[data-ar]');
  if (felt) felt.textContent = new Date().getFullYear();
})();
