# Dziennik Treningowy (Training-tracker)

Instrukcje dla agentów (Claude Code, Codex i inne) oraz osób pracujących nad repozytorium. `CLAUDE.md` importuje ten plik, więc wszyscy agenci mają te same zasady ([ADR-0001](docs/adr/0001-documentation-and-agents.md)).

## Standard jakości kodu

### 1. Zakres i podejście do problemu

- Naprawiaj problem u źródła (root cause), nie w miejscu, gdzie objaw się ujawnił. Bez doraźnych łatek.
- Zmieniaj wyłącznie kod objęty zadaniem. Usterki zauważone „przy okazji” dopisz do [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) (pkt 11).
- Gdy wymaganie jest niejednoznaczne albo zmiana ma szeroki wpływ (model danych, kolekcje Firestore, reguły bezpieczeństwa), zapytaj przed zmianą zamiast zakładać.
- Zmiana kształtu dokumentów Firestore lub kluczy LocalStorage to zmiana kontraktu z zapisanymi już danymi: zaznacz ją jawnie i zapewnij odczyt starych danych albo migrację.

### 2. Zasady projektowania

- SOLID, DRY, KISS i YAGNI to wskazówki priorytetyzujące, podporządkowane pkt 1 i 3. Istniejącego kodu nie refaktoryzuj „pod zasady” przy niepowiązanej poprawce.
- YAGNI: bez abstrakcji, konfigurowalności i warstw „na zapas”, dopóki nie istnieje drugi realny przypadek użycia.
- DRY z umiarem: wydzielaj wspólną logikę (walidacja, przeliczenia, dostęp do danych) do `src/utils/`, `src/services/` lub hooka; powtarzające się elementy UI (formularze, karty, modale) — do komponentów w `src/components/common/`. Unifikacja nie zmienia wyglądu ani zachowania widocznego dla użytkownika.
- KISS: przy dwóch rozwiązaniach o zbliżonej jakości wybierz prostsze.

### 3. Jakość kodu

- TypeScript w trybie `strict`; bez `any` — używaj typów domenowych z `src/types/`, generyków lub `unknown` z zawężeniem.
- Stan React jest niemutowalny: kopiuj zagnieżdżone tablice i obiekty przed zmianą (`map`, spread, `structuredClone`), nie wywołuj `push`/`splice`/`sort` na stanie ani propsach.
- Hooki spełniają reguły `react-hooks` (pełne tablice zależności, bez wyciszania ostrzeżeń komentarzem).
- Dostęp do Firestore tylko przez `src/services/firebase/`; komponenty i hooki nie importują `firebase/firestore` bezpośrednio. Dostęp do LocalStorage tylko przez `LocalStorageService`, klucze z `STORAGE_KEYS`.
- Nie dodawaj docbloków powtarzających typ z sygnatury. Komentarz zostaw, gdy opisuje zachowanie lub kontrakt, którego sygnatura nie wyraża.
- Nowa zależność wymaga krótkiego uzasadnienia w commit message: potrzeba, aktywne utrzymanie, licencja. Preferuj natywne API przeglądarki i Reacta.
- Unikaj oczywistych problemów wydajnościowych (pobieranie całych kolekcji w pętli, zbędne rendery całego drzewa); poza tym nie optymalizuj przedwcześnie.
- Po zmianie usuń martwy kod, nieużywane importy, zakomentowane fragmenty i `console.log` dodane do debugowania.

### 4. Bezpieczeństwo

- Aplikacja nie ma własnego backendu: granicą bezpieczeństwa są reguły `firestore.rules`, nie kod frontendu. Każde ograniczenie w UI (walidacja, ukrycie akcji) wymaga odpowiednika w regułach.
- Reguły Firestore dają dostęp wyłącznie właścicielowi danych ([ADR-0003](docs/adr/0003-owner-authentication.md)) i walidują kształt oraz typy pól zapisu. Reguła czasowa ani `allow read, write: if true` nie są dopuszczalne. Nowa kolekcja wymaga reguły z walidacją i testów reguł.
- Konfiguracja Firebase tylko przez zmienne `VITE_*` z `.env` (nie commitowany); wartości `VITE_*` trafiają do bundla, więc nigdy nie umieszczaj w nich prawdziwych sekretów (klucze serwisowe, tokeny).
- Nie renderuj danych użytkownika jako HTML (`dangerouslySetInnerHTML`); polegaj na escapingu Reacta.
- Złagodzenie polityki (reguły, audyt zależności `npm audit`, nagłówki hostingu) wymaga decyzji właściciela repozytorium.

