# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Niski priorytet

- **#32 — Wymuszony `superstatic` 11 dla `firebase-tools` do usunięcia**
- **#41 — Wymuszony `jose` 5 dla `jwks-rsa` do usunięcia**
- **#42 — Testy formularzy z `userEvent` przekraczają limit czasu przy obciążonym komputerze**
- **#43 — Niestabilne testy przy pełnym przebiegu: `runtime.test.ts` i wylogowanie offline w e2e**

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
| 41 | **Wymuszony `jose` 5 dla `jwks-rsa` do usunięcia** | **Stan:** `firebase-admin` 14.5.1 → `jwks-rsa` 4.1.0 wymaga `jose@^6`, które jest wyłącznie modułem ES i ładowane przez `require()` nie działa w funkcjach Vercel (`ERR_REQUIRE_ESM`, [firebase-admin-node#3181](https://github.com/firebase/firebase-admin-node/issues/3181)). `overrides` w `package.json` daje `jwks-rsa` wersję `jose` 5.10.0 z wydaniem CommonJS — linię, która nie dostaje już nowych wydań (ostatnie: luty 2025) ([ARCHITECTURE.md](ARCHITECTURE.md#wymuszone-wersje-zależności-pośrednich)). `firebase-admin` używa `jwks-rsa` tylko do App Check, którego funkcja nie wywołuje, ale `firebase-admin/auth` ładuje go przy imporcie (`lib/auth/token-verifier.js` → `lib/utils/jwt.js` → `require("jwks-rsa")`), więc kod projektu nie może tego obejść. Obecnie nie da się tego naprawić po stronie projektu: czekamy na poprawkę biblioteki — [node-jwks-rsa#508](https://github.com/auth0/node-jwks-rsa/pull/508) (leniwe ładowanie `jose`) albo [firebase-admin-node#3311](https://github.com/firebase/firebase-admin-node/pull/3311) (zastąpienie `jwks-rsa` przez Web Crypto); obie są otwarte. **Zrobić:** gdy wyjdzie wydanie `jwks-rsa` z #508 albo `firebase-admin` z #3311 (`npm view jwks-rsa version`, `npm view firebase-admin version`), zaktualizować zależność i usunąć wpis `jwks-rsa` z `overrides` oraz z ARCHITECTURE.md. **Gotowe, gdy:** `package.json` nie ma override `jose`, `tests/api/runtime.test.ts` przechodzi, a produkcyjne `POST /api/exercise-videos` bez tokenu odpowiada 401. | Niski | 💻 Programistyczne |
| 42 | **Testy formularzy z `userEvent` przekraczają limit czasu przy obciążonym komputerze** | **Stan:** przy dużym obciążeniu (średnie obciążenie ok. 20) `npm test` co kilka uruchomień zgłasza przekroczenie limitu 5000 ms w testach wpisujących tekst przez `userEvent.type`: `src/features/auth/SignInPanel.test.tsx`, `src/features/measurements/MeasurementForm.test.tsx`, `src/features/profile/ConsentScreen.test.tsx`, `src/features/templates/TemplatesTab.test.tsx`. Przerwany test pisze dalej do dokumentu następnego testu, więc ten dostaje zniekształconą wartość (np. `eanna@example.com`). Na nieobciążonym komputerze testy przechodzą. **Zrobić:** ustalić, co wydłuża te testy (opóźnienie `userEvent`, liczba znaków, środowisko jsdom), i skrócić je albo jawnie podnieść limit tylko tam, gdzie to uzasadnione. **Gotowe, gdy:** 10 kolejnych uruchomień `npm test` równolegle z `npm run build` przechodzi bez przekroczenia limitu czasu. | Niski | 💻 Programistyczne |
| 43 | **Niestabilne testy przy pełnym przebiegu: `runtime.test.ts` i wylogowanie offline w e2e** | **Stan:** dwa testy raz przechodzą, raz nie, bez zmian w kodzie, którego dotyczą. `tests/api/runtime.test.ts` uruchamia osobny proces Node.js z importem `api/exercise-videos.ts` i przy równoległym `vitest run tests/api` przekroczył domyślny limit 5000 ms (zaobserwowane 2026-11-19, także na `origin/main` bez zmian); uruchomiony osobno przechodzi. W `npm run test:e2e` test „signing out offline after the confirmation deletes the unsent change” (`e2e/app.spec.ts`) nie przeszedł w pełnym przebiegu na kroku ponownego logowania po powrocie do sieci (wiersz 603), a uruchomiony osobno przeszedł 3 razy z 3. **Zrobić:** dla `runtime.test.ts` ustalić czas startu procesu i ustawić jawny limit testu; dla e2e ustalić, na co test powinien poczekać po `setOffline(false)` przed logowaniem (np. gotowość service workera albo połączenia Firestore), zamiast polegać na czasie. **Gotowe, gdy:** 5 kolejnych pełnych przebiegów `npm test` i `npm run test:e2e` przechodzi bez tych błędów. | Niski | 💻 Programistyczne |
