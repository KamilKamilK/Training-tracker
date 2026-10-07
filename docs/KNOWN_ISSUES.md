# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Wysoki priorytet

- **#1 — Reguły Firestore wygasły, a dostęp nie wymaga logowania**
- **#2 — Zakończony trening ginie przy nieudanym zapisie**

### Średni priorytet

- **#3 — Błędy zapisu i odczytu są niewidoczne dla użytkownika**
- **#4 — Mutowanie stanu React i propsów**
- **#5 — Brak testów automatycznych**
- **#6 — Dane z Firestore i formularza pomiaru bez walidacji**

### Niski priorytet

- **#7 — Błędy ESLint w repozytorium**
- **#8 — Brak CI**
- **#9 — README opisuje nieaktualny stan i brak `.env.example`**
- **#10 — Nieużywane SDK Firebase Data Connect**
- **#11 — Informacyjne `console.log` w kodzie produkcyjnym**
- **#12 — Bundle powyżej 500 kB**

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
| 1 | **Reguły Firestore wygasły, a dostęp nie wymaga logowania** | **Stan:** `firestore.rules` to reguła startowa `allow read, write: if request.time < timestamp.date(2025, 12, 7)` — po tej dacie odrzuca wszystkie żądania, a wcześniej dawała pełny dostęp każdemu ze znajomością konfiguracji z bundla. Aplikacja nie ma Firebase Authentication (`src/lib/firebaseConfig.ts`), dokumenty nie mają właściciela. **Zrobić:** logowanie Firebase Authentication, dokumenty pod `users/{uid}/…` lub z polem `ownerId`, reguły dopuszczające tylko właściciela i walidujące pola zapisu, migracja istniejących danych (zgoda właściciela). **Gotowe, gdy:** reguły odrzucają żądanie bez logowania i z cudzym `uid`, co potwierdzają testy na emulatorze; wdrożone reguły w konsoli są zgodne z plikiem. | Wysoki | 🖐️💻 Mieszane — włączenie Authentication i wdrożenie reguł w konsoli Firebase wymaga właściciela |
| 2 | **Zakończony trening ginie przy nieudanym zapisie** | **Stan:** `handleFinishWorkout` w `src/components/TrainingTracker.tsx` wywołuje `finishWorkout()` (`src/hooks/useWorkouts.ts`), który czyści stan i szkic w LocalStorage, a dopiero potem `saveWorkout` (`src/hooks/useFirebaseStorage.ts`), który połyka błąd. Przy braku sieci lub odrzuceniu przez reguły trening przepada bez komunikatu. **Zrobić:** szkic usuwać dopiero po udanym zapisie, błąd przekazać do UI. **Gotowe, gdy:** przy wymuszonym błędzie zapisu trening zostaje w zakładce „Trening”, użytkownik widzi komunikat, a test jednostkowy to potwierdza. | Wysoki | 💻 Programistyczne |
| 3 | **Błędy zapisu i odczytu są niewidoczne dla użytkownika** | **Stan:** `useFirebaseStorage.ts` i `useMeasurements.ts` łapią wyjątki i tylko logują je w konsoli; `useWeekPlan.ts` używa `alert`. Nieudany odczyt wygląda jak pusta historia. **Zrobić:** stan błędu w hookach i wspólny komponent komunikatu w `src/components/common/`. **Gotowe, gdy:** każdy hook Firestore zwraca stan błędu, UI pokazuje go spójnie, brak pustych lub tylko logujących `catch`. | Średni | 💻 Programistyczne |
| 4 | **Mutowanie stanu React i propsów** | **Stan:** `addSet`, `updateSet`, `removeSet` w `src/hooks/useWorkouts.ts` robią płytką kopię i zmieniają zagnieżdżone `exercises[].sets` (`push`, `splice`, przypisanie). `getLastMeasurement` w `src/utils/measurement.utils.ts` sortuje tablicę z propsów w miejscu, odwracając kolejność stanu `measurements` posortowanego rosnąco w `useMeasurements.ts`. **Zrobić:** niemutowalne aktualizacje. **Gotowe, gdy:** testy jednostkowe potwierdzają, że wejściowe obiekty są niezmienione po każdej z tych operacji. | Średni | 💻 Programistyczne |
| 5 | **Brak testów automatycznych** | **Stan:** `package.json` nie ma skryptu `test` ani narzędzi testowych; reguł Firestore nikt nie testuje. **Zrobić:** Vitest + Testing Library dla `utils/` i hooków, `@firebase/rules-unit-testing` z emulatorem dla `firestore.rules`, skrypt `npm test`, wpis w części „Weryfikacja” `AGENTS.md`. **Gotowe, gdy:** `npm test` uruchamia testy jednostkowe i reguł, a celowe naruszenie (np. odwrócony warunek reguły) daje czerwony wynik. | Średni | 💻 Programistyczne |
| 6 | **Dane z Firestore i formularza pomiaru bez walidacji** | **Stan:** serwisy w `src/services/firebase/` rzutują `doc.data()` przez `as` bez sprawdzenia pól; `promptForMeasurement` w `src/utils/measurement.utils.ts` pobiera dane przez `prompt()` i nie sprawdza formatu daty ani zakresu wartości, choć `src/constants/validation.ts` i `src/utils/validation.utils.ts` istnieją. **Zrobić:** walidacja przy odczycie w serwisie i formularz pomiaru z walidacją zamiast `prompt()`. **Gotowe, gdy:** dokument z błędnym kształtem nie trafia do stanu (test), a niepoprawny pomiar jest odrzucany z komunikatem przy polu. | Średni | 💻 Programistyczne |
| 7 | **Błędy ESLint w repozytorium** | **Stan:** `npm run lint` zgłasza 4 błędy i 1 ostrzeżenie: `any` w `src/hooks/useModels.ts` i `src/components/tabs/TemplatesTab/index.tsx`, nieużywane importy w generowanym `src/dataconnect-generated/react/index.d.ts` (katalog nie jest w `globalIgnores` w `eslint.config.js`), brakująca zależność `useEffect` w `src/hooks/useWorkouts.ts`. **Gotowe, gdy:** `npm run lint` kończy się bez błędów i ostrzeżeń. | Niski | 💻 Programistyczne |
| 8 | **Brak CI** | **Stan:** brak `.github/workflows/` i git hooków; lint i build uruchamiane tylko ręcznie. **Zrobić:** workflow z `npm ci`, `npm run lint`, `npm run build` (i `npm test` po #5). **Gotowe, gdy:** pull request z błędem lint lub kompilacji ma czerwony status. | Niski | 💻 Programistyczne |
| 9 | **README opisuje nieaktualny stan i brak `.env.example`** | **Stan:** `README.md` podaje zapis w LocalStorage i React 18, a dane są w Firestore ([ADR-0002](adr/0002-spa-firebase.md)) i projekt używa React 19; brak listy zmiennych `VITE_*` z `src/lib/firebaseConfig.ts`. **Gotowe, gdy:** README zgadza się z `package.json` i ADR-0002, a `.env.example` zawiera wszystkie zmienne bez wartości. | Niski | 💻 Programistyczne |
| 10 | **Nieużywane SDK Firebase Data Connect** | **Stan:** `src/dataconnect-generated/` i zależność `@dataconnect/generated` w `package.json` nie są importowane przez kod aplikacji. **Gotowe, gdy:** katalog i zależność są usunięte, a `npm run build` przechodzi. | Niski | 💻 Programistyczne |
| 11 | **Informacyjne `console.log` w kodzie produkcyjnym** | **Stan:** hooki (`useFirebaseStorage.ts`, `useMeasurements.ts`, `useWeekPlan.ts`) logują sukcesy operacji emoji-komunikatami. **Gotowe, gdy:** w `src/` (poza kodem generowanym) zostają tylko `console.error`/`console.warn` w serwisach, a reguła ESLint `no-console` to egzekwuje. | Niski | 💻 Programistyczne |
| 12 | **Bundle powyżej 500 kB** | **Stan:** `npm run build` ostrzega o chunku ok. 580 kB (Firebase i Recharts w jednym pliku). **Zrobić:** leniwe ładowanie zakładki „Postępy” (`React.lazy`). **Gotowe, gdy:** build nie zgłasza ostrzeżenia o rozmiarze chunku. | Niski | 💻 Programistyczne |
