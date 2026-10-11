# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Średni priorytet

- **#19 — Po odświeżeniu strony dziennik czasem wczytuje się dłużej niż 5 sekund**

### Niski priorytet

- **#16 — Nieużywane pliki z szablonu projektu Vite**
- **#17 — Aplikacja nie otwiera się bez sieci**
- **#18 — Okno modalne bez roli dialogu dla czytników ekranu**

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
| 16 | **Nieużywane pliki z szablonu projektu Vite** | **Stan:** `src/App.css` i `src/assets/react.svg` pochodzą z szablonu startowego i nie są importowane przez kod ani `index.html`. **Gotowe, gdy:** pliki są usunięte, a `npm run build` i testy end-to-end przechodzą. | Niski | 💻 Programistyczne |
| 17 | **Aplikacja nie otwiera się bez sieci** | **Stan:** dane są w pamięci podręcznej Firestore (IndexedDB), a zakładki pobierane po zalogowaniu (`src/app/TrainingTracker.tsx`), więc praca offline działa tylko na stronie otwartej wcześniej z siecią. Otwarcie lub odświeżenie strony bez sieci (np. telefon w trybie samolotowym, przeładowana karta) kończy się błędem przeglądarki, bo pliki aplikacji nie są zapisane lokalnie — brak service workera. **Zrobić:** odłożone decyzją właściciela 2026-10-10 (na siłowni jest Wi-Fi) do wersji mobilnej — [ADR-0013](adr/0013-offline-app-shell.md): service worker dla plików aplikacji z komunikatem o nowej wersji i test end-to-end otwarcia strony offline. **Gotowe, gdy:** po jednej wizycie z siecią strona otwiera się bez sieci zalogowana i z danymi, co potwierdza test end-to-end. | Niski | 💻 Programistyczne |
| 18 | **Okno modalne bez roli dialogu dla czytników ekranu** | **Stan:** `Modal` (`src/components/common/Modal.tsx`) nie ma `role="dialog"`, `aria-modal` ani powiązania z tytułem, nie przenosi fokusu do okna i nie zamyka się klawiszem Escape; przycisk zamknięcia (ikona X) nie ma etykiety. Czytnik ekranu nie rozpoznaje okna, a testy E2E nie mogą odwołać się do niego po roli (np. potwierdzenie wycofania zgody w Ustawieniach). **Gotowe, gdy:** okno ma rolę dialogu z nazwą z tytułu, fokus trafia do okna i wraca po zamknięciu, Escape je zamyka, przycisk X ma etykietę „Zamknij”, co potwierdzają testy komponentu. | Niski | 💻 Programistyczne |
| 19 | **Po odświeżeniu strony dziennik czasem wczytuje się dłużej niż 5 sekund** | **Stan:** w testach end-to-end po `page.reload()` zalogowanego właściciela ekran „Ładowanie danych...” zostaje dłużej niż limit 5 s (`openAsOwner` w `e2e/app.spec.ts`): 4 na 180 uruchomień na `049cc36` i 1 na 130 na `dc046b6`, więc problem istniał przed profilem i zgodą. Nie wiadomo, który etap czeka (sprawdzenie `owners`, profil, pierwsze dane); podejrzenie: przejęcie pamięci podręcznej IndexedDB przez nową kartę przy `persistentMultipleTabManager` (`src/lib/firebaseConfig.ts`), gdy poprzednia karta się zamyka. Hook `pre-push` potrafi przez to odrzucić poprawny push. **Gotowe, gdy:** przyczyna jest potwierdzona pomiarem czasu etapów, poprawiona u źródła, a `npx playwright test --repeat-each=20` przechodzi bez błędu. | Średni | 💻 Programistyczne |
