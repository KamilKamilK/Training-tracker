# ADR-0009: Cloud Functions i liczenie postępu

- **Status:** proponowana 2026-10-10 — czeka na akceptację właściciela

## Kontekst

Część operacji nie może być wykonana bezpiecznie przez klienta: zaproszenia, usunięcie konta, podsumowania dla pulpitu trenera ([ADR-0005](0005-data-model-and-access.md), [ADR-0008](0008-accounts-and-invitations.md)). Wdrożenie Cloud Functions wymaga planu Blaze (płatność za użycie, z darmowym limitem); alerty budżetu w Google Cloud ostrzegają, ale nie zatrzymują kosztów. Postęp (e1RM, rekordy, objętość tygodniowa, regularność) trzeba gdzieś liczyć.

## Decyzja (rekomendacja)

1. **Plan Blaze** z alertami budżetu (np. 5 / 20 / 50 zł miesięcznie) i regionem `europe-central2` dla funkcji.
2. **Funkcje w TypeScript w tym repozytorium** (`functions/`), z testami na emulatorze; wspólne czyste funkcje obliczeń (`src/domain/` lub pakiet współdzielony) używane w kliencie i funkcjach.
3. **Postęp podopiecznego liczony w kliencie** z jego historii (dziesiątki–setki sesji to mało danych).
4. **Podsumowania dla trenera** (`coaches/{uid}/athletes/{athleteUid}`: ostatni trening, regularność tygodnia, ostatni pomiar, brak check-inu) utrzymywane przez funkcję wyzwalaną zapisem sesji, pomiaru lub check-inu.

## Rozważane warianty

**Funkcje serwerowe**

| Wariant | Zalety | Wady |
|---|---|---|
| **Cloud Functions na Blaze (rekomendowany)** | Ta sama platforma i uwierzytelnienie; wyzwalacze na zapisach; emulator do testów | Konto rozliczeniowe; koszt zależny od ruchu; zimny start |
| Bez funkcji, wszystko w kliencie i regułach | Brak kosztów i konta rozliczeniowego | Zaproszenia i usunięcie konta trudne lub niebezpieczne; pulpit trenera = wiele zapytań |
| Osobny serwer (np. Cloud Run, Vercel Functions z Admin SDK) | Większa swoboda technologii | Drugi sposób wdrażania i uwierzytelniania; więcej utrzymania |

**Gdzie liczyć postęp**

| Wariant | Zalety | Wady |
|---|---|---|
| **Klient dla podopiecznego, funkcja dla pulpitu trenera (rekomendowany)** | Wykresy działają offline; mało kodu serwera; trener ma szybki pulpit | Dwa miejsca użycia obliczeń — konieczny wspólny, testowany kod |
| Wszystko w funkcjach (dokumenty statystyk) | Jednakowe wyniki wszędzie, mało odczytów | Opóźnienie po zapisie; każda nowa statystyka wymaga przeliczenia historii |
| Wszystko w kliencie | Najprostsze | Pulpit trenera czyta pełne historie wszystkich podopiecznych — koszt i czas rosną z liczbą osób |

## Konsekwencje

- Hook `pre-push` i CI obejmą build i testy `functions/`.
- Koszty i liczba wywołań są monitorowane od pierwszego wdrożenia.

## Warunek rewizji

Koszt funkcji powyżej progu właściciela albo statystyki wymagające przetwarzania całej bazy (rankingi, porównania między użytkownikami).
