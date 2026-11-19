# ADR-0019: Filmy techniki ćwiczeń w Supabase Storage (wersja testowa)

- **Status:** przyjęta 2026-11-19 (właściciel: wersja testowa na Supabase Free, film przypięty do nazwy ćwiczenia, bramka w funkcji Vercel, wgrywanie tylko z rolą `admin` nadaną ręcznie jednemu kontu, oglądanie przez wszystkie aktywne konta); limity z pkt 3 do potwierdzenia przez właściciela; limit wywołań i sprzątanie plików z pkt 7 przyjęte przez właściciela 2026-11-19, w tym usuwanie wszystkiego spoza filmów aplikacji z Ustawień

## Kontekst

Przy ćwiczeniu w treningu ma być krótki film instruktażowy pokazujący poprawną technikę. Filmy wgrywa jedno konto właściciela, najwyżej ok. 10 sztuk; pozostałe konta tylko je oglądają. Firebase zostaje na planie Spark, na którym domyślny zasobnik Cloud Storage nie jest dostępny ([ADR-0009](0009-cloud-functions-aggregates.md), pkt 4), a kod serwerowy działa w funkcjach Vercel ([ADR-0014](0014-server-functions-and-email.md)). Ćwiczenia są dziś tekstem w szablonie i w treningu; biblioteka z `exerciseId` powstanie dopiero w etapie 4 ([ADR-0016](0016-roles-views-exercise-library.md), pkt 7). Film techniki nie dotyczy konkretnej osoby, więc nie jest daną o zdrowiu ([ADR-0012](0012-personal-and-health-data.md)).

## Decyzja

1. **Pliki w prywatnym zasobniku Supabase Storage** (plan Free, projekt w regionie UE — West EU, Irlandia, przydzielonym przez Supabase przy zakładaniu), zasobnik `exercise-videos` z limitem pliku 10 MB i typem `video/mp4`. Plik ma nazwę `{mediaId}.mp4` z losowym UUID, więc nowy film nigdy nie nadpisuje starego pliku.
2. **Metadane w Firestore:** `exerciseVideos/{sha256 nazwy ćwiczenia}` z polami `exerciseName`, `mediaId`, `sizeBytes`, `durationSec`, `uploadedAt`. Identyfikator z nazwy daje najwyżej jeden film na ćwiczenie; reguły sprawdzają, że to SHA-256 pola `exerciseName`. Film pasuje do ćwiczenia o dokładnie tej samej nazwie we wszystkich szablonach i treningach. Przy migracji do `exerciseId` (etap 4) dokumenty przechodzą przez to samo mapowanie nazwa → ćwiczenie.
3. **Limity:** MP4 z obrazem H.264 (`avc1`/`avc3`), do 30 s i 10 MB; zalecane 15–20 s, 720p, bez dźwięku. Przeglądarka sprawdza plik przed wysłaniem, czytając nagłówki MP4 (`src/features/exerciseVideos/mp4.utils.ts`). Rozmiar i typ egzekwuje też zasobnik, a zapis metadanych — reguły. Filmy nie mają okresu przechowywania: zostają, dopóki administrator ich nie usunie.
4. **Bramka w funkcji Vercel `api/exercise-videos.ts`** (region `fra1`): weryfikuje token ID Firebase, czyta `owners/{uid}` i `users/{uid}` przez Admin SDK i dopiero wtedy wydaje podpisany link Supabase. `view` wymaga aktywnego konta (jak `isOwner()`), `upload` i `delete` — także roli `admin` (jak `isAdmin()`). Klucz Supabase (secret) i klucz konta serwisowego Firebase są tylko w zmiennych Vercel oznaczonych jako Sensitive; przeglądarka nie dostaje żadnego klucza Supabase.
5. **Uprawnienie do wgrywania:** rola `admin` w `users/{uid}.roles` ([ADR-0016](0016-roles-views-exercise-library.md), pkt 1), nadana ręcznie w konsoli Firebase jednemu kontu właściciela. Pozostałe konta nie widzą opcji wgrywania, a funkcja i reguły odrzucają ich zapisy.
6. **Podpisane linki:** do odtwarzania ważne 5 minut, pobierane przy każdym otwarciu filmu; link do wysłania pliku — jednorazowy, do nowej nazwy pliku. To jawne doprecyzowanie zasady „bez publicznych linków” z [ADR-0012](0012-personal-and-health-data.md), pkt 4: link działa krótko i trafia tylko do aktywnego konta.
7. **Limit wywołań i sprzątanie plików:** funkcja liczy wywołania każdego konta w `apiRateLimits/{uid}` ([ADR-0014](0014-server-functions-and-email.md), pkt 2): 60 w stałym oknie 10 minut, wspólnie dla wszystkich akcji; ponad limit odpowiada 429 z nagłówkiem `Retry-After`. Licznik zapisuje tylko funkcja przez Admin SDK, reguły odmawiają aplikacji dostępu. Zasobnik służy tylko aplikacji, która zapisuje w nim wyłącznie `{mediaId}.mp4` w katalogu głównym. Akcja `cleanup`, dostępna tylko dla roli `admin`, usuwa każdy inny plik, także w folderach (folder znika razem z ostatnim plikiem): plik bez dokumentu (plik wgrany, a zapis metadanych nieudany, albo nieusunięty plik zastąpionego filmu) oraz pliki i foldery dodane poza aplikacją, np. w panelu Supabase. Uruchamia ją przycisk „Usuń zbędne pliki” w sekcji „Administracja” w Ustawieniach, po potwierdzeniu. Akcja pomija pliki młodsze niż godzina, bo mogą należeć do trwającego wgrywania.
8. **Kolejność operacji:** przy wgrywaniu najpierw plik, potem dokument, na końcu usunięcie pliku zastąpionego filmu; przy usuwaniu najpierw plik, potem dokument. Dokument nigdy nie wskazuje brakującego pliku, a ponowienie nieudanego usunięcia kończy pracę.

