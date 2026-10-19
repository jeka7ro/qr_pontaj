# Agent Rules — QR Pontaj

## REGULĂ STRICTĂ - NICIODATĂ BUTOANE SAU BADGE-URI PE 2 RÂNDURI
- Orice buton, badge, tag, pastilă sau element interactiv din interfață (în special în tabele, carduri sau header-e) **TREBUIE SĂ RĂMÂNĂ OBLIGATORIU PE UN SINGUR RÂND** (`whitespace-nowrap`).
- **ESTE STRICT INTERZIS** ca textul din interiorul unui buton, badge sau pastilă să se împartă pe 2 rânduri (ex: "5.00 € /" pe primul rând și "angajat" pe al doilea rând).
- Folosește întotdeauna clasa `whitespace-nowrap` și `shrink-0` pe butoane, pastile și badge-uri pentru a garanta afișarea pe o singură linie.
- Formatul tarifelor în tabele trebuie să fie compact și pe un singur rând: `5.00 € / angajat`.

## REGULĂ STRICTĂ - FĂRĂ FONTURI ROBOTIZATE ȘI FĂRĂ EMOJI
- **ESTE STRICT INTERZISĂ** folosirea de fonturi robotizate monospace (`font-mono`) nicăieri în aplicație.
- **ESTE STRICT INTERZISĂ** folosirea caracterelor emoji în UI, butoane, texte sau notificări. Se folosesc exclusiv iconițe SVG/Lucide.

## REGULĂ STRICTĂ - DESIGN SYSTEM (ROUNDED CORNERS)
- Toate butoanele, pastilele și input-urile trebuie să aibă colțuri rotunjite (`rounded-full`), cardurile `rounded-2xl`, modalele `rounded-2xl`. Fără stil pătrățos.

## REGULĂ STRICTĂ - FĂRĂ NOTIFICĂRI NATIVE DE BROWSER
- **ESTE STRICT INTERZISĂ** folosirea `alert()`, `confirm()`, `prompt()`. Se folosesc doar componente UI (Toast, Modal custom).

## REGULĂ STRICTĂ - FĂRĂ GIT PUSH
- Nu se execută niciodată comanda `git push` fără permisiunea expresă a utilizatorului.

## REGULĂ STRICTĂ - INTERZISĂ INTRODUCEREA DE DATE MOCK / CLIENȚI / PERSOANE / EMAIL-URI FALSE ÎN BAZĂ
- **ESTE STRICT INTERZIS** ca agentul să creeze sau să insereze în baza de date tenanți falși, nume de persoane inventate (ex: "Mihai Ionescu"), adrese de email inventate (ex: "test.anaf@firma-test.ro", "client@..."), numere de telefon fictive (ex: "0722111222") sau date de firmă fabricate.
- Folosirea de date fictive duce utilizatorul în eroare și poluează baza de date reală.
- Când este necesară testarea unui API sau flux (ex: ANAF, Stripe etc.), se folosește exclusiv mocking izolat în memorie (unit tests), FĂRĂ a introduce înregistrări cu date inventate de contact în baza de date a proiectului.

## REGULĂ STRICTĂ - LIMITARE LA FOLDERUL CURENT (WORKSPACE)
- Agentul are permisiunea de a citi, scrie sau rula comenzi **EXCLUSIV** în folderul rădăcină (și sub-folderele acestuia) în care aplicația/fereastra este deschisă.

