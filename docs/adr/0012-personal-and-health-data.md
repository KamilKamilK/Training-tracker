# ADR-0012: Dane osobowe i dane o zdrowiu (RODO)

- **Status:** proponowana 2026-10-10 — czeka na akceptację właściciela; wymaga konsultacji prawnej

## Kontekst

Aplikacja przechowuje wagę, obwody, zdjęcia sylwetki i notatki o samopoczuciu. Takie dane mogą zostać uznane za dane dotyczące zdrowia (art. 9 RODO), których przetwarzanie wymaga szczególnej podstawy, zwykle wyraźnej zgody. Gdy trener prowadzi podopiecznych w aplikacji, trzeba ustalić, kto jest administratorem danych, a kto podmiotem przetwarzającym. Ten dokument opisuje warianty techniczne i organizacyjne; nie zastępuje porady prawnej.

## Decyzja (rekomendacja)

1. **Role:** podopieczny korzystający samodzielnie — administratorem jest operator aplikacji. Współpraca z trenerem — trener jest administratorem danych swojego klienta w zakresie współpracy, operator aplikacji przetwarza je na podstawie umowy powierzenia akceptowanej przy włączeniu roli trenera. Do potwierdzenia przez prawnika.
2. **Zgody:** przy rejestracji wyraźna, osobna zgoda na przetwarzanie danych o zdrowiu (pomiary, zdjęcia, check-iny); funkcje pomiarów i zdjęć niedostępne bez niej. Akceptacja współpracy z trenerem pokazuje, jakie dane trener zobaczy.
3. **Prawa użytkownika:** eksport danych (JSON) i usunięcie konta w aplikacji ([ADR-0008](0008-accounts-and-invitations.md)); zakończenie współpracy natychmiast odcina dostęp trenera.
4. **Ochrona danych:** region UE (`europe-central2`), zdjęcia w Cloud Storage dostępne tylko przez reguły (bez publicznych linków), brak danych zdrowotnych w logach i monitoringu, kopie zapasowe z ustaloną retencją.
5. **Dokumenty przed pierwszym użytkownikiem spoza właściciela:** polityka prywatności, regulamin, wzór umowy powierzenia, rejestr czynności przetwarzania.

## Rozważane warianty

| Wariant | Zalety | Wady |
|---|---|---|
| **Pełne zgody i umowa powierzenia przed udostępnieniem (rekomendowany)** | Zgodność od pierwszego klienta; zaufanie trenerów | Koszt konsultacji prawnej; dłuższa rejestracja |
| Udostępnienie bez danych zdrowotnych (bez pomiarów i zdjęć) na start | Mniejsze ryzyko prawne, szybszy pilotaż | Mniejsza wartość dla trenera — postęp sylwetki to ważna funkcja |
| Udostępnienie bez formalności, uzupełnienie później | Najszybciej | Ryzyko kar i utraty zaufania; trudne do naprawienia wstecz dla już zebranych danych |

## Konsekwencje

- Model danych przechowuje stan i datę zgody (`users/{uid}.consents`), a reguły blokują zapis pomiarów bez zgody.
- Pilotaż z trenerami (etap 3) zaczyna się po przygotowaniu dokumentów z punktu 5.

## Warunek rewizji

Opinia prawna odmienna od założeń z punktu 1 albo rozszerzenie działalności poza UE.
