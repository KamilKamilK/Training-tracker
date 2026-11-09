# Dziennik Treningowy — znane problemy i dług techniczny

Jedyne źródło prawdy o nienaprawionych błędach, długu technicznym i lukach w testach oraz narzędziach. Kierunek wyznaczają decyzje w [DECISIONS.md](DECISIONS.md).

## Zestawienie według priorytetu

### Niski priorytet

- **#32 — Node.js 26 niedostępny przez `superstatic` z `firebase-tools`**
- **#33 — Brak decyzji o skryptach instalacyjnych zależności (`allowScripts`)**
- **#35 — Przyciski edycji, kopiowania i usuwania szablonu bez nazwy dla czytników ekranu**
- **#36 — Błąd wylogowania niewidoczny w dzienniku i na ekranie zgody**

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
| 32 | **Node.js 26 niedostępny przez `superstatic` z `firebase-tools`** | **Stan:** projekt działa na Node.js 24 (`engines.node` w `package.json`), choć Node.js 26 jest już aktywnym LTS i domyślną wersją Vercel. Najnowszy `firebase-tools` (15.35.0) zależy od `superstatic@^10`, a `superstatic` 10.0.0 deklaruje `engines.node` `20 \|\| 22 \|\| 24`, więc `npm ci` na Node.js 26 zgłasza `EBADENGINE`. Zgodny jest dopiero `superstatic` 11. Z tego samego powodu `@types/node` zostaje w linii 24, zgodnej z wersją uruchomieniową, a `npm outdated` pokazuje nowszą wersję 26. **Zrobić:** gdy `firebase-tools` przejdzie na `superstatic` 11 lub nowszy, zmienić `engines.node` na linię 26 i zaktualizować `@types/node` do 26. **Gotowe, gdy:** `npm ci` na Node.js 26 nie zgłasza `EBADENGINE`, a komplet kontroli przechodzi na Node.js 26. | Niski | 💻 Programistyczne |
| 33 | **Brak decyzji o skryptach instalacyjnych zależności (`allowScripts`)** | **Stan:** npm 11 z Node.js 24 kończy `npm ci` ostrzeżeniem, że skrypty instalacyjne `@firebase/util` (`postinstall`), `protobufjs` (`postinstall`) i `re2` (`install`, moduł natywny) nie są objęte polem `allowScripts` w `package.json`. Według `npm help install-scripts` takie skrypty są domyślnie blokowane; npm 11.19 nadal je uruchamia. Żaden z nich nie jest potrzebny aplikacji ani testom: `@firebase/util` zapisuje konfigurację z `FIREBASE_WEBAPP_CONFIG`, której projekt nie używa, `protobufjs` tylko sprawdza zapis wersji, a `re2` to opcjonalna zależność `superstatic` (emulator Hostingu, nieużywany). **Zrobić:** właściciel decyduje o liście `allowScripts` (`npm install-scripts approve`/`deny`). **Gotowe, gdy:** `npm ci` kończy się bez ostrzeżeń `install-scripts`, a komplet kontroli przechodzi. | Niski | 🖐️💻 Mieszane |
| 35 | **Przyciski edycji, kopiowania i usuwania szablonu bez nazwy dla czytników ekranu** | **Stan:** w `TemplatesTab` (`src/features/templates/TemplatesTab.tsx`, listy „Moje Szablony” i „Domyślne Szablony”) przyciski z samą ikoną (`Edit`, `Copy`, `Trash2`) nie mają `aria-label` ani tekstu. Czytnik ekranu ogłasza je jako „przycisk” bez nazwy i bez szablonu, którego dotyczą, a test end-to-end `"Ostatnio" follows the template after a rename…` (`e2e/app.spec.ts`) wybiera przycisk edycji po kolejności w karcie. **Zrobić:** nadać przyciskom nazwy z nazwą szablonu (np. „Edytuj szablon Basen”) i typ `button`. **Gotowe, gdy:** każdy przycisk na kartach szablonów ma dostępną nazwę z akcją i nazwą szablonu, co potwierdza test komponentu, a e2e wybiera przycisk edycji po nazwie. | Niski | 💻 Programistyczne |
| 36 | **Błąd wylogowania niewidoczny w dzienniku i na ekranie zgody** | **Stan:** `useAuth` (`src/features/auth/useAuth.ts`) zapisuje błąd wylogowania (`AuthService.signOut`) i sprawdzenia niewysłanych zapisów (`AuthService.hasPendingWrites`) w `error`, ale `App` (`src/App.tsx`) przekazuje go tylko do `AuthScreen` i do okna „Niewysłane zmiany”. Gdy „Wyloguj” w nagłówku `TrainingTracker` albo na `ConsentScreen` się nie powiedzie bez otwartego okna, użytkownik nie dostaje komunikatu i pozostaje zalogowany. **Zrobić:** pokazać błąd wylogowania na tych ekranach (np. przekazać `auth.error` z możliwością zamknięcia). **Gotowe, gdy:** nieudane wylogowanie z dziennika i z ekranu zgody pokazuje komunikat po polsku, co potwierdza test komponentu. | Niski | 💻 Programistyczne |
