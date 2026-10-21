# ADR-0016: Role, widoki, źródło biblioteki ćwiczeń i migracja w dwóch krokach

- **Status:** przyjęta 2026-10-11 (właściciel: CRUD trenera i edycja wyników przez podopiecznego, podział widoków, rola w `users`, free-exercise-db, kolejność prac); zakres edycji przez podopiecznego (pkt 3) do potwierdzenia przy etapie 3

## Kontekst

Trener prowadzi szablony, plany i ćwiczenia, podopieczny wykonuje plan i chce sam sprawdzać, gdzie ma lepsze wyniki, a osoba bez trenera prowadzi własny dziennik ([ADR-0005](0005-data-model-and-access.md), [ADR-0006](0006-training-programs.md)). Rolę trenera nadaje administrator ([ADR-0015](0015-accounts-roles-consent.md)). Biblioteka ćwiczeń ma zawierać prawdziwe dane od pierwszego dnia ([ADR-0007](0007-exercises-and-sets.md)). Dane leżą dziś w kolekcjach głównych z ćwiczeniem jako tekstem.

## Decyzja

1. **Role w profilu `users/{uid}`** — pole `roles` (`coach`, `admin`), bez osobnej kolekcji. Zmienia je tylko administrator: na start ręcznie w konsoli Firebase, później funkcją Vercel; reguły odrzucają zmianę `roles` przez właściciela profilu.
2. **Trener:** pełny CRUD własnych ćwiczeń, szablonów treningów i planów oraz przypisywanie planów podopiecznym. Widoki: Podopieczni, Plany, Biblioteka ćwiczeń, a gdy sam trenuje — przełącznik „Mój dziennik”.
3. **Podopieczny z trenerem:** widoki Dzisiaj, Historia, Postępy, Pomiary, Ustawienia. Edytuje swoje treningi (ciężar, powtórzenia, RIR, zamiana i dodanie ćwiczenia w treningu) i swoją kopię przypisanego planu; zmiany kopii widzi trener, szablon trenera zostaje bez zmian. Nie widzi biblioteki trenera ani jego szablonów.
4. **Konto osobiste (bez trenera):** obecne zakładki i pełny CRUD własnych szablonów, planu tygodnia i ćwiczeń z wyborem z biblioteki globalnej.
5. **Administrator:** nadawanie roli trenera i prowadzenie biblioteki globalnej.
6. **Źródło biblioteki globalnej:** [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (876 ćwiczeń, licencja Unlicense — domena publiczna). Wybór ok. 120–150 ćwiczeń z polską i angielską nazwą, partiami mięśni i sprzętem, uzupełniony o ćwiczenia z obecnych szablonów; lista przeglądana przez właściciela przed wgraniem.
7. **Migracja w dwóch krokach** (zastępuje jeden skrypt z [ADR-0007](0007-exercises-and-sets.md), pkt 3): najpierw przeniesienie dokumentów do `users/{uid}/…` bez zmiany kształtu (porównanie liczby dokumentów), potem serie liczbowe i `exerciseId` po wgraniu biblioteki. Każdy krok to skrypt Admin SDK z trybem próbnym, idempotentny (te same identyfikatory dokumentów).
8. **Dostęp nadal z listy `owners`** do czasu polityki prywatności ([ADR-0012](0012-personal-and-health-data.md), pkt 5); potem lista znika, a dostęp wynika z konta, zgody i ról.

## Rozważane warianty

**Kto edytuje treningi i plany**

| Wariant | Zalety | Wady |
|---|---|---|
| **Trener CRUD, podopieczny edytuje swoje wyniki i kopię planu (wybrany)** | Podopieczny sam porównuje wyniki i dopasowuje trening; plan trenera chroniony przez kopię | Trener musi widzieć zmiany kopii (oznaczenie „zmienione przez podopiecznego”) |
| Podopieczny tylko wpisuje wyniki | Plan zawsze zgodny z trenerem | Brak elastyczności na siłowni (zajęta maszyna, zamiana ćwiczenia) |

**Gdzie zapisać role**

| Wariant | Zalety | Wady |
|---|---|---|
| **Pole w `users/{uid}` (wybrany)** | Jedno miejsce z profilem; jeden odczyt w regułach | Reguły muszą chronić pole przed zmianą przez właściciela |
| Osobna kolekcja `roles/{uid}` | Prostsza reguła zapisu | Drugi dokument na konto, dodatkowy odczyt w regułach |
| Custom claims tokenu | Brak odczytów w regułach | Wymaga Admin SDK; zmiana widoczna po odświeżeniu tokenu |

**Źródło ćwiczeń**

| Wariant | Zalety | Wady |
|---|---|---|
| **free-exercise-db (wybrany)** | Prawdziwe dane, domena publiczna | Po angielsku — tłumaczenie nazw |
| wger.de | Część nazw po polsku | CC-BY-SA (uznanie autorstwa, ta sama licencja); nierówna jakość |
| Płatne bazy (ExerciseDB) | Zdjęcia i animacje | Koszt i ograniczenia licencji |

**Migracja**

| Wariant | Zalety | Wady |
|---|---|---|
| **Dwa kroki (wybrany)** | Każdy krok mały i łatwy do sprawdzenia; przeniesienie nie czeka na bibliotekę | Dwa uruchomienia skryptu |
| Jeden skrypt po wgraniu biblioteki | Jedno uruchomienie | Nowy model danych czeka na przegląd listy ćwiczeń; większe ryzyko błędu |

## Konsekwencje

- Testy reguł dla każdej roli: zmiana `roles` przez właściciela odrzucona, trener bez aktywnej współpracy bez dostępu, podopieczny bez dostępu do szablonów trenera.
- Kolekcje główne zostają tylko do odczytu do czasu potwierdzenia migracji przez właściciela; ich usunięcie to osobny krok.
- Szablony własne z LocalStorage przenosi do `users/{uid}/templates` aplikacja przy pierwszym uruchomieniu (dane są tylko w przeglądarce właściciela).

## Warunek rewizji

Trenerzy w pilotażu potrzebujący innego zakresu edycji przez podopiecznego albo biblioteka globalna niewystarczająca (wtedy drugie źródło z licencją do oceny).
