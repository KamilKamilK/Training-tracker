# Dziennik Treningowy — architektura

Jak aplikacja jest zbudowana teraz: części, przepływ danych, model danych i granica bezpieczeństwa. Dlaczego tak — decyzje w [DECISIONS.md](DECISIONS.md); dokąd zmierza — [ROADMAP.md](ROADMAP.md); uruchomienie i polecenia — [README.md](../README.md).

## Przegląd

Jednostronicowa aplikacja (SPA) bez własnego backendu ([ADR-0002](adr/0002-spa-firebase.md)). Przeglądarka rozmawia bezpośrednio z Firebase, a granicą bezpieczeństwa są reguły `firestore.rules`.

```mermaid
flowchart LR
  subgraph Przeglądarka
    UI[React 19 + React Router] --> H[hooki obszarów]
    H --> S["serwisy *.service.ts"]
    S --> SDK[Firestore SDK<br/>cache IndexedDB]
    H --> LS[(LocalStorage<br/>szkic treningu)]
  end
  S --> AUTH[Firebase Authentication]
  SDK <-->|reguły firestore.rules| FS[(Cloud Firestore<br/>europe-central2)]
  V[Vercel Hobby] -. pliki aplikacji .-> UI
```

| Element | Technologia | Gdzie w repozytorium |
|---|---|---|
| Interfejs | React 19, TypeScript `strict`, Tailwind CSS 4, Lucide; przeglądarki: Chrome 111, Safari 16.4 (iOS 16.4), Firefox 128 lub nowsze (wymaganie Tailwind CSS 4) | `src/` |
| Nawigacja | React Router, adres dla każdej zakładki ([ADR-0010](adr/0010-web-app-architecture.md)) | `src/constants/routes.ts`, `src/app/TrainingTracker.tsx` |
| Model danych | schematy Zod, typy przez `z.infer` | `src/types/` |
| Logowanie | Firebase Authentication: Google albo e-mail z hasłem ([ADR-0008](adr/0008-accounts-and-invitations.md)) | `src/features/auth/` |
| Dane | Cloud Firestore na planie Spark ([ADR-0009](adr/0009-cloud-functions-aggregates.md)) | serwisy w `src/features/*/` |
| Bezpieczeństwo | reguły z walidacją zapisów | `firestore.rules`, testy w `tests/rules/` |
| Hosting | Vercel, wdrożenie z gałęzi `main` ([ADR-0011](adr/0011-environments-hosting-monitoring.md)) | `vercel.json` |
| Pliki aplikacji offline | `vite-plugin-pwa`, Workbox: precache plików buildu, bez manifestu instalacji ([ADR-0013](adr/0013-offline-app-shell.md)) | `vite.config.ts`, `src/components/common/ServiceWorkerPrompt.tsx` |

## Start aplikacji i dostęp

Dziennik otwiera się dopiero po przejściu trzech bramek. Każdą sprawdzają też reguły, więc UI tylko odzwierciedla to, na co pozwoli baza.

```mermaid
flowchart TD
  A[main.tsx: BrowserRouter → App] --> B{useAuth}
  B -- brak sesji --> L[AuthScreen: logowanie / rejestracja / reset hasła]
  B -- adres niepotwierdzony --> U[AuthScreen: potwierdź e-mail]
  B -- brak dokumentu owners/uid --> D[AuthScreen: brak dostępu]
  B -- owner --> C{useProfile}
  C -- brak profilu, brak zgody<br/>albo zgoda niepotwierdzona przez serwer --> CS[ConsentScreen: imię + zgoda na dane o zdrowiu]
  C -- konto aktywne --> T[TrainingTracker: zakładki dziennika]
```

