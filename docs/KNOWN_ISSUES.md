# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Średni priorytet

- **#40 — Filmy techniki: brak limitu wywołań i sprzątania osieroconych plików**

### Niski priorytet

- **#32 — Wymuszony `superstatic` 11 dla `firebase-tools` do usunięcia**
- **#37 — `npm audit`: `deepmerge` z `vite-plugin-pwa` bez poprawionej wersji**
- **#38 — Przycisk usunięcia ćwiczenia w formularzu szablonu bez nazwy dla czytników ekranu**
- **#39 — `npm audit`: `hono` i `@hono/node-server` z `firebase-tools`**

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
| 32 | **Wymuszony `superstatic` 11 dla `firebase-tools` do usunięcia** | **Stan:** projekt działa na Node.js 26 (`engines.node` w `package.json`). Najnowszy `firebase-tools` (15.35.0) nadal deklaruje `superstatic@^10`, a `superstatic` 10 obsługuje Node.js tylko do 24 (`EBADENGINE` przy `npm ci`). Dlatego `overrides` w `package.json` wymusza `superstatic` 11.1 — kombinację, której Firebase nie testuje; projekt nie używa emulatora Hostingu ani `firebase serve`, które z niego korzystają ([ARCHITECTURE.md](ARCHITECTURE.md#wymuszone-wersje-zależności-pośrednich)). **Zrobić:** gdy `firebase-tools` zacznie wymagać `superstatic` 11 lub nowszego (`npm view firebase-tools dependencies.superstatic`), usunąć wpis `superstatic` z `overrides` i z ARCHITECTURE.md. **Gotowe, gdy:** `package.json` nie ma override `superstatic`, `npm ci` na Node.js 26 nie zgłasza `EBADENGINE`, a komplet kontroli przechodzi. | Niski | 💻 Programistyczne |
| 37 | **`npm audit`: `deepmerge` z `vite-plugin-pwa` bez poprawionej wersji** | **Stan:** `npm audit` zgłasza 4 alerty o niskiej wadze: `deepmerge` 4.3.1 ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), zatrucie prototypu w `mergeObject()`) w łańcuchu `vite-plugin-pwa` 2.0.0 → `workbox-build` 7.4.1 → `@rollup/plugin-node-resolve` 16.0.3 → `deepmerge`. Alert obejmuje wszystkie wersje od 4.2.0, a 4.3.1 jest najnowsza, więc nie ma poprawki do wymuszenia; `npm audit fix --force` proponuje cofnięcie `vite-plugin-pwa` do 0.2.1. Pakiet działa tylko przy buildzie (generowanie `sw.js`) na konfiguracji z repozytorium i nie trafia do aplikacji. **Zrobić:** gdy pojawi się poprawiona wersja `deepmerge` albo łańcuch przestanie jej używać, zaktualizować zależności (ewentualnie przez `overrides`). **Gotowe, gdy:** `npm audit` nie zgłasza `deepmerge`, a komplet kontroli przechodzi. | Niski | 💻 Programistyczne |
| 38 | **Przycisk usunięcia ćwiczenia w formularzu szablonu bez nazwy dla czytników ekranu** | **Stan:** w `TemplatesTab` (`src/features/templates/TemplatesTab.tsx`, sekcja „Ćwiczenia” formularza) przycisk wywołujący `removeExerciseField(idx)` zawiera tylko ikonę `Trash2`, bez tekstu ani `aria-label`. Czytnik ekranu nie rozpoznaje akcji ani ćwiczenia, którego dotyczy. **Zrobić:** nadać przyciskowi nazwę z akcją i numerem ćwiczenia oraz typ `button`. **Gotowe, gdy:** test komponentu wybiera przycisk po dostępnej nazwie i potwierdza usunięcie właściwego pola z listy kilku ćwiczeń. | Niski | 💻 Programistyczne |
| 39 | **`npm audit`: `hono` i `@hono/node-server` z `firebase-tools`** | **Stan:** `npm audit` zgłasza 2 alerty o średniej wadze: `hono` 4.13.13 (m.in. [GHSA-4m76-xfj5-7975](https://github.com/advisories/GHSA-4m76-xfj5-7975), [GHSA-h7mg-cq63-vhpq](https://github.com/advisories/GHSA-h7mg-cq63-vhpq)) i `@hono/node-server` 2.1.5 ([GHSA-jpvv-r467-5p4w](https://github.com/advisories/GHSA-jpvv-r467-5p4w)) w łańcuchu `firebase-tools` 15.35.0 → `@modelcontextprotocol/sdk` 1.32.1. Pakiety obsługują serwer MCP narzędzia `firebase`, którego projekt nie uruchamia; nie trafiają do aplikacji ani do funkcji `api/`. Ten sam stan jest na `main`. `npm audit` wskazuje poprawki w zakresie zależności (`npm audit fix`). **Zrobić:** zaktualizować `hono` i `@hono/node-server` w `package-lock.json` do wersji z poprawkami opublikowanych co najmniej 7 dni wcześniej. **Gotowe, gdy:** `npm audit` nie zgłasza `hono` ani `@hono/node-server`, a komplet kontroli (z `npm audit signatures`) przechodzi. | Niski | 💻 Programistyczne |
| 40 | **Filmy techniki: brak limitu wywołań i sprzątania osieroconych plików** | **Stan:** funkcja `api/exercise-videos.ts` wydaje podpisane linki bez limitu wywołań na użytkownika, którego wymaga [ADR-0014](adr/0014-server-functions-and-email.md), pkt 2. Gdy `useExerciseVideos.uploadVideo` (`src/features/exerciseVideos/useExerciseVideos.ts`) wyśle plik, a zapis dokumentu `exerciseVideos` albo usunięcie zastąpionego pliku się nie uda, plik zostaje w zasobniku Supabase bez dokumentu. Zaakceptowane odstępstwo wersji testowej z jednym kontem `admin` ([ADR-0019](adr/0019-exercise-technique-videos.md), pkt 7). **Zrobić:** limit wywołań na użytkownika zapisany w Firestore przez Admin SDK (z regułą odmawiającą dostępu z aplikacji) oraz sprzątanie plików bez dokumentu (np. akcja administratora w funkcji porównująca listę plików z kolekcją). **Gotowe, gdy:** testy funkcji pokazują odpowiedź 429 po przekroczeniu limitu i usunięcie pliku bez dokumentu przy zachowaniu plików z dokumentem; zamknięte przed nadaniem roli `admin` drugiemu kontu. | Średni | 💻 Programistyczne |
