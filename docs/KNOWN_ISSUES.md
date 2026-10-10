# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Wysoki priorytet

- **#1 — Odmowa dostępu dla obcego konta niepotwierdzona na produkcji**

### Średni priorytet

- **#15 — Wersja produkcyjna nie jest automatycznie sprawdzana w przeglądarce**

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
| 1 | **Odmowa dostępu dla obcego konta niepotwierdzona na produkcji** | **Stan:** 2026-10-10 w projekcie `training-tracker-6d13b` wdrożono `firestore.rules` z repozytorium (wcześniej opublikowane reguły dawały publiczny odczyt i zapis `measurements`, `weekPlans`, `workouts`), włączono logowanie Google, dodano domenę `training-tracker-six.vercel.app` i dokument `owners/{uid}` właściciela; właściciel loguje się i widzi swoje dane. Odmowę dla innego konta potwierdzają testy reguł na emulatorze, ale nie sprawdzono jej na produkcji. **Zrobić:** zalogować się na produkcji kontem Google spoza `owners`. **Gotowe, gdy:** takie konto widzi ekran „nie ma dostępu” i nie widzi danych. | Wysoki | 🖐️ Manualne — wymaga drugiego konta Google właściciela |
| 15 | **Wersja produkcyjna nie jest automatycznie sprawdzana w przeglądarce** | **Stan:** testy jednostkowe działają w jsdom, a hook `pre-push` tylko buduje aplikację (`npm run build`); nic nie uruchamia zbudowanego `dist/` w przeglądarce, więc błąd ładowania chunków (np. cykl importów między chunkami z `manualChunks` w `vite.config.ts`) przechodzi wszystkie kontrole i daje pustą stronę na produkcji. **Zrobić:** test E2E (Playwright) na `npm run build` + `vite preview` z emulatorami, uruchamiany w hooku `pre-push` lub osobnym poleceniu ([ROADMAP](ROADMAP.md), etap 0). **Gotowe, gdy:** test kończy się błędem przy błędzie strony (`pageerror`) lub braku ekranu logowania, co potwierdza próbka negatywna z cyklicznym podziałem chunków. | Średni | 💻 Programistyczne |
