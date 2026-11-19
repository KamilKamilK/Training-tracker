# 💪 Dziennik Treningowy

Aplikacja webowa do śledzenia treningów, planu tygodnia i pomiarów ciała.
Na razie z aplikacji korzystają tylko konta z listy dostępu (`owners`). Docelowo ma służyć trenerom i ich podopiecznym ([plan rozwoju](docs/ROADMAP.md)).

---

## 🚀 Funkcjonalności

- 🏋️ **Rejestrowanie treningów** z szablonów — serie z ciężarem, powtórzeniami i RIR, notatki, czas trwania; porzucenie treningu z potwierdzeniem
- 💾 **Szkic treningu w przeglądarce** — wpisane serie i notatki przetrwają odświeżenie strony
- 📅 **Plan tygodnia** i **historia treningów** — korekta serii i notatek, usuwanie z potwierdzeniem
- 📋 **Szablony** domyślne i własne (własne zapisane w koncie, widoczne na każdym urządzeniu)
- 🎬 **Filmy techniki ćwiczeń** — krótki film MP4 przy ćwiczeniu w treningu i historii; wgrywa tylko konto z rolą `admin`, oglądają wszystkie aktywne konta (wersja testowa, [ADR-0019](docs/adr/0019-exercise-technique-videos.md))
- ⚖️ **Pomiary ciała** — waga i obwód talii, zmiany w czasie, edycja i usuwanie z potwierdzeniem
- 🔐 **Logowanie Google albo e-mailem z hasłem** (potwierdzenie adresu, reset hasła); dane w Cloud Firestore dostępne tylko dla właściciela konta
- ✅ **Zgoda na dane o zdrowiu** wymagana do aktywacji konta, wycofanie w Ustawieniach
- 📱 **Responsywny, ciemny interfejs**
- 📴 **Otwieranie bez sieci po pierwszej wizycie online** — lokalne pliki aplikacji, dane wcześniej wczytane na urządzeniu i szkic treningu