### 5. Obsługa błędów i spójność danych

- Fail-fast: bez pustych `catch` i bez zamiany błędu na cichy `null`/wartość domyślną. Serwis przepuszcza wyjątek wyżej; hook zamienia go na stan błędu, który UI pokazuje użytkownikowi.
- Operacja zapisu nie usuwa danych lokalnych (np. szkicu treningu), zanim zapis w Firestore się nie powiedzie.
- Dane z Firestore trafiają do stanu przez nasłuchy (`subscribe` w serwisie); po zapisie nie aktualizuj stanu ręcznie. Dokument tworzony z UI dostaje identyfikator przed zapisem, aby ponowny zapis (np. po odświeżeniu z zapisem czekającym offline) nadpisał ten sam dokument.
- Zapis kilku powiązanych dokumentów wykonuj atomowo (`writeBatch` lub `runTransaction`).
- Dane czytane z Firestore i LocalStorage są niezaufane: waliduj je przy odczycie w serwisie, zanim trafią do stanu.
- Nie zmieniaj danych w produkcyjnym projekcie Firebase ręcznie (konsola, skrypty) bez zgody właściciela na konkretną zmianę.

### 6. Logowanie

- Loguj błędy i nietypowe warunki w warstwie serwisów (`console.error`/`console.warn` z nazwą operacji); bez `console.log` informacyjnych w kodzie produkcyjnym.
- Nie loguj danych osobowych ani zdrowotnych (waga, obwody, zdjęcia), konfiguracji Firebase ani tokenów — tylko identyfikatory dokumentów, nazwę operacji i kod błędu.

### 7. Kontrakt danych

- Kształt dokumentów Firestore i wpisów LocalStorage definiują schematy Zod w `src/types/`, a typy TypeScript powstają z nich (`z.infer`); to jedyne źródło prawdy o modelu danych.
- Mapowanie dokument ↔ typ odbywa się w serwisie, w jednym miejscu dla danej kolekcji.
- Komunikaty błędów dla użytkownika są po polsku, ogólne i nie zawierają treści wyjątków.

### 8. Testy

- Poprawkę i nową funkcję pokryj testami adekwatnymi do zmiany: logika w `src/utils/`, hookach i komponentach — testy Vitest obok kodu (`*.test.ts(x)`); reguły Firestore — `tests/rules/` na emulatorze. Zmiana reguły ma przypadek pozytywny i negatywny.
- Zmiana zachowania widocznego dla użytkownika dodaje w tym samym zadaniu przypadki do [MANUAL_TESTING_CHECKLIST.md](docs/MANUAL_TESTING_CHECKLIST.md) (warunki wstępne, kroki, oczekiwany wynik).
- Test nie utrwala błędu: gdy wykrywa realny problem, napraw kod, nie test.
- Zweryfikuj, że problem zniknął (odtwórz go przed zmianą, potwierdź brak po zmianie), zamiast zakładać, że poprawka działa.
- Zmiana modelu danych wymaga sprawdzenia odczytu dokumentów zapisanych w starym kształcie.

### 9. Dokumentacja

- Każdy dokument ma jeden cel, jeden fakt jest w jednym miejscu ([ADR-0001](docs/adr/0001-documentation-and-agents.md)). Zapisuj bieżący stan; przebieg prac należy do commit message.
- Komentarze odpowiadają na pytanie „co ten kod robi i dlaczego tak działa teraz”. Bez numerów zgłoszeń, opisów „przed/po” i odwołań do usuniętego kodu — to należy do commit message.
- Po zmianie zachowania przeszukaj `README.md` i `docs/` pod kątem opisu starego stanu i popraw go w tej samej zmianie. Zdanie „CI sprawdza X” zapisuj tylko, gdy taka kontrola istnieje.

