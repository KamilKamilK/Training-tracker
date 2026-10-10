# ADR-0009: Plan Firebase i liczenie postępu

- **Status:** przyjęta 2026-10-10 (właściciel: zostajemy na darmowym planie Spark)

## Kontekst

Cloud Functions (operacje po stronie serwera) wymagają planu Blaze — płatności za użycie z darmowym limitem; alerty budżetu ostrzegają, ale nie zatrzymują kosztów. Zaproszenia, usuwanie konta i pulpit trenera da się zbudować bez funkcji ([ADR-0005](0005-data-model-and-access.md), [ADR-0008](0008-accounts-and-invitations.md)). Postęp (e1RM, rekordy, objętość, regularność) trzeba gdzieś liczyć.

## Decyzja

1. **Plan Spark, bez Cloud Functions.** Bezpieczeństwo zapewniają Firebase Authentication i reguły Firestore.
2. **Postęp liczony w przeglądarce** z historii użytkownika — także offline; trener liczy postęp podopiecznego z jego danych po odczycie.
3. **Wspólne, czyste funkcje obliczeń** w `src/` z testami jednostkowymi, aby przy przejściu na funkcje serwerowe użyć tego samego kodu.
4. **Bez Cloud Storage na planie Spark:** zgodnie z warunkami Firebase domyślny zasobnik Cloud Storage wymaga planu Blaze, więc zdjęcia sylwetki czekają na zmianę planu.

## Rozważane warianty

| Wariant | Zalety | Wady |
|---|---|---|
| **Spark, bez funkcji (wybrany)** | Zero kosztów i konta rozliczeniowego | Złożone reguły (zaproszenia); pulpit trenera to zapytania per podopieczny; brak zdjęć sylwetki |
| Blaze z Cloud Functions i alertami budżetu | Prostsze reguły; podsumowania dla trenera; Cloud Storage dla zdjęć | Karta płatnicza, możliwe koszty przy dużym ruchu |
| Osobny serwer (np. Cloud Run) | Swoboda technologii | Drugi system do utrzymania; też wymaga rozliczeń |

## Konsekwencje

- Każda operacja zmieniająca cudze dane (współpraca, zaproszenie) ma regułę z walidacją i testy reguł dla każdej ścieżki.
- Zdjęcia sylwetki ([ADR-0012](0012-personal-and-health-data.md)) i automatyczne powiadomienia trenera są poza zakresem do zmiany planu.

## Warunek rewizji

Zdjęcia sylwetki, pulpit trenera zbyt wolny przy odczycie per podopieczny, wysyłka e-maili z aplikacji albo rozliczenia z trenerami — wtedy plan Blaze z budżetem i alertami.
