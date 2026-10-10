# ADR-0006: Plany treningowe i ich przypisanie podopiecznemu

- **Status:** przyjęta 2026-10-10

## Kontekst

Dziś istnieją szablony pojedynczych treningów (lista nazw ćwiczeń) i plan tygodnia przypisujący szablon do dnia (`weekPlans/default_week_plan`). Trener potrzebuje planu wielotygodniowego: tygodnie → dni → ćwiczenia z zadanymi parametrami (serie, zakres powtórzeń, RIR/RPE, tempo, przerwa, uwagi). Podopieczny musi widzieć dzisiejszy trening i porównanie „zadane / wykonane”. Do rozstrzygnięcia: czy przypisany plan to kopia czy odnośnik, jak zapisać progresję i co z obecnymi szablonami.

## Decyzja

1. **Szablon planu trenera** w `coaches/{uid}/programTemplates/{id}`: tygodnie, dni, ćwiczenia z parametrami.
2. **Przypisanie = kopia** w `users/{athleteUid}/programs/{id}` z datą startu i odnośnikiem do szablonu. Zmiana szablonu nie zmienia przypisanych planów; trener może świadomie zaktualizować przypisany plan od wybranego tygodnia.
3. **Progresja zapisana wartościami** w każdym tygodniu; kreator oferuje „kopiuj tydzień z +2,5 kg / −1 RIR”, ale wynik to zwykłe wartości, które trener może poprawić.
4. **Sesja wykonana** (`sessions`) zapisuje odnośnik do dnia planu (`programId`, `week`, `day`), więc „zadane / wykonane” nie zależy od późniejszych zmian planu.
5. Obecne szablony stają się szablonami pojedynczego dnia dostępnymi dla każdego użytkownika (trening spoza planu).

## Rozważane warianty

**Przypisanie planu**

| Wariant | Zalety | Wady |
|---|---|---|
| **Kopia (wybrany)** | Historia podopiecznego stabilna; indywidualne zmiany dla jednej osoby bez wpływu na innych; reguły proste (dane u podopiecznego) | Poprawka w szablonie wymaga świadomego „rozesłania” do przypisanych planów |
| Odnośnik do szablonu | Jedna zmiana trafia do wszystkich | Zmiana w trakcie cyklu przepisuje to, co podopieczny już wykonał; personalizacja wymaga nadpisań; podopieczny musi czytać dokumenty trenera |

**Progresja**

| Wariant | Zalety | Wady |
|---|---|---|
| **Wartości per tydzień z pomocnikiem w kreatorze (wybrany)** | Działa jak Excel, który trenerzy znają; brak „magii” przy wyświetlaniu | Więcej danych w dokumencie planu |
| Reguły progresji liczone w locie | Mniej danych, zmiana reguły zmienia cały cykl | Trudne do zrozumienia i testowania; wyjątki dla pojedynczych tygodni komplikują model |

**Rozmiar dokumentu**

| Wariant | Zalety | Wady |
|---|---|---|
| **Cały plan w jednym dokumencie (wybrany na start)** | Jeden odczyt, zapis atomowy | Limit 1 MiB na dokument — wystarcza na kilkanaście tygodni po kilka dni |
| Tygodnie lub dni jako podkolekcje | Brak limitu rozmiaru | Więcej odczytów i zapisów wsadowych przy kopiowaniu |

## Konsekwencje

- `weekPlans` i plan tygodnia zastępuje widok „Dzisiaj” z przypisanego planu; użytkownik bez trenera może utworzyć własny plan tym samym kreatorem.
- Kopiowanie i aktualizacja planu to zapis wsadowy z testem reguł dla trenera z aktywną współpracą.

## Warunek rewizji

Plany przekraczające limit dokumentu albo potrzeba masowych zmian w wielu przypisanych planach naraz.