Decyzja częściowo zastępuje [ADR-0004](0004-firebase-multi-user.md) (Cloud Storage dla plików) i [ADR-0009](0009-cloud-functions-aggregates.md), pkt 4, wyłącznie w zakresie filmów techniki. Zdjęcia sylwetki zostają przy dotychczasowej decyzji.

## Rozważane warianty

**Gdzie trzymać pliki**

| Wariant | Zalety | Wady |
|---|---|---|
| **Supabase Storage Free (wybrany)** | Bez karty płatniczej; 1 GB miejsca i 5 GB transferu miesięcznie wystarcza na ok. 10 filmów; podpisane linki | Drugi dostawca; projekt Free zatrzymuje się po tygodniu bez aktywności |
| Cloud Storage for Firebase | Reguły Storage obok Firestore, jeden dostawca | Wymaga planu Blaze (karta płatnicza) |
| Cloudflare R2 | Brak opłat za transfer | Wymaga karty płatniczej; podpisy S3 do zbudowania samodzielnie |
| Linki do YouTube (niepubliczne) | Zero miejsca i kodu przechowywania | Reklamy i polecane filmy w odtwarzaczu; film dostępny dla każdego z linkiem |

**Jak sprawdzać uprawnienia do plików**

| Wariant | Zalety | Wady |
|---|---|---|
| **Funkcja Vercel z Admin SDK (wybrany)** | Jedno źródło uprawnień: te same dokumenty, które czytają reguły | Każde odtworzenie to wywołanie funkcji |
| Polityki RLS Supabase z tokenem Firebase (third-party auth) | Bez własnej funkcji | RLS nie widzi `owners` ani zgody w Firestore; uprawnienia w dwóch miejscach |

**Do czego przypiąć film**

| Wariant | Zalety | Wady |
|---|---|---|
| **Do nazwy ćwiczenia (wybrany)** | Działa od razu w szablonach i historii | Zmiana nazwy ćwiczenia w szablonie odłącza film |
| Do `exerciseId` z biblioteki | Odporne na zmianę nazwy | Czeka na etap 4 |

## Konsekwencje

- Firestore ma nową kolekcję główną `exerciseVideos` z regułą i testami reguł (administrator, inne aktywne konto, obce konto, walidacja pól i identyfikatora).
- Funkcja Vercel ma testy jednostkowe (`tests/api/`) i test odczytu uprawnień na emulatorze; test E2E zastępuje funkcję i Supabase trasami w przeglądarce.
- Wdrożenie wymaga ręcznych kroków właściciela: projektu i zasobnika Supabase, zmiennych Vercel, wdrożenia reguł przed aplikacją i nadania roli `admin` ([README](../../README.md)).
- Projekt Supabase Free zatrzymany po tygodniu bez aktywności trzeba wznowić w panelu Supabase; do tego czasu filmy się nie odtwarzają (aplikacja pokazuje błąd, dziennik działa dalej).
- Filmy nie działają offline: odtworzenie wymaga sieci i ważnego linku.

## Warunek rewizji

Więcej niż jedno konto wgrywające filmy, przekroczenie limitów planu Free, zmiana planu Firebase na Blaze albo wdrożenie biblioteki ćwiczeń z `exerciseId` (wtedy przeniesienie dokumentów na identyfikator ćwiczenia).
