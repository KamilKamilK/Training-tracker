# Dziennik Treningowy — ręczna lista kontrolna testów

**Ostatnie pełne przejście:** brak. Scenariusze 1, 2.2–2.3 i 3.4–3.6 przeszły automatycznie w przeglądarce na emulatorach 2026-10-07.
**Znane rozbieżności:** punkt z numerem KNOWN_ISSUES (np. „#1”) opisuje zachowanie docelowe, którego środowisko jeszcze nie spełnia — niepowodzenie potwierdza zgłoszony problem.
**Cel:** weryfikacja funkcji aplikacji przed wdrożeniem na Vercel lub po większych zmianach.
**Środowisko:** `npm run emulators` i `npm run dev` z `VITE_USE_EMULATORS=true` ([README](../README.md#-uruchomienie-lokalne)); przeglądarka desktopowa i widok mobilny (DevTools, szerokość 375 px).
**Konta:** konto właściciela (dokument `owners/{uid}` w Firestore) i drugie konto bez tego dokumentu.

Nowy przypadek: warunki wstępne, kroki, oczekiwany wynik.

---

## 0. Przygotowanie

- [ ] Aplikacja ładuje się bez błędów w konsoli przeglądarki

## 1. Logowanie i dostęp

- [ ] Niezalogowany użytkownik widzi ekran „Zaloguj przez Google”, bez danych
- [ ] Zamknięcie okna logowania Google bez wyboru konta → ekran logowania bez komunikatu błędu
- [ ] Konto spoza `owners` → „Konto … nie ma dostępu do tego dziennika” i przycisk „Wyloguj”
- [ ] Konto właściciela → dziennik z zakładką „Start”; w nagłówku adres e-mail i „Wyloguj”
- [ ] „Wyloguj” w nagłówku → powrót do ekranu logowania; odświeżenie strony nie loguje ponownie
- [ ] Produkcja: właściciel widzi swoje dane, inne konto — ekran braku dostępu (#1)

## 2. Start (pulpit)

- [ ] 2.1 Szybkie statystyki pokazują liczbę treningów w tym tygodniu i miesiącu oraz ostatnią wagę
- [ ] 2.2 Widżet pomiarów → „Dodaj” → okno „Nowy pomiar” z dzisiejszą datą; waga 20 i talia „abc” → komunikaty zakresu przy obu polach, nic nie zostaje zapisane
- [ ] 2.3 Poprawne wartości (także z przecinkiem, np. „82,5”) → okno się zamyka, pomiar widoczny w widżecie i w „Postępach”
- [ ] 2.4 Data z przyszłości → komunikat przy polu daty; „Anuluj” zamyka okno bez zapisu
- [ ] 2.5 Zapis pomiaru odrzucony przez Firestore → komunikat w oknie, okno pozostaje otwarte z wpisanymi wartościami
- [ ] 2.6 Kolejność pomiarów w „Postępach” nie zmienia się po wejściu na „Start”
- [ ] 2.7 Kliknięcie szablonu rozpoczyna trening z jego ćwiczeniami w zakładce „Trening”

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

- [ ] Nowy szablon bez nazwy lub bez ćwiczeń → komunikat i brak zapisu
- [ ] Nowy szablon z nazwą i ćwiczeniami → widoczny na liście i w siatce na „Start”
- [ ] Edycja, duplikacja („(kopia)”) i usunięcie szablonu własnego działają; szablon domyślny można tylko zduplikować
- [ ] Zmiana kategorii i poziomu w formularzu zostaje zapisana
- [ ] Szablony własne pozostają po odświeżeniu strony

## 6. Plan tygodnia

- [ ] Przypisanie szablonu do dnia zapisuje plan; po odświeżeniu przypisanie pozostaje
- [ ] Usunięcie treningu z dnia i „Wyczyść” pytają o potwierdzenie i działają
- [ ] Nieudany zapis planu → komunikat nad nagłówkiem planu (bez okna `alert`)
- [ ] Statystyki planu (dni aktywne/odpoczynku) zgadzają się z przypisaniami

## 7. Postępy

- [ ] Lista „Progresja Wagi i Talii” pokazuje ostatnie pomiary w kolejności dat, z różnicą względem poprzedniego
- [ ] Kafelki „Treningi Łącznie”, „Ten Miesiąc”, „Ten Tydzień” zgadzają się z historią