- **Lista `owners`** to tymczasowa lista dostępu do czasu polityki prywatności ([ADR-0016](adr/0016-roles-views-exercise-library.md), pkt 8). Dokument zakłada się ręcznie w konsoli.
- **Zgoda** jest warunkiem aktywacji konta ([ADR-0015](adr/0015-accounts-roles-consent.md)). `App.tsx` czeka na profil potwierdzony przez serwer, bo reguły czytają zapisany profil i odrzuciłyby zapytania wysłane wcześniej.
- **Role** (`roles` w `users/{uid}`) zapisuje tylko administrator w konsoli. Aplikacja jeszcze ich nie używa: wszystkie konta widzą te same zakładki.

## Struktura kodu

Kod jest podzielony według funkcji ([ADR-0010](adr/0010-web-app-architecture.md), pkt 5). Komponenty, hook, serwis i testy jednego obszaru leżą razem.

| Katalog | Odpowiedzialność |
|---|---|
| `src/app/TrainingTracker.tsx` | układ dziennika, trasy, hooki danych wspólne dla zakładek, komunikaty błędów |
| `src/features/auth/` | logowanie, rejestracja, potwierdzenie adresu, reset hasła, sprawdzenie `owners` |
| `src/features/profile/` | profil, zgoda na dane o zdrowiu, ekran zgody, Ustawienia (`/settings`) |
| `src/features/dashboard/` | Start (`/`): szybkie statystyki, ostatnie pomiary, szablony do rozpoczęcia treningu |
| `src/features/workouts/` | trening (`/workout`): szkic w LocalStorage, serie, zapis do `sessions` |
| `src/features/history/` | historia (`/history`): lista i szczegóły treningów, edycja serii i notatek, usuwanie z potwierdzeniem |
| `src/features/templates/` | szablony (`/templates`): domyślne w kodzie, własne w Firestore, import z przeglądarki |
| `src/features/plan/` | plan tygodnia (`/plan`): szablon przypisany do dnia |
| `src/features/measurements/` | pomiary: dodawanie i edycja, widżet z dostępem do wszystkich wpisów, usuwanie z potwierdzeniem, różnice wagi i talii |
| `src/features/progress/` | postępy (`/progress`): liczba treningów, zmiany pomiarów |
| `src/components/common/` | wspólne elementy UI: modal, toasty, formularz, nawigacja, nagłówek |
| `src/hooks/` | hooki wspólne dla obszarów (`useModal`) |
| `src/types/` | schematy Zod — jedyne źródło prawdy o kształcie danych ([AGENTS.md](../AGENTS.md#7-kontrakt-danych)) |
| `src/utils/` | walidacja odczytu (`parse.utils.ts`), daty, formularze |
| `src/constants/` | komunikaty błędów, adresy tras, reguły walidacji, treść zgody |
| `src/services/storage/` | jedyny dostęp do LocalStorage (`LocalStorageService`, klucze `STORAGE_KEYS`) |
| `src/lib/firebaseConfig.ts` | inicjalizacja Firebase, cache offline, połączenie z emulatorami |

Szablony, Plan, Historia i Postępy są ładowane leniwie. Po zalogowaniu aplikacja pobiera je w tle, żeby otworzyły się także po utracie sieci.

## Przepływ danych

```
komponent  →  hook obszaru  →  serwis *.service.ts  →  Firestore SDK (cache)  →  reguły  →  baza
  (UI)        (stan, błąd       (jedyny import          (zapis od razu
               po polsku)        firebase/*, Zod)         w cache, potem na serwer)
```

1. **Odczyt przez nasłuch.** Serwis wystawia `subscribe(uid, onChange, onError)` na `onSnapshot`. Każdy dokument przechodzi przez parser Zod, a niepoprawny jest pomijany i logowany po identyfikatorze.
2. **Zapis z identyfikatorem z klienta.** `setDoc` pod identyfikatorem nadanym w przeglądarce. Ponowny zapis, np. po odświeżeniu strony z zapisem czekającym offline, nadpisuje ten sam dokument zamiast tworzyć duplikat.
3. **Stan po zapisie aktualizuje nasłuch**, nie kod. Hook zwraca `true`, gdy Firestore potwierdził zapis.
4. **Błędy.** Serwis loguje (`console.error` z nazwą operacji) i przepuszcza wyjątek. Hook zamienia go na komunikat z `src/constants/messages.ts`, a UI pokazuje go w toaście albo w formularzu.
5. **Granice importów.** Komponenty i hooki nie importują `firebase/firestore` ani `firebase/auth`; pilnuje tego ESLint (`no-restricted-imports`).

Edycja pomiaru i treningu zapisuje dokument pod jego dotychczasowym identyfikatorem, bez pola `id` w danych. Formularze zachowują pola opcjonalne ze starszych zapisów. Edycja treningu z Historii nie korzysta ze szkicu bieżącego treningu w LocalStorage.

## Model danych

Dane konta leżą w `users/{uid}/…` ([ADR-0005](adr/0005-data-model-and-access.md)). Właściciel wynika ze ścieżki, więc reguły i testy A/B są proste.

| Ścieżka | Schemat (`src/types/`) | Reguła | Zawartość |
|---|---|---|---|
| `users/{uid}` | `UserProfileDocumentSchema` | `isValidProfile` | imię, zgoda `consents.health` (stan, wersja, czas serwera), `roles` |
| `users/{uid}/sessions/{id}` | `WorkoutDocumentSchema` | `isValidWorkout` | trening: typ (nazwa szablonu przy rozpoczęciu), `templateId` (brak w treningach zapisanych wcześniej), data, ćwiczenia z nazwą i seriami (`weight`, `reps`, `rir` jako napisy), notatki |
| `users/{uid}/measurements/{id}` | `MeasurementDocumentSchema` | `isValidMeasurement` | data, waga, obwód talii |
| `users/{uid}/weekPlans/default_week_plan` | `WeekPlanDocumentSchema` | `isValidWeekPlan` | dzień tygodnia → id szablonu albo `null` (odpoczynek) |
| `users/{uid}/templates/{id}` | `WorkoutTemplateSchema` | `isValidTemplate` | szablony własne: nazwa, lista ćwiczeń (tekst), kategoria, wygląd |
| `owners/{uid}` | — | tylko `get` własnego | lista dostępu, zakładana w konsoli |

Poza Firestore:

- **Szablony domyślne** są w kodzie (`src/features/templates/defaultTemplates.ts`), nie w bazie.
- **LocalStorage**: `currentWorkoutDraft` — szkic trwającego treningu, usuwany po potwierdzonym zapisie albo przy wylogowaniu; `customTemplates` — szablony z dawnych wersji, przenoszone jednorazowo do Firestore i potem usuwane (`useTemplates`). `workouts` i `measurements` — dane z pierwszych wersji, już nieczytane. Szkic nie jest związany z kontem, dlatego wylogowanie usuwa wszystkie wpisy aplikacji (`STORAGE_KEYS`).

Ograniczenia obecnego modelu, które zmienia etap 1 ([ADR-0007](adr/0007-exercises-and-sets.md)):

- Ćwiczenie to tekst z nazwą i zaleceniem w jednym napisie, a serie to napisy. Nie da się liczyć postępu dla ćwiczenia.
- Reguły nie potrafią iterować po listach, więc elementy list `exercises` w treningach i szablonach sprawdza tylko schemat Zod przy odczycie. Reguły ograniczają liczbę elementów.

Docelowy model (biblioteka `exercises`, `programs`, `coaching`, `invites`) jest opisany w [ROADMAP.md](ROADMAP.md#model-danych-szkic-szczegóły-w-adr-0005).

## Bezpieczeństwo

Reguły w `firestore.rules` składają się z trzech warunków dostępu i walidatora dla każdej kolekcji:

| Funkcja | Warunek |
|---|---|
| `isVerified()` | zalogowany, adres e-mail potwierdzony |
| `isOwner()` | `isVerified()` + dokument `owners/{uid}` + `consents.health.accepted == true` w profilu |
| `isActiveSelf()` | `isOwner()` i ścieżka `users/{uid}` należy do zalogowanego |

- Własny profil zapisze każde konto z potwierdzonym adresem. Nie może go jednak utworzyć z polem `roles` ani zmienić tego pola przy aktualizacji, a czas zgody musi być czasem serwera (`request.time`).
- Każdy zapis ma walidator kształtu i zakresów. Zakresy pomiarów odpowiadają `VALIDATION_RULES` w `src/constants/validation.ts`.
- Konfiguracja `VITE_*` trafia do bundla i nie jest tajna. Klucze serwisowe nigdy nie trafiają do repozytorium ([AGENTS.md](../AGENTS.md#4-bezpieczeństwo)).
- **Reguł nie wdraża Vercel.** Po zmianie `firestore.rules` trzeba je opublikować osobno: w konsoli Firebase albo przez `npx firebase deploy --only firestore:rules`.

## Offline i dane na żywo

- `persistentLocalCache` z `persistentSingleTabManager`: jedna karta przechowuje dane i kolejkę zapisów offline w IndexedDB. Zapisane wcześniej dane IndexedDB są odczytywane bez migracji. Przy zajętej pamięci kolejne karty używają pamięci ulotnej i łączą się z serwerem niezależnie; ich niewysłane zapisy mogą zginąć po zamknięciu lub odświeżeniu karty. Do pracy offline używamy jednej karty ([ADR-0018](adr/0018-single-tab-persistence.md)).
- Przy dostępie do sieci zmiana w jednej karcie pojawia się w innej bez odświeżania, bo działają nasłuchy i synchronizacja przez serwer.
- Wylogowanie czyści cache Firestore i wpisy LocalStorage aplikacji, a potem przeładowuje stronę, żeby dane nie zostały na wspólnym komputerze ani nie trafiły do następnego konta. Przy trwającym treningu aplikacja najpierw pyta o potwierdzenie. Zapisy czekające offline giną razem z cache ([KNOWN_ISSUES #30](KNOWN_ISSUES.md)).
- Service worker zapisuje HTML, JS (także leniwe zakładki), CSS i SVG z buildu w Cache Storage. Po pierwszej wizycie online aplikacja otwiera się i odświeża bez sieci, także pod adresem zakładki. Firebase nadal odpowiada za sesję i cache danych; service worker nie przechowuje odpowiedzi Auth ani Firestore. Dostępne offline są dane wcześniej wczytane na tym urządzeniu. Wyczyszczenie danych przeglądarki usuwa także możliwość otwierania offline.
- `ServiceWorkerPrompt` w `main.tsx` rejestruje service workera i pokazuje gotowość plików do pracy offline lub oczekującą aktualizację. Nowa wersja czeka na „Odśwież”; „Później” pozwala kontynuować pracę. Odświeżenie zachowuje szkic treningu w LocalStorage; niezapisane formularze trzeba wcześniej dokończyć ([ADR-0013](adr/0013-offline-app-shell.md)).

## Środowiska, build i wdrożenie

| Środowisko | Projekt Firebase | Jak uruchomić |
|---|---|---|
| Lokalnie | emulatory `demo-training-tracker` (Auth, Firestore) | `npm run emulators` + `npm run dev` z `VITE_USE_EMULATORS=true` |
| Testy | te same emulatory | `npm run test:rules`, `npm run test:e2e` |
| Produkcja | `training-tracker-6d13b` | Vercel buduje `main`; podglądy PR nie logują się do produkcji |

- Wersję Node.js wyznacza pole `engines.node` w `package.json` (`^24.12.0`, minimum pakietów Firebase); z niego korzysta Vercel przy buildzie i `actions/setup-node` w CI.
- Vite dzieli kod zewnętrzny na części `react`, `zod`, `react-router`, `firebase-app` (wspólna podstawa Firebase), `firebase-auth`, `re2js` (silnik wyrażeń regularnych używany przez Firestore), `firebase-firestore` i `vendor` (pozostałe biblioteki). Wspólne zależności są wydzielane przed bibliotekami, które z nich korzystają, aby uniknąć cykli importów. Test `e2e/bundle.spec.ts` pilnuje limitu 500 kB na plik JavaScript po minifikacji w zbudowanej aplikacji testowej; limit ostrzeżenia Vite pozostaje domyślny.
- `vercel.json` kieruje każdy adres do `index.html`, więc odświeżenie zakładki działa.
- Build generuje `sw.js` i plik Workbox. `sw.js` ma nagłówek `Cache-Control: no-store` na Vercel. Service worker działa na HTTPS i localhost, w buildach produkcyjnych oraz E2E; w `npm run dev` jest wyłączony.
- `npm run build` sprawdza typy TypeScriptem 7: polecenie `tsc` pochodzi z aliasu `@typescript/native` (`npm:typescript@7`). Pakiet `typescript` jest aliasem `@typescript/typescript6`, bo `typescript-eslint` korzysta z API TypeScriptu 6, którego wersja 7 nie udostępnia. To [sposób zalecany przez Microsoft](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/); alias usuniemy, gdy `typescript-eslint` zacznie obsługiwać TypeScript 7.

### Wymuszone wersje zależności pośrednich

`overrides` w `package.json` zastępuje podatne wersje, których wymagają pakiety nadrzędne:

- `@firebase/firestore` używa `@grpc/grpc-js` od 1.14.7 zamiast `~1.9.0`. gRPC działa tylko w Node.js (testy reguł); zbudowana aplikacja go nie zawiera.
- `@modelcontextprotocol/sdk` używa `body-parser` od 2.4, `@google-cloud/pubsub` — `@opentelemetry/core` od 2.8, a `gaxios` — `uuid` od 11.1.1. Te same poprawki deklaruje `firebase-tools` we własnym `package.json`, ale [npm stosuje tylko overrides z głównego projektu](https://docs.npmjs.com/cli/configuring-npm/package-json/#overrides).
- `glob` jest w wersji od 14.0.4, a `minimatch` z zakresu 7–11.0.0 — od 11.0.5 (ESLint, `typescript-eslint`, `workbox-build`, `firebase-tools`). Linie `minimatch` 3, 5 i 6 zostają bez zmian.

Wpis usuwamy, gdy pakiet nadrzędny sam wymaga poprawionej wersji. Zmiana `overrides` wymaga czystej instalacji (`npm ci`), `npm audit` i wszystkich kontroli z [AGENTS.md](../AGENTS.md#weryfikacja), w tym porównania listy plików sprawdzanych przez ESLint i listy precache w `dist/sw.js` przed zmianą i po niej.

## Testy i kontrola jakości

| Rodzaj | Narzędzie | Gdzie | Co sprawdza |
|---|---|---|---|
| Jednostkowe i komponentów | Vitest, Testing Library, jsdom | `src/**/*.test.ts(x)` | logika, hooki, formularze |
| Reguły | Vitest + emulator Firestore | `tests/rules/` | dostęp własne/cudze, walidacja zapisów, odmowa dostępu do kolekcji sprzed migracji |
| End-to-end | Playwright na zbudowanej aplikacji i emulatorach | `e2e/` | logowanie, zgoda, trening po odświeżeniu i offline, otwarcie karty offline z danymi i szkicem, aktualizacja za potwierdzeniem, trasy |
| Ręczne | lista kontrolna | [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md) | scenariusze, których nie da się zautomatyzować |

Hook `pre-push` w `.githooks/` uruchamia lint, build i testy jednostkowe. Testy reguł i E2E uruchamia, gdy zmiana ich dotyczy. Trzeba go włączyć raz na klon. CI w GitHub Actions robi to samo, ale uruchamiane jest tylko ręcznie. Polecenia: [AGENTS.md](../AGENTS.md#weryfikacja).
