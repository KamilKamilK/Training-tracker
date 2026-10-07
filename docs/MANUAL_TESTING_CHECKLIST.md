# Dziennik Treningowy — ręczna lista kontrolna testów

**Ostatnie pełne przejście:** brak.
**Znane rozbieżności:** punkt z numerem KNOWN_ISSUES (np. „#2”) opisuje zachowanie docelowe, którego kod jeszcze nie spełnia — niepowodzenie potwierdza zgłoszony błąd.
**Cel:** weryfikacja funkcji aplikacji przed wdrożeniem na Vercel lub po większych zmianach.
**Środowisko:** `npm run dev` z `.env` wskazującym testowy projekt Firebase; przeglądarka desktopowa i widok mobilny (DevTools, szerokość 375 px).

Nowy przypadek: warunki wstępne, kroki, oczekiwany wynik.

---

## 0. Przygotowanie

- [ ] Aplikacja ładuje się bez błędów w konsoli przeglądarki
- [ ] Po załadowaniu znika wskaźnik ładowania i widać zakładkę „Start”

## 1. Start (pulpit)

- [ ] Szybkie statystyki pokazują liczbę treningów w tym tygodniu i miesiącu oraz ostatnią wagę
- [ ] Kliknięcie szablonu w siatce rozpoczyna trening i przenosi jego ćwiczenia do zakładki „Trening”
- [ ] Widżet pomiarów → „Dodaj”: poprawna data, waga i talia → pomiar widoczny w widżecie i w „Postępach”
- [ ] Widżet pomiarów → „Dodaj”: anulowanie lub wartość nieliczbowa → nic nie zostaje zapisane
- [ ] Kolejność pomiarów w „Postępach” nie zmienia się po wejściu na „Start” (#4)

## 2. Trening

- [ ] Bez rozpoczętego treningu zakładka pokazuje stan pusty
- [ ] Dodanie serii, wpisanie kg/powtórzeń/RIR i usunięcie serii działa dla każdego ćwiczenia
- [ ] Odświeżenie strony w trakcie treningu → wpisane wartości pozostają (szkic w LocalStorage)
- [ ] „Zakończ trening” → przejście do „Historii”, trening na górze listy, szkic usunięty
- [ ] Zakończenie treningu bez sieci (DevTools → Offline) → trening zostaje w zakładce, widoczny komunikat błędu (#2)

## 3. Historia

- [ ] Lista treningów posortowana od najnowszego
- [ ] Kliknięcie treningu otwiera szczegóły z seriami; zamknięcie modala działa
- [ ] Usunięcie: anulowanie potwierdzenia nic nie zmienia; potwierdzenie usuwa trening także po odświeżeniu

## 4. Szablony

- [ ] Nowy szablon bez nazwy lub bez ćwiczeń → komunikat i brak zapisu
- [ ] Nowy szablon z nazwą i ćwiczeniami → widoczny na liście i w siatce na „Start”
- [ ] Edycja, duplikacja („(kopia)”) i usunięcie szablonu własnego działają; szablon domyślny można tylko zduplikować
- [ ] Szablony własne pozostają po odświeżeniu strony

## 5. Plan tygodnia

- [ ] Przypisanie szablonu do dnia zapisuje plan; po odświeżeniu przypisanie pozostaje
- [ ] Usunięcie treningu z dnia i „Wyczyść plan” pytają o potwierdzenie i działają
- [ ] Statystyki planu (dni aktywne/odpoczynku) zgadzają się z przypisaniami

## 6. Postępy

- [ ] Wykres „Progresja Wagi i Talii” pokazuje pomiary w kolejności dat
- [ ] Kafelki „Treningi Łącznie”, „Ten Miesiąc”, „Ten Tydzień” zgadzają się z historią

## 7. Bezpieczeństwo danych

- [ ] Żądanie do Firestore bez zalogowania jest odrzucane (#1)
