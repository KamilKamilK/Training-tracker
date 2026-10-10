# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Wysoki priorytet

- **#1 — Reguły i logowanie nie są wdrożone w projekcie Firebase**

### Średni priorytet

- **#15 — Wersja produkcyjna nie jest automatycznie sprawdzana w przeglądarce**

### Niski priorytet

- **#10 — Nieużywany katalog SDK Firebase Data Connect**
- **#13 — Nieużywany kod pomocniczy**

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
| 1 | **Reguły i logowanie nie są wdrożone w projekcie Firebase** | **Stan:** kod i `firestore.rules` realizują [ADR-0003](adr/0003-owner-authentication.md), a testy reguł przechodzą na emulatorze; reguły z repozytorium nie są wdrażane automatycznie, a dostawca Google, autoryzowana domena hostingu i dokument `owners/{uid}` w projekcie `training-tracker-6d13b` wymagają konfiguracji w konsoli. Do tego czasu produkcja nie wpuści właściciela do danych. **Zrobić:** kroki z [README](../README.md#-konfiguracja-firebase-jednorazowo-konsola-firebase). **Gotowe, gdy:** właściciel loguje się na produkcji i widzi swoje dane, a konto spoza `owners` widzi ekran braku dostępu. | Wysoki | 🖐️ Manualne — konsola Firebase i `firebase deploy` wymagają konta właściciela |
| 10 | **Nieużywany katalog SDK Firebase Data Connect** | **Stan:** `src/dataconnect-generated/` nie jest importowany, a zależność `@dataconnect/generated` została usunięta z `package.json`; katalog jest wyłączony z ESLint w `eslint.config.js`. **Gotowe, gdy:** katalog i jego wpis w `globalIgnores` są usunięte, a `npm run build` przechodzi. | Niski | 💻 Programistyczne |
| 13 | **Nieużywany kod pomocniczy** | **Stan:** `validateWorkout` i `validateTemplate` (`src/utils/validation.utils.ts`), `isToday` i `getTimeAgo` (`src/utils/date.utils.ts`) oraz typ `window.storage` (`src/global.d.ts`) nie mają wywołań; hook `useModal` jest w pliku `src/hooks/useModels.ts`. Formularz szablonu (`src/components/tabs/TemplatesTab/index.tsx`) nie stosuje limitów z `VALIDATION_RULES.template`. **Gotowe, gdy:** nieużywany kod jest usunięty albo podłączony (walidacja szablonu z komunikatem przy polu i testem), a plik hooka nazywa się jak hook. | Niski | 💻 Programistyczne |
| 15 | **Wersja produkcyjna nie jest automatycznie sprawdzana w przeglądarce** | **Stan:** testy jednostkowe działają w jsdom, a hook `pre-push` tylko buduje aplikację (`npm run build`); nic nie uruchamia zbudowanego `dist/` w przeglądarce, więc błąd ładowania chunków (np. cykl importów między chunkami z `manualChunks` w `vite.config.ts`) przechodzi wszystkie kontrole i daje pustą stronę na produkcji. **Zrobić:** test E2E (Playwright) na `npm run build` + `vite preview` z emulatorami, uruchamiany w hooku `pre-push` lub osobnym poleceniu ([ROADMAP](ROADMAP.md), etap 0). **Gotowe, gdy:** test kończy się błędem przy błędzie strony (`pageerror`) lub braku ekranu logowania, co potwierdza próbka negatywna z cyklicznym podziałem chunków. | Średni | 💻 Programistyczne |
