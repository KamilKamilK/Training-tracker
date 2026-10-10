# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Niski priorytet

- **#16 — Nieużywane pliki z szablonu projektu Vite**
- **#17 — Aplikacja nie otwiera się bez sieci**

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
