# Dziennik Treningowy — ręczna lista kontrolna testów

**Ostatnie pełne przejście:** brak.
**Automatyzacja:** ekran logowania, brak dostępu, aktywacja konta i wycofanie zgody, sekcja 1a (bez produkcji i ręcznego odsłuchu czytnikiem ekranu), 2.2–2.3, 2.7–2.9, 2.11, 3.3–3.6, edycja i usuwanie z sekcji 4 oraz wybrane przypadki sekcji 8 (synchronizacja kart, przechowanie zapisu offline, wylogowanie i szybkie wczytanie przy pozostawionej dzierżawie) są testami end-to-end w `e2e/` (`npm run test:e2e`, na zbudowanej wersji); ręcznie sprawdzamy pozostałe i całość na produkcji.
**Znane rozbieżności:** punkt z numerem KNOWN_ISSUES (np. „#1”) opisuje zachowanie docelowe, którego środowisko jeszcze nie spełnia — niepowodzenie potwierdza zgłoszony problem.
**Cel:** weryfikacja funkcji aplikacji przed wdrożeniem na Vercel lub po większych zmianach.
**Środowisko:** `npm run emulators` i `npm run dev` z `VITE_USE_EMULATORS=true` ([README](../README.md#-uruchomienie-lokalne)); przeglądarka desktopowa i widok mobilny (DevTools, szerokość 375 px).
**Konta:** konto właściciela (dokument `owners/{uid}` w Firestore, profil z zaakceptowaną zgodą w `users/{uid}`) i drugie konto bez dokumentu w `owners`.

Nowy przypadek: warunki wstępne, kroki, oczekiwany wynik.

## Kiedy i co sprawdzać

| Kiedy | Zakres | Gdzie |
|---|---|---|
| Przed wdrożeniem większej zmiany | Cała lista; punkty z testów end-to-end można pominąć, gdy `npm run test:e2e` przeszedł. Po przejściu wpisz datę w „Ostatnie pełne przejście” | Emulatory |
| Po każdym wdrożeniu | Test dymny poniżej (ok. 10 minut) | Produkcja, komputer i telefon |
| Po zmianie jednego obszaru | Sekcja tego obszaru i test dymny | Emulatory, potem produkcja |

**Test dymny na produkcji.** Na produkcji zapis sprawdzaj prawdziwym treningiem lub pomiarem; przypadki z celowo błędnymi danymi wykonuj na emulatorach.

- [ ] Logowanie kontem właściciela otwiera dziennik bez błędów w konsoli; liczba treningów w nagłówku, ostatnie pomiary, plan tygodnia i szablony są takie jak przed wdrożeniem
- [ ] Odświeżenie strony (F5) na zakładce innej niż Start zostawia tę zakładkę i dane
- [ ] Na telefonie wszystkie zakładki otwierają się i są czytelne przy szerokości ekranu
- [ ] Przy najbliższym treningu: „Zakończ trening” przenosi do „Historii”, trening jest na górze listy i widać go na drugim urządzeniu bez odświeżania

---

## 0. Przygotowanie

- [ ] Aplikacja ładuje się bez błędów w konsoli przeglądarki
- [ ] Warunki: zainstalowane zależności, Java i Chromium dla Playwright. Uruchom `npm run build`, następnie `npm run test:e2e` → build nie ostrzega o plikach większych niż 500 kB, test limitu rozmiaru przechodzi, a testy logowania, zapisu danych i nawigacji działają na zbudowanej aplikacji bez błędów inicjalizacji modułów

## 1. Logowanie i dostęp

- [ ] Niezalogowany użytkownik widzi ekran z zakładkami „Zaloguj” i „Zarejestruj” oraz przyciskiem „Kontynuuj z Google”, bez danych
- [ ] Rejestracja: niepoprawny e-mail, hasło niespełniające zasad (8 znaków, wielka i mała litera, cyfra) albo różne hasła → komunikaty przy polach, konto nie powstaje; ikona oka pokazuje i ukrywa hasło
- [ ] Rejestracja z poprawnymi danymi → ekran „Potwierdź adres …”; e-mail z linkiem przychodzi po polsku (sprawdź spam); bez kliknięcia linku „Potwierdziłem adres” pokazuje, że adres nie jest potwierdzony; „Wyślij link ponownie” wysyła nową wiadomość
- [ ] Po kliknięciu linku i „Potwierdziłem adres” → ekran braku dostępu (konto spoza `owners`)
- [ ] Logowanie z błędnym hasłem i z nieistniejącym adresem → ten sam komunikat „Nieprawidłowy e-mail lub hasło.”
- [ ] „Nie pamiętasz hasła?” → komunikat „Jeśli konto z tym adresem istnieje…” także dla nieistniejącego adresu; link z e-maila pozwala ustawić nowe hasło, które działa przy logowaniu
- [ ] Wiele nieudanych logowań z rzędu → komunikat „Zbyt wiele prób…”
- [ ] Zamknięcie okna logowania Google bez wyboru konta → ekran logowania bez komunikatu błędu
- [ ] Konto spoza `owners` → „Konto … nie ma dostępu do tego dziennika” i przycisk „Wyloguj”
- [ ] Konto właściciela bez profilu → ekran „Aktywuj konto” z polem „Imię” (dla Google wypełnionym nazwą konta) i niezaznaczoną zgodą na dane o zdrowiu; bez imienia albo bez zaznaczenia zgody → komunikaty przy polach, konto pozostaje nieaktywne
- [ ] Zaznaczenie zgody i „Aktywuj konto” → dziennik z zakładką „Start”; po odświeżeniu ekran aktywacji się nie pokazuje
- [ ] Konto właściciela → dziennik z zakładką „Start”; w nagłówku adres e-mail, „Ustawienia” i „Wyloguj”
- [ ] „Ustawienia” (`/settings`) → adres e-mail, imię z możliwością zmiany („Zapisz” → „Zapisano.”, zmiana zostaje po odświeżeniu), treść zgody z datą udzielenia i wersją
- [ ] „Wycofaj zgodę” → okno z opisem skutków; „Anuluj” nic nie zmienia; potwierdzenie → ekran „Aktywuj konto”, także po odświeżeniu; ponowna zgoda przywraca dziennik z wcześniejszymi danymi, bez komunikatów błędu wczytywania na żadnej zakładce
- [ ] „Wyloguj” w nagłówku → powrót do ekranu logowania; odświeżenie strony nie loguje ponownie
- [ ] Produkcja: właściciel widzi swoje dane po aktywacji konta, inne konto — ekran braku dostępu
- [ ] Produkcja po usunięciu kolekcji sprzed migracji: warunki — aktywne konto właściciela i dane w `users/{uid}/…`; otwórz Historię, Postępy i Plan, potem odśwież każdą zakładkę → te same treningi, pomiary i plan tygodnia, bez błędów wczytywania

## 1a. Nawigacja

- [ ] Każda zakładka ma własny adres: Start `/`, Szablony `/templates`, Plan `/plan`, Trening `/workout`, Historia `/history`, Postępy `/progress`; aktywna zakładka jest podświetlona
- [ ] Odświeżenie strony (F5) zostawia tę samą zakładkę, także na produkcji (Vercel)
- [ ] Przycisk „wstecz” przeglądarki wraca do poprzedniej zakładki
- [ ] Nieznany adres (np. `/abc`) przenosi na Start
- [ ] Błąd wczytania lub zapisu poza formularzem (np. reguły odrzucające odczyt historii w emulatorze) → czerwony dymek w prawym dolnym rogu (na telefonie na całą szerokość u dołu), widoczny na każdej zakładce do zamknięcia „X”; błąd zapisu treningu i pomiaru zostaje przy formularzu
- [ ] Link do zakładki (np. `/history`) otwarty bez zalogowania → ekran logowania, po zalogowaniu ta sama zakładka
- [ ] Warunki: zalogowany właściciel, klawiatura i czytnik ekranu. Na Starcie otwórz „Dodaj” klawiszem Enter → czytnik rozpoznaje dialog „Nowy pomiar”, fokus jest na przycisku „Zamknij”; Tab i Shift+Tab pomijają aplikację w tle (mogą przejść do paska przeglądarki). Escape zamyka okno i przywraca fokus na „Dodaj”; powtórz zamknięcie przyciskiem „Zamknij” i „Anuluj”
- [ ] Warunki: właściciel, zapisany trening. Otwórz jego „Podgląd” w Historii oraz „Wycofaj zgodę” w Ustawieniach → każde okno ma nazwę z tytułu, fokus trafia do środka; Escape wraca do przycisku otwierającego bez usunięcia danych i wycofania zgody. Sprawdź też okno pomiaru na telefonie przy szerokości 375 px → treść mieści się na ekranie i przewija

## 2. Start (pulpit)

- [ ] 2.1 Szybkie statystyki pokazują liczbę treningów w tym tygodniu i miesiącu oraz ostatnią wagę
- [ ] 2.2 Widżet pomiarów → „Dodaj” → okno „Nowy pomiar” z dzisiejszą datą; waga 20 i talia „abc” → komunikaty zakresu przy obu polach, nic nie zostaje zapisane
- [ ] 2.3 Poprawne wartości (także z przecinkiem, np. „82,5”) → okno się zamyka, pomiar widoczny w widżecie i w „Postępach”
- [ ] 2.4 Data z przyszłości → komunikat przy polu daty; „Anuluj” zamyka okno bez zapisu
- [ ] 2.5 Zapis pomiaru odrzucony przez Firestore → komunikat w oknie, okno pozostaje otwarte z wpisanymi wartościami
- [ ] 2.6 Kolejność pomiarów w „Postępach” nie zmienia się po wejściu na „Start”
- [ ] 2.7 Bez rozpoczętego treningu kliknięcie szablonu otwiera zakładkę „Trening” z ćwiczeniami tego szablonu
- [ ] 2.8 Trening rozpoczęty, wpisana seria, kliknięcie innego szablonu na „Start” → okno „Trwa inny trening” z nazwami obu treningów; „Wróć do treningu” (albo „X”) → zakładka „Trening” z wpisanymi wartościami; „Zacznij nowy trening” → zakładka „Trening” z ćwiczeniami nowego szablonu, bez wcześniejszych serii
- [ ] 2.9 Warunki: właściciel, zapisany pomiar. „Edytuj pomiar” na Starcie → formularz zawiera zapisaną datę, wagę i talię; „Anuluj” nie zmienia danych. Popraw datę, wagę (także z przecinkiem) i talię, zapisz, odśwież → jeden poprawiony wpis, aktualne statystyki i „Postępy”
- [ ] 2.10 Warunki: więcej niż pięć pomiarów. „Pokaż wszystkie pomiary” → także starsze wpisy mają przyciski edycji i usuwania; popraw najstarszy i odśwież → korekta pozostaje
- [ ] 2.11 Warunki: zapisany pomiar. „Usuń pomiar” → okno z datą; „Anuluj” zostawia wpis; potwierdzenie usuwa go także po odświeżeniu. Przy odrzuconym usunięciu w emulatorze → błąd w oknie, można ponowić, dane na serwerze pozostają
- [ ] 2.12 Warunki: bez rozpoczętego treningu, klawiatura i czytnik ekranu. Na „Start” przejdź Tabem do karty szablonu → widoczny fokus, czytnik ogłasza przycisk z nazwą szablonu i opisem (czas, liczba ćwiczeń, „Ostatnio”); Enter albo Spacja otwiera zakładkę „Trening” z ćwiczeniami tego szablonu

## 3. Trening

- [ ] 3.1 Bez rozpoczętego treningu zakładka pokazuje stan pusty
- [ ] 3.2 Dodanie serii, wpisanie kg/powtórzeń/RIR i usunięcie serii działa dla każdego ćwiczenia; zmiana jednej serii nie zmienia innych
- [ ] 3.3 Odświeżenie strony w trakcie treningu → wpisane wartości pozostają (szkic w LocalStorage)
- [ ] 3.4 Zapis odrzucony przez Firestore (np. usunięty dokument `owners/{uid}` w emulatorze) → komunikat nad przyciskiem „Zakończ trening”, wpisane serie pozostają
- [ ] 3.5 Ponowne „Zakończ trening” po usunięciu przyczyny → przejście do „Historii”, trening na górze listy, szkic usunięty
- [ ] 3.6 Bez sieci (DevTools → Offline) „Zakończ trening” → przycisk „Zapisywanie...” jest nieaktywny, trening zostaje w zakładce; po przywróceniu sieci zapis kończy się przejściem do „Historii”, trening zapisany raz
- [ ] 3.7 Warunki: rozpoczęty trening z dodaną serią, telefon (albo DevTools, widok dotykowy 375 px) i czytnik ekranu. Dotknięcie pola kg i RIR otwiera klawiaturę numeryczną z separatorem dziesiętnym, pola powtórzeń — klawiaturę numeryczną; wiersz serii z „✕” mieści się w karcie ćwiczenia bez przewijania w bok. Czytnik ogłasza pola jako „Ciężar (kg)”, „Powtórzenia” i „RIR” z numerem serii i nazwą ćwiczenia, a „✕” jako „Usuń serię N” z nazwą ćwiczenia; to samo w oknie „Edytuj trening” w Historii

## 4. Historia

- [ ] Lista treningów posortowana od najnowszego
- [ ] Kliknięcie treningu otwiera szczegóły z seriami; zamknięcie okna działa
- [ ] Usunięcie: anulowanie potwierdzenia nic nie zmienia; potwierdzenie usuwa trening także po odświeżeniu
- [ ] Warunki: zapisany trening, emulator odrzuca usunięcie. Potwierdź usunięcie → komunikat w oknie potwierdzenia, dane na serwerze pozostają; po przywróceniu reguł ponów → okno zamyka się, trening znika
- [ ] Warunki: zapisany trening z seriami i notatką. „Edytuj trening” → popraw kg/powtórzenia/RIR, dodaj i usuń serię, zmień notatki, „Anuluj” → zapisany trening bez zmian. Ponów i „Zapisz zmiany”, odśwież, otwórz podgląd → nowe serie i notatki; data oraz liczba treningów bez zmian
- [ ] Warunki: edycja zapisanego treningu, emulator odrzuca zapis. „Zapisz zmiany” → błąd w formularzu, wartości pozostają; przywróć reguły, ponów → korekta zapisana pod tym samym wpisem
- [ ] Warunki: rozpoczęty inny trening z wpisaną serią. Popraw lub usuń zapisany trening z Historii, odśwież i przejdź do „Trening” → bieżący szkic i jego serie pozostają

## 5. Szablony

- [ ] Nowy szablon z nazwą krótszą niż 3 znaki albo bez wypełnionego ćwiczenia → komunikaty przy polu nazwy i pod listą ćwiczeń, szablon nie zostaje zapisany
- [ ] Puste pola ćwiczeń są pomijane przy zapisie; nazwa zapisuje się bez spacji na początku i końcu
- [ ] Nowy szablon z nazwą i ćwiczeniami → widoczny na liście i w siatce na „Start”
- [ ] Edycja, duplikacja („(kopia)”) i usunięcie szablonu własnego działają; szablon domyślny można tylko zduplikować
- [ ] Zmiana kategorii i poziomu w formularzu zostaje zapisana
- [ ] Formularz szablonu: ikona wybierana z listy emoji, kolor karty z listy próbek kolorów (nazwa po najechaniu); wybrana opcja ma białą ramkę, a nowy szablon ma tę ikonę i kolor na liście
- [ ] Edycja szablonu zapisanego wcześniej z kolorem lub ikoną spoza listy → pierwsza opcja „Obecny: …” jest zaznaczona, zapis bez zmiany ich nie zmienia
- [ ] Szablony własne pozostają po odświeżeniu strony i są widoczne w innej przeglądarce po zalogowaniu (zapis w Firestore)
- [ ] Pierwsze uruchomienie nowej wersji w przeglądarce z szablonami zapisanymi wcześniej lokalnie → te szablony są na liście i zostają po wyczyszczeniu danych przeglądarki

## 6. Plan tygodnia

- [ ] Przypisanie szablonu do dnia zapisuje plan; po odświeżeniu przypisanie pozostaje
- [ ] Usunięcie treningu z dnia i „Wyczyść” pytają o potwierdzenie i działają
- [ ] Nieudany zapis planu → komunikat nad nagłówkiem planu (bez okna `alert`)
- [ ] Statystyki planu (dni aktywne/odpoczynku) zgadzają się z przypisaniami

## 8. Dane na żywo i praca offline

- [ ] Warunki: konto właściciela, sieć dostępna. Otwórz dwie karty dziennika, dodaj pomiar w pierwszej, odśwież drugą i dodaj w niej następny pomiar → oba pomiary są widoczne w obu kartach, druga karta działa także po odświeżeniu przy zajętej pamięci IndexedDB
- [ ] Jedna karta dziennika: zalogowany, strona otwarta, potem bez sieci (DevTools → Offline albo tryb samolotowy w telefonie): wszystkie zakładki otwierają się i pokazują dane, także te, których jeszcze nie otwierano po zalogowaniu
- [ ] Warunki: zalogowany właściciel, jedna karta, sieć dostępna. Odśwież dziennik wielokrotnie, także od razu po jego pojawieniu się → dane są widoczne w ciągu 5 sekund w środowisku lokalnym; bez wielosekundowego oczekiwania na poprzednią kartę
- [ ] Warunki: właściciel, tylko jedna otwarta karta dziennika. Wyłącz sieć, dodaj pomiar, poczekaj na „Zapisywanie...”, zamknij okno pomiaru i kartę. Przywróć sieć i otwórz dziennik w tej samej przeglądarce → pomiar zostaje wysłany raz i pozostaje widoczny po odświeżeniu
- [ ] Warunki: pamięć IndexedDB utworzona przez wersję z obsługą wielu kart, z pomiarem czekającym offline. Zamknij starą wersję, otwórz nową po przywróceniu sieci w tej samej przeglądarce → stare dane pozostają, oczekujący pomiar wysyła się raz, bez czyszczenia pamięci
- [ ] Warunki: pierwsza karta dziennika pozostaje otwarta, druga działa z siecią. Wyłącz sieć i dodaj pomiar w drugiej → jest widoczny lokalnie; po zamknięciu drugiej karty przed powrotem sieci pomiar nie jest trwale zachowany. To zaakceptowane ograniczenie [ADR-0018](adr/0018-single-tab-persistence.md); do pracy offline używaj jednej karty
- [ ] Warunki: zbudowana aplikacja na HTTPS albo localhost (`npm run preview` z buildem emulatorowym według README), właściciel zalogowany online, widoczny zapisany pomiar i komunikat „Pliki aplikacji są gotowe do pracy bez sieci”. Rozpocznij trening, wpisz serię, zamknij kartę, odłącz sieć i otwórz `/workout` → konto nadal zalogowane, wpisana seria pozostaje. Odśwież i przejdź na „Start” oraz „Szablony” → zapisany pomiar i szablony są widoczne bez sieci
- [ ] Warunki: otwarta zbudowana aplikacja z rozpoczętym treningiem i wpisaną serią; na hostingu udostępniono nowy build. Otwórz drugą kartę pod tym samym adresem → komunikat o nowej wersji, brak samoczynnego przeładowania treningu. „Później” pozwala dalej wpisywać serie; ponowne otwarcie strony pokazuje komunikat. „Odśwież” wczytuje nową wersję, a wpisane serie szkicu pozostają; sprawdź także widok telefonu 375 px
- [ ] Jedna karta dziennika: bez sieci pomiar trafia od razu na listę, a okno pomiaru czeka z „Zapisywanie...” do powrotu sieci; po powrocie zamyka się, pomiar jest zapisany raz
- [ ] „Wyloguj” → ekran logowania; po ponownym zalogowaniu innym kontem nie widać danych poprzedniego (pamięć w przeglądarce jest czyszczona)
- [ ] Trening rozpoczęty, wpisana seria, „Wyloguj” → okno „Wylogować się?”; „Anuluj” zostawia trening z wartościami; „Wyloguj i usuń trening” → ekran logowania; po zalogowaniu innym kontem zakładka „Trening” pokazuje stan pusty

## 7. Postępy

- [ ] Lista „Progresja Wagi i Talii” pokazuje ostatnie pomiary w kolejności dat, z różnicą względem poprzedniego
- [ ] Kafelki „Treningi Łącznie”, „Ten Miesiąc”, „Ten Tydzień” zgadzają się z historią
