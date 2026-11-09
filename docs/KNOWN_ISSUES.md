# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Niski priorytet

- **#30 — Wylogowanie bez sieci usuwa zapisy czekające na wysłanie**
- **#32 — Wymuszony `superstatic` 11 dla `firebase-tools` do usunięcia**
- **#33 — Brak decyzji o skryptach instalacyjnych zależności (`allowScripts`)**
- **#35 — Przyciski edycji, kopiowania i usuwania szablonu bez nazwy dla czytników ekranu**
- **#37 — `npm audit`: `deepmerge` z `vite-plugin-pwa` bez poprawionej wersji**

### Zasady prowadzenia

- Każdy punkt jest w tabeli i dokładnie raz w zestawieniu powyżej, z tym samym numerem, tytułem i priorytetem.
- Punkt wskazuje miejsce w kodzie, opisuje bieżący stan, pozostały zakres („Zrobić”) i warunek „Gotowe, gdy”. Decyzje są w ADR — punkt linkuje, nie powtarza.
- Wykonany punkt usuwamy z tabeli i zestawienia; dowody spełnienia „Gotowe, gdy” są w commit message. Gdy spełniona jest część, przepisujemy punkt na pozostały zakres.
- **Numeracja:** numer nigdy nie jest używany ponownie. Nowy punkt dostaje numer o jeden większy od najwyższego w historii pliku (`git log -p -- docs/KNOWN_ISSUES.md`).
- **Wykonanie:** 🖐️ manualne (konsola Firebase, konto, decyzja właściciela), 💻 programistyczne, 🖐️💻 mieszane.

---

## Zadania

| # | Temat | Szczegóły | Priorytet | Wykonanie |
|---|-------|-----------|-----------|-----------|
| 30 | **Wylogowanie bez sieci usuwa zapisy czekające na wysłanie** | **Stan:** `AuthService.signOut` (`src/features/auth/auth.service.ts`) wywołuje `clearIndexedDbPersistence`, która usuwa z IndexedDB także kolejkę zapisów Firestore niewysłanych jeszcze na serwer (np. pomiar dodany offline). Trening, który czeka na zapis, chroni okno potwierdzenia w `TrainingTracker`; pozostałe zapisy giną bez ostrzeżenia. **Zrobić:** przed wylogowaniem sprawdzić, czy są zapisy czekające na serwer (`waitForPendingWrites` z limitem czasu w serwisie), i przy ich obecności pokazać ostrzeżenie z wyborem. **Gotowe, gdy:** wylogowanie z niewysłanym zapisem pyta o potwierdzenie, a bez niego działa jak dotąd, co potwierdza test end-to-end w trybie offline. | Niski | 💻 Programistyczne |
| 32 | **Wymuszony `superstatic` 11 dla `firebase-tools` do usunięcia** | **Stan:** projekt działa na Node.js 26 (`engines.node` w `package.json`). Najnowszy `firebase-tools` (15.35.0) nadal deklaruje `superstatic@^10`, a `superstatic` 10 obsługuje Node.js tylko do 24 (`EBADENGINE` przy `npm ci`). Dlatego `overrides` w `package.json` wymusza `superstatic` 11.1 — kombinację, której Firebase nie testuje; projekt nie używa emulatora Hostingu ani `firebase serve`, które z niego korzystają ([ARCHITECTURE.md](ARCHITECTURE.md#wymuszone-wersje-zależności-pośrednich)). **Zrobić:** gdy `firebase-tools` zacznie wymagać `superstatic` 11 lub nowszego (`npm view firebase-tools dependencies.superstatic`), usunąć wpis `superstatic` z `overrides` i z ARCHITECTURE.md. **Gotowe, gdy:** `package.json` nie ma override `superstatic`, `npm ci` na Node.js 26 nie zgłasza `EBADENGINE`, a komplet kontroli przechodzi. | Niski | 💻 Programistyczne |
| 33 | **Brak decyzji o skryptach instalacyjnych zależności (`allowScripts`)** | **Stan:** npm 11 z Node.js 26 kończy `npm ci` ostrzeżeniem, że skrypty instalacyjne `@firebase/util` (`postinstall`), `protobufjs` (`postinstall`) i `re2` (`install`, moduł natywny) nie są objęte polem `allowScripts` w `package.json`. Według `npm help install-scripts` takie skrypty są domyślnie blokowane; npm 11.20 nadal je uruchamia. Żaden z nich nie jest potrzebny aplikacji ani testom: `@firebase/util` zapisuje konfigurację z `FIREBASE_WEBAPP_CONFIG`, której projekt nie używa, `protobufjs` tylko sprawdza zapis wersji, a `re2` to opcjonalna zależność `superstatic` (emulator Hostingu, nieużywany). **Zrobić:** właściciel decyduje o liście `allowScripts` (`npm install-scripts approve`/`deny`). **Gotowe, gdy:** `npm ci` kończy się bez ostrzeżeń `install-scripts`, a komplet kontroli przechodzi. | Niski | 🖐️💻 Mieszane |
| 35 | **Przyciski edycji, kopiowania i usuwania szablonu bez nazwy dla czytników ekranu** | **Stan:** w `TemplatesTab` (`src/features/templates/TemplatesTab.tsx`, listy „Moje Szablony” i „Domyślne Szablony”) przyciski z samą ikoną (`Edit`, `Copy`, `Trash2`) nie mają `aria-label` ani tekstu. Czytnik ekranu ogłasza je jako „przycisk” bez nazwy i bez szablonu, którego dotyczą, a test end-to-end `"Ostatnio" follows the template after a rename…` (`e2e/app.spec.ts`) wybiera przycisk edycji po kolejności w karcie. **Zrobić:** nadać przyciskom nazwy z nazwą szablonu (np. „Edytuj szablon Basen”) i typ `button`. **Gotowe, gdy:** każdy przycisk na kartach szablonów ma dostępną nazwę z akcją i nazwą szablonu, co potwierdza test komponentu, a e2e wybiera przycisk edycji po nazwie. | Niski | 💻 Programistyczne |
| 37 | **`npm audit`: `deepmerge` z `vite-plugin-pwa` bez poprawionej wersji** | **Stan:** `npm audit` zgłasza 4 alerty o niskiej wadze: `deepmerge` 4.3.1 ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), zatrucie prototypu w `mergeObject()`) w łańcuchu `vite-plugin-pwa` 2.0.0 → `workbox-build` 7.4.1 → `@rollup/plugin-node-resolve` 16.0.3 → `deepmerge`. Alert obejmuje wszystkie wersje od 4.2.0, a 4.3.1 jest najnowsza, więc nie ma poprawki do wymuszenia; `npm audit fix --force` proponuje cofnięcie `vite-plugin-pwa` do 0.2.1. Pakiet działa tylko przy buildzie (generowanie `sw.js`) na konfiguracji z repozytorium i nie trafia do aplikacji. **Zrobić:** gdy pojawi się poprawiona wersja `deepmerge` albo łańcuch przestanie jej używać, zaktualizować zależności (ewentualnie przez `overrides`). **Gotowe, gdy:** `npm audit` nie zgłasza `deepmerge`, a komplet kontroli przechodzi. | Niski | 💻 Programistyczne |
