# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Niski priorytet

- **#28 — Trening bez notatek, czasu trwania i możliwości porzucenia**
- **#30 — Wylogowanie bez sieci usuwa zapisy czekające na wysłanie**
- **#31 — Narzędzia projektu używają Node.js poniżej wymagań Firebase 13**
- **#35 — Przyciski edycji, kopiowania i usuwania szablonu bez nazwy dla czytników ekranu**

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
| 28 | **Trening bez notatek, czasu trwania i możliwości porzucenia** | **Stan:** `useWorkoutDraft` zapisuje zawsze pusty `notes`, a formularz (`src/features/workouts/WorkoutForm.tsx`) nie ma pola notatek. Pole `duration` istnieje w `WorkoutDocumentSchema` i regułach, ale nic go nie wypełnia, a `finishWorkout` nadpisuje `date` czasem zakończenia, więc czas rozpoczęcia ginie. Rozpoczętego treningu nie da się porzucić inaczej niż zapisując go albo rozpoczynając nowy. **Zrobić:** notatki i czas rozpoczęcia razem ze zmianą kształtu `sessions` w kroku 4 ROADMAP (jedna migracja); porzucenie z potwierdzeniem niezależnie. **Gotowe, gdy:** trening ma notatki i czas trwania widoczne w Historii, a porzucenie usuwa szkic po potwierdzeniu, co potwierdzają testy hooka i test end-to-end. | Niski | 💻 Programistyczne |
| 30 | **Wylogowanie bez sieci usuwa zapisy czekające na wysłanie** | **Stan:** `AuthService.signOut` (`src/features/auth/auth.service.ts`) wywołuje `clearIndexedDbPersistence`, która usuwa z IndexedDB także kolejkę zapisów Firestore niewysłanych jeszcze na serwer (np. pomiar dodany offline). Trening, który czeka na zapis, chroni okno potwierdzenia w `TrainingTracker`; pozostałe zapisy giną bez ostrzeżenia. **Zrobić:** przed wylogowaniem sprawdzić, czy są zapisy czekające na serwer (`waitForPendingWrites` z limitem czasu w serwisie), i przy ich obecności pokazać ostrzeżenie z wyborem. **Gotowe, gdy:** wylogowanie z niewysłanym zapisem pyta o potwierdzenie, a bez niego działa jak dotąd, co potwierdza test end-to-end w trybie offline. | Niski | 💻 Programistyczne |
| 31 | **Narzędzia projektu używają Node.js poniżej wymagań Firebase 13** | **Stan:** `README.md` wymaga Node.js 22.18+, a `.github/workflows/ci.yml` uruchamia Node.js 22. Pakiety `@firebase/*` z `firebase` 13.2 (np. `@firebase/app` 0.16.5, `@firebase/firestore` 4.19) i `@firebase/rules-unit-testing` 6.0.0 deklarują `engines.node >=24.12.0`; instalacja na Node.js 22.23.3 zgłasza `EBADENGINE`, mimo że bieżące kontrole przechodzą. Skutki uboczne: `npm outdated` pokazuje `@firebase/rules-unit-testing` z „Latest” 5.0.2, bo pomija wersje niezgodne z bieżącym Node.js, a npm 10 dołączony do Node.js 22 nie rozwiązuje opcjonalnych zależności `peer` `@vitejs/plugin-react` 6.3 przy jego aktualizacji (`ERESOLVE` przez `@babel/plugin-transform-runtime` 8); npm 11 rozwiązuje je poprawnie. **Zrobić:** uzgodnić i ustawić wspieraną wersję Node.js w CI, dokumentacji i środowisku hostingu. **Gotowe, gdy:** `npm ci` działa bez ostrzeżeń o wersji Node.js, `npm outdated` nie pokazuje `@firebase/rules-unit-testing`, a komplet kontroli przechodzi na wersji wspieranej przez zależności. | Niski | 💻 Programistyczne |
| 35 | **Przyciski edycji, kopiowania i usuwania szablonu bez nazwy dla czytników ekranu** | **Stan:** w `TemplatesTab` (`src/features/templates/TemplatesTab.tsx`, listy „Moje Szablony” i „Domyślne Szablony”) przyciski z samą ikoną (`Edit`, `Copy`, `Trash2`) nie mają `aria-label` ani tekstu. Czytnik ekranu ogłasza je jako „przycisk” bez nazwy i bez szablonu, którego dotyczą, a test end-to-end `"Ostatnio" follows the template after a rename…` (`e2e/app.spec.ts`) wybiera przycisk edycji po kolejności w karcie. **Zrobić:** nadać przyciskom nazwy z nazwą szablonu (np. „Edytuj szablon Basen”) i typ `button`. **Gotowe, gdy:** każdy przycisk na kartach szablonów ma dostępną nazwę z akcją i nazwą szablonu, co potwierdza test komponentu, a e2e wybiera przycisk edycji po nazwie. | Niski | 💻 Programistyczne |