Do pracy bez sieci używaj jednej karty dziennika. Dodatkowe karty działają z siecią, ale ich niewysłane zapisy offline mogą zginąć po zamknięciu lub odświeżeniu ([szczegóły pamięci offline](docs/ARCHITECTURE.md#offline-i-dane-na-żywo)).

Budowa aplikacji: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); decyzje: [docs/DECISIONS.md](docs/DECISIONS.md); plan rozwoju: [docs/ROADMAP.md](docs/ROADMAP.md).

---

## 🧰 Stack technologiczny

React 19, TypeScript (strict), Vite 8, React Router, Zod, Tailwind CSS 4, Lucide React, Firebase (Authentication, Cloud Firestore); testy: Vitest, Testing Library, emulator Firestore, Playwright.

---

## 🧑‍💻 Uruchomienie lokalne

Wymagania: Node.js 26 (zakres w polu `engines` w `package.json`), a do emulatorów, testów reguł i testów end-to-end — Java 21. Przeglądarkę dla testów end-to-end instaluje się raz: `npx playwright install chromium`.

```bash
git clone https://github.com/KamilKamilK/Training-tracker.git
cd Training-tracker
npm install
cp .env.example .env   # uzupełnij konfiguracją projektu Firebase
npm run dev            # http://localhost:5173
```

Praca bez dotykania danych produkcyjnych: ustaw `VITE_USE_EMULATORS=true` w `.env`, uruchom `npm run emulators` w osobnym terminalu, a potem `npm run dev`. Dokument właściciela (patrz niżej) utwórz w emulatorze Firestore. Filmy techniki działają w `npm run dev`, gdy `.env` zawiera `SUPABASE_URL` i `SUPABASE_SECRET_KEY` projektu testowego Supabase; uprawnienia funkcja sprawdza wtedy w emulatorach, a rolę `admin` nadaj w emulatorze Firestore (patrz niżej).

Dane pokazowe (ok. 12 tygodni treningów ABC z progresją ciężarów, cotygodniowe pomiary i trzy szablony własne) dodaje skrypt `scripts/seed-demo-data.ts`. Dokumenty mają identyfikatory `demo-…`, więc skrypt nie zmienia innych danych konta ani planu tygodnia i potrafi usunąć wyłącznie swoje wpisy. Bez flagi pokazuje tylko, co zapisze. Przy działającym `npm run emulators` dane trafiają do emulatora; bez zmiennej `FIRESTORE_EMULATOR_HOST` — do produkcji, z poświadczeniami `gcloud auth application-default login`:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed-demo-data.ts --project demo-training-tracker --uid <uid> --apply
node scripts/seed-demo-data.ts --project <projekt> --uid <uid> --remove   # usuwa dokumenty demo-…
```

Service worker zapisuje pliki aplikacji tylko w zbudowanej wersji (`npm run build` i `npm run preview` albo hosting HTTPS). `npm run dev` go nie uruchamia. Do sprawdzania offline lokalnie użyj buildu z emulatorami: `npx vite build --mode e2e`, potem `npm run preview` przy działającym `npm run emulators`. Po komunikacie „Pliki aplikacji są gotowe do pracy bez sieci” można zamknąć kartę i otworzyć ją ponownie offline. Zalogowane konto i wcześniej wczytane dane muszą być zachowane w tej przeglądarce. Przy nowej wersji komunikat „Dostępna nowa wersja aplikacji” pozwala wybrać „Odśwież” albo „Później”; dokończ edycję formularza przed odświeżeniem. Szkic bieżącego treningu pozostaje zapisany.

| Polecenie | Działanie |
|---|---|
| `npm run dev` | serwer deweloperski Vite |
| `npm run lint` | ESLint |
| `npm run build` | typecheck (`tsc -b`) i build produkcyjny do `dist/` |
| `npm test` | testy jednostkowe (Vitest) |
| `npm run test:rules` | testy `firestore.rules`, odczytu uprawnień funkcji `api/` i skryptów danych na emulatorze Firestore |
| `npm run test:e2e` | testy end-to-end (Playwright) zbudowanej aplikacji na emulatorach |
| `npm run emulators` | emulatory Authentication i Firestore do pracy lokalnej |

Po sklonowaniu włącz hook `pre-push`, który uruchamia te kontrole przy każdym pushu (testy reguł i end-to-end — gdy zmiana ich dotyczy): `git config core.hooksPath .githooks` ([opis](.githooks/README.md)). CI (`.github/workflows/ci.yml`) wykonuje te same kroki, ale uruchamiane jest ręcznie w zakładce Actions (limit minut GitHub Actions).

---

## 🔐 Konfiguracja Firebase (jednorazowo, konsola Firebase)

1. **Authentication → Sign-in method:** włącz dostawców **Google** i **Email/Password** (bez „Email link”).
2. **Authentication → Settings → Authorized domains:** dodaj domenę hostingu (np. `training-tracker-six.vercel.app`).
3. **Authentication → Settings:**
   - **Password policy:** wymagaj co najmniej 8 znaków, wielkiej i małej litery oraz cyfry (ta sama zasada co w formularzu rejestracji);
   - **User actions:** włącz **Email enumeration protection**, aby logowanie i reset hasła nie zdradzały, czy konto istnieje.
4. **Authentication → Templates:** ustaw język polski i nazwę aplikacji w e-mailach weryfikacji adresu i resetu hasła.
5. Zaloguj się w aplikacji — zobaczysz ekran „nie ma dostępu”. W **Authentication → Users** skopiuj swój UID.
6. **Firestore → Data:** utwórz kolekcję `owners` z dokumentem o ID równym UID (bez pól).
7. Wdróż reguły: `npx firebase deploy --only firestore:rules` (wymaga `npx firebase login`). Reguły wpuszczają tylko konta z potwierdzonym adresem e-mail i zaakceptowaną zgodą na dane o zdrowiu.
8. Po zalogowaniu aplikacja prosi o imię i zgodę na dane o zdrowiu — po jej zaakceptowaniu konto jest aktywne ([ADR-0015](docs/adr/0015-accounts-roles-consent.md)). Zgodę można wycofać w **Ustawieniach** (`/settings`), co dezaktywuje konto.

Zasady dostępu: [ADR-0003](docs/adr/0003-owner-authentication.md); konta i logowanie: [ADR-0008](docs/adr/0008-accounts-and-invitations.md); zgoda i aktywacja konta: [ADR-0015](docs/adr/0015-accounts-roles-consent.md).

---

## 🎬 Filmy techniki (jednorazowo, Supabase i Vercel)

Pliki leżą w prywatnym zasobniku Supabase Storage na planie Free, a dostęp wydaje funkcja Vercel `api/exercise-videos.ts` ([ADR-0019](docs/adr/0019-exercise-technique-videos.md)).

1. **Supabase:** załóż projekt na planie Free w regionie UE (produkcyjny projekt jest w West EU — Irlandia). Przycisku **Connect** i jego instrukcji (`VITE_SUPABASE_*`, klient w przeglądarce) nie używaj — aplikacja łączy się z Supabase tylko przez funkcję Vercel. W **Storage** utwórz zasobnik `exercise-videos`: **Public bucket** wyłączone, **Restrict file size** 10 MB, **Allowed MIME types** `video/mp4`. Polityk RLS nie dodawaj — zasobnik obsługuje tylko funkcja kluczem secret.
2. **Supabase → Project Settings → API Keys:** skopiuj adres projektu i utwórz klucz **secret**.
3. **Firebase → Project settings → Service accounts:** wygeneruj klucz konta serwisowego (JSON). Przechowuj go tylko w Vercel.
4. **Vercel → Settings → Environment Variables** (środowisko Production, opcja **Sensitive**): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT` (cały JSON w jednej linii). Opis zmiennych: `.env.example`.
5. Wdróż reguły (`npx firebase deploy --only firestore:rules`) **przed** wdrożeniem aplikacji, bo bez reguły dla `exerciseVideos` lista filmów zwraca błąd.
6. **Firestore → Data → `users/{twój UID}`:** dodaj pole `roles` typu array z wartością `admin`. Tylko to konto widzi „Dodaj film”; zmiana działa po odświeżeniu aplikacji.

Projekt Supabase Free zatrzymuje się po tygodniu bez aktywności — wtedy wznów go w panelu Supabase.

---

## 🌐 Dostęp online

Aplikacja jest hostowana na Vercel: https://training-tracker-six.vercel.app/ — zmienne `VITE_*` z `.env.example` ustaw w ustawieniach projektu Vercel, a zmienne funkcji filmów — według sekcji wyżej. `vercel.json` kieruje każdy adres poza `/api/` (np. `/history`) do aplikacji, więc odświeżenie zakładki działa.