### 10. Commit i praca z gałęziami

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`) z krótkim opisem i — gdy zasadne — uzasadnieniem naprawy u źródła.
- Przed commitem uruchom kontrole z części [Weryfikacja](#weryfikacja); błędy naprawiaj, nie omijaj.
- Pracuj na własnej gałęzi; zweryfikowane zmiany wypychaj, nie trzymaj ich tylko lokalnie.
- Zachowuj cudze, niezatwierdzone zmiany: dodawaj do commitu jawną listę plików i sprawdź staged diff.
- Pliki robocze twórz poza repozytorium; nie commituj `dist/`, `.env` ani `tsconfig.tsbuildinfo`.
- Nie dodawaj do commitów stopki `Co-Authored-By` ani innych stopek współautorstwa — autorem commitu jest właściciel repozytorium.

### 11. Problemy poza zakresem — `docs/KNOWN_ISSUES.md`

- Błąd, dług techniczny lub możliwość poprawy niezwiązaną z zadaniem dopisz do [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) zamiast naprawiać samodzielnie.
- Przed dopisaniem potwierdź problem w kodzie (plik, funkcja) i sprawdź, czy nie ma już punktu — wtedy go uzupełnij.
- Punkt prowadź według zasad w pliku: problem, miejsce w kodzie, „Gotowe, gdy”. W podsumowaniu pracy wymień numery dopisanych punktów.
- Punkt zamykasz, gdy każdy element „Gotowe, gdy” jest potwierdzony w kodzie i testach; dowody wpisz do commit message.

### 12. Decyzje architektoniczne

- Kierunek wyznacza rejestr [DECISIONS.md](docs/DECISIONS.md). Zmiana kierunku (np. własny backend, inna baza, zmiana hostingu) wymaga nowego ADR przyjętego przez właściciela przed rozpoczęciem pracy.

## Zakres repozytorium

- Jednostronicowa aplikacja (SPA) do rejestrowania treningów, planu tygodnia, szablonów i pomiarów ciała. Stack i architektura: [ADR-0002](docs/adr/0002-spa-firebase.md); uruchomienie: [README.md](README.md).
- Struktura `src/`: `types/` (model danych jako schematy Zod; typy przez `z.infer`), `services/` (Firebase Auth, Firestore i LocalStorage), `hooks/` (stan i operacje), `components/` (`common/`, `tabs/<Zakładka>/`, `workout/`), `utils/` (czyste funkcje, w tym walidacja odczytu schematami w `parse.utils.ts` i formularzy w `measurement.utils.ts` / `validation.utils.ts`), `constants/` (m.in. komunikaty błędów w `messages.ts`, adresy zakładek w `routes.ts`). Nawigacja: React Router (`TrainingTracker.tsx`); `vercel.json` kieruje każdy adres do `index.html`.
- Konfiguracja Firebase: `firebase.json` (także emulatory), `firestore.rules`, `firestore.indexes.json`, projekt w `.firebaserc`; zmienne środowiskowe w `.env.example`.

## Weryfikacja

Hook `pre-push` (`.githooks/`, aktywacja raz na klon: `git config core.hooksPath .githooks` — [opis](.githooks/README.md)) uruchamia poniższe kontrole przy każdym pushu; testy reguł i testy end-to-end — gdy zmiana ich dotyczy. Nie omijaj go `--no-verify`. Przed commitem zmian w kodzie uruchom:

```bash
npm run lint        # ESLint (typescript-eslint, react-hooks, no-console)
npm run build       # tsc -b (typecheck) + vite build
npm test            # testy jednostkowe Vitest
npm run test:rules  # testy firestore.rules na emulatorze (wymaga Javy)
npm run test:e2e    # Playwright: zbudowana aplikacja na emulatorach (Java, Chromium)
```

Te same kroki zawiera CI (`.github/workflows/ci.yml`), uruchamiane tylko ręcznie (Actions → CI → Run workflow) z powodu limitu minut GitHub Actions. Zmianę widoczną dla użytkownika sprawdź w `npm run dev` z emulatorami (`VITE_USE_EMULATORS=true`, `npm run emulators` — [README](README.md#-uruchomienie-lokalne)) według [MANUAL_TESTING_CHECKLIST.md](docs/MANUAL_TESTING_CHECKLIST.md). Zmiana widoczna dla użytkownika dostaje scenariusz w `e2e/`, gdy da się go zautomatyzować. Przy samej zmianie dokumentacji sprawdź odnośniki i zgodność opisanych poleceń z `package.json`.
