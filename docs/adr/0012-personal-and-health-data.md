# ADR-0012: Dane osobowe i dane o zdrowiu (RODO)

- **Status:** przyjęta 2026-10-10 (właściciel: zgody dobrowolne, zrozumiałe, udostępnianie tylko własnemu trenerowi); założenia o rolach do potwierdzenia przez prawnika

## Kontekst

Aplikacja przechowuje wagę, obwody, zdjęcia sylwetki i notatki o samopoczuciu. Takie dane mogą zostać uznane za dane dotyczące zdrowia (art. 9 RODO), których przetwarzanie wymaga szczególnej podstawy, zwykle wyraźnej zgody. Gdy trener prowadzi podopiecznych w aplikacji, trzeba ustalić, kto jest administratorem danych, a kto podmiotem przetwarzającym. Ten dokument opisuje warianty techniczne i organizacyjne; nie zastępuje porady prawnej.

## Decyzja

1. **Role:** podopieczny korzystający samodzielnie — administratorem jest operator aplikacji. Współpraca z trenerem — trener jest administratorem danych swojego klienta w zakresie współpracy, operator aplikacji przetwarza je na podstawie umowy powierzenia akceptowanej przy włączeniu roli trenera. Do potwierdzenia przez prawnika.
2. **Zgody — dobrowolne i zrozumiałe:**
   - Osobna zgoda na zapisywanie danych o zdrowiu (waga, obwody, check-iny, w przyszłości zdjęcia), opisana prostym językiem; nie jest zaznaczona domyślnie i nie jest warunkiem korzystania z aplikacji — bez niej działa dziennik treningów, a pomiary są wyłączone.
   - Udostępnienie danych trenerowi to osobna decyzja przy akceptacji zaproszenia: ekran wymienia, które dane zobaczy ten jeden trener (imię i adres trenera), i że nikt inny ich nie zobaczy.
   - Każdą zgodę można w ustawieniach wycofać w każdej chwili: wycofanie udostępnienia kończy współpracę i natychmiast odcina dostęp trenera; wycofanie zgody na dane o zdrowiu blokuje ich zapis i proponuje usunięcie zapisanych pomiarów.
3. **Prawa użytkownika:** eksport danych (JSON) i usunięcie konta w aplikacji ([ADR-0008](0008-accounts-and-invitations.md)).
4. **Ochrona danych:** region UE (`europe-central2`), brak danych zdrowotnych w logach, kopie zapasowe z ustaloną retencją; zdjęcia sylwetki dopiero z Cloud Storage na planie Blaze ([ADR-0009](0009-cloud-functions-aggregates.md)), dostępne wyłącznie przez reguły, bez publicznych linków.
5. **Dokumenty przed pierwszym użytkownikiem spoza właściciela:** polityka prywatności, regulamin, wzór umowy powierzenia, rejestr czynności przetwarzania.

## Rozważane warianty

| Wariant | Zalety | Wady |
|---|---|---|
| **Pełne zgody i umowa powierzenia przed udostępnieniem (wybrany)** | Zgodność od pierwszego klienta; zaufanie trenerów | Koszt konsultacji prawnej; dłuższa rejestracja |
| Udostępnienie bez danych zdrowotnych (bez pomiarów i zdjęć) na start | Mniejsze ryzyko prawne, szybszy pilotaż | Mniejsza wartość dla trenera — postęp sylwetki to ważna funkcja |
| Udostępnienie bez formalności, uzupełnienie później | Najszybciej | Ryzyko kar i utraty zaufania; trudne do naprawienia wstecz dla już zebranych danych |

## Konsekwencje

- Model danych przechowuje stan, datę i wersję treści każdej zgody (`users/{uid}.consents`); reguły blokują zapis pomiarów bez zgody na dane o zdrowiu, a odczyt danych podopiecznego przez trenera — bez aktywnej, zaakceptowanej współpracy.
- Pilotaż z trenerami (etap 3) zaczyna się po przygotowaniu dokumentów z punktu 5.

## Warunek rewizji

Opinia prawna odmienna od założeń z punktu 1 albo rozszerzenie działalności poza UE.
