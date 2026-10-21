# Dziennik Treningowy — ręczna lista kontrolna testów

**Ostatnie pełne przejście:** brak.
**Automatyzacja:** ekran logowania, brak dostępu, aktywacja konta i wycofanie zgody, sekcja 1a (bez produkcji), 2.2–2.3, 2.7–2.8, 3.3–3.6 oraz sekcja 8 (bez telefonu) są testami end-to-end w `e2e/` (`npm run test:e2e`, na zbudowanej wersji); ręcznie sprawdzamy pozostałe i całość na produkcji.
**Znane rozbieżności:** punkt z numerem KNOWN_ISSUES (np. „#1”) opisuje zachowanie docelowe, którego środowisko jeszcze nie spełnia — niepowodzenie potwierdza zgłoszony problem.
**Cel:** weryfikacja funkcji aplikacji przed wdrożeniem na Vercel lub po większych zmianach.
**Środowisko:** `npm run emulators` i `npm run dev` z `VITE_USE_EMULATORS=true` ([README](../README.md#-uruchomienie-lokalne)); przeglądarka desktopowa i widok mobilny (DevTools, szerokość 375 px).
**Konta:** konto właściciela (dokument `owners/{uid}` w Firestore, profil z zaakceptowaną zgodą w `users/{uid}`) i drugie konto bez dokumentu w `owners`.

Nowy przypadek: warunki wstępne, kroki, oczekiwany wynik.

---

## 0. Przygotowanie

- [ ] Aplikacja ładuje się bez błędów w konsoli przeglądarki

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
- [ ] Produkcja po migracji (`scripts/migrate-to-users.ts --apply`): liczba treningów w nagłówku, pomiary i plan tygodnia takie jak przed wdrożeniem

## 1a. Nawigacja

- [ ] Każda zakładka ma własny adres: Start `/`, Szablony `/templates`, Plan `/plan`, Trening `/workout`, Historia `/history`, Postępy `/progress`; aktywna zakładka jest podświetlona
- [ ] Odświeżenie strony (F5) zostawia tę samą zakładkę, także na produkcji (Vercel)
- [ ] Przycisk „wstecz” przeglądarki wraca do poprzedniej zakładki
- [ ] Nieznany adres (np. `/abc`) przenosi na Start
- [ ] Błąd wczytania lub zapisu poza formularzem (np. reguły odrzucające odczyt historii w emulatorze) → czerwony dymek w prawym dolnym rogu (na telefonie na całą szerokość u dołu), widoczny na każdej zakładce do zamknięcia „X”; błąd zapisu treningu i pomiaru zostaje przy formularzu
- [ ] Link do zakładki (np. `/history`) otwarty bez zalogowania → ekran logowania, po zalogowaniu ta sama zakładka

## 2. Start (pulpit)

- [ ] 2.1 Szybkie statystyki pokazują liczbę treningów w tym tygodniu i miesiącu oraz ostatnią wagę
- [ ] 2.2 Widżet pomiarów → „Dodaj” → okno „Nowy pomiar” z dzisiejszą datą; waga 20 i talia „abc” → komunikaty zakresu przy obu polach, nic nie zostaje zapisane
- [ ] 2.3 Poprawne wartości (także z przecinkiem, np. „82,5”) → okno się zamyka, pomiar widoczny w widżecie i w „Postępach”
- [ ] 2.4 Data z przyszłości → komunikat przy polu daty; „Anuluj” zamyka okno bez zapisu
- [ ] 2.5 Zapis pomiaru odrzucony przez Firestore → komunikat w oknie, okno pozostaje otwarte z wpisanymi wartościami
- [ ] 2.6 Kolejność pomiarów w „Postępach” nie zmienia się po wejściu na „Start”
- [ ] 2.7 Bez rozpoczętego treningu kliknięcie szablonu otwiera zakładkę „Trening” z ćwiczeniami tego szablonu
- [ ] 2.8 Trening rozpoczęty, wpisana seria, kliknięcie innego szablonu na „Start” → okno „Trwa inny trening” z nazwami obu treningów; „Wróć do treningu” (albo „X”) → zakładka „Trening” z wpisanymi wartościami; „Zacznij nowy trening” → zakładka „Trening” z ćwiczeniami nowego szablonu, bez wcześniejszych serii

## 3. Trening

- [ ] 3.1 Bez rozpoczętego treningu zakładka pokazuje stan pusty
- [ ] 3.2 Dodanie serii, wpisanie kg/powtórzeń/RIR i usunięcie serii działa dla każdego ćwiczenia; zmiana jednej serii nie zmienia innych
- [ ] 3.3 Odświeżenie strony w trakcie treningu → wpisane wartości pozostają (szkic w LocalStorage)
- [ ] 3.4 Zapis odrzucony przez Firestore (np. usunięty dokument `owners/{uid}` w emulatorze) → komunikat nad przyciskiem „Zakończ trening”, wpisane serie pozostają
- [ ] 3.5 Ponowne „Zakończ trening” po usunięciu przyczyny → przejście do „Historii”, trening na górze listy, szkic usunięty
- [ ] 3.6 Bez sieci (DevTools → Offline) „Zakończ trening” → przycisk „Zapisywanie...” jest nieaktywny, trening zostaje w zakładce; po przywróceniu sieci zapis kończy się przejściem do „Historii”, trening zapisany raz

## 4. Historia

- [ ] Lista treningów posortowana od najnowszego
- [ ] Kliknięcie treningu otwiera szczegóły z seriami; zamknięcie okna działa
- [ ] Usunięcie: anulowanie potwierdzenia nic nie zmienia; potwierdzenie usuwa trening także po odświeżeniu
- [ ] Nieudane usunięcie → komunikat nad treścią zakładki, trening pozostaje na liście

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

- [ ] Dwie karty (albo komputer i telefon) z dziennikiem: pomiar lub trening zapisany w jednej pojawia się w drugiej bez odświeżania
- [ ] Zalogowany, strona otwarta, potem bez sieci (DevTools → Offline albo tryb samolotowy w telefonie): wszystkie zakładki otwierają się i pokazują dane, także te, których jeszcze nie otwierano po zalogowaniu
- [ ] Otwarcie lub odświeżenie strony bez sieci pokazuje aplikację z danymi (#17)
- [ ] Bez sieci pomiar trafia od razu na listę, a okno pomiaru czeka z „Zapisywanie...” do powrotu sieci; po powrocie zamyka się, pomiar jest zapisany raz
- [ ] „Wyloguj” → ekran logowania; po ponownym zalogowaniu innym kontem nie widać danych poprzedniego (pamięć w przeglądarce jest czyszczona)

## 7. Postępy

- [ ] Lista „Progresja Wagi i Talii” pokazuje ostatnie pomiary w kolejności dat, z różnicą względem poprzedniego
- [ ] Kafelki „Treningi Łącznie”, „Ten Miesiąc”, „Ten Tydzień” zgadzają się z historią
