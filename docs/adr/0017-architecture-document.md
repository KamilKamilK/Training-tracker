# ADR-0017: Opis bieżącej architektury w `docs/ARCHITECTURE.md`

- **Status:** przyjęta 2026-10-21 (właściciel zlecił dokumentację struktury aplikacji); uzupełnia tabelę rodzajów dokumentów i zasadę 3 z [ADR-0001](0001-documentation-and-agents.md)

## Kontekst

Budowa aplikacji jest rozproszona: decyzje leżą w 16 ADR, model danych w schematach Zod i regułach, a skrócony opis katalogów `src/` w `AGENTS.md`. ADR odpowiadają na pytanie „dlaczego” i nie są poprawiane po przyjęciu, więc nie opisują stanu po kolejnych zmianach. Nowa osoba albo agent musi czytać kilka ADR i kod, żeby zrozumieć, jak części współpracują. Wkrótce dojdą biblioteka ćwiczeń, funkcje Vercel i role, a wraz z nimi więcej elementów do opisania.

## Decyzja

1. **Nowy rodzaj dokumentu:** [ARCHITECTURE.md](../ARCHITECTURE.md) odpowiada na pytanie „Jak aplikacja jest zbudowana teraz?”. Opisuje części i ich odpowiedzialność, przepływ danych, model danych (ścieżka, schemat, reguła), granicę bezpieczeństwa, offline, środowiska, testy i skrypty danych.
2. **Stan bieżący, bez uzasadnień:** dokument linkuje do ADR po „dlaczego”, do [ROADMAP.md](../ROADMAP.md) po „dokąd”, a do README po polecenia.
3. **Instrukcje agentów** odsyłają do `ARCHITECTURE.md` zamiast opisywać strukturę kodu (zasada 3 z ADR-0001).
4. **Aktualizacja w tej samej zmianie:** zmiana struktury katalogów, kolekcji Firestore, przepływu danych, środowisk albo skryptów danych aktualizuje `ARCHITECTURE.md` ([AGENTS.md](../../AGENTS.md#9-dokumentacja)).

## Rozważane warianty

| Wariant | Zalety | Wady |
|---|---|---|
| **Osobny `ARCHITECTURE.md` (wybrany)** | Jeden obraz całości; ADR zostają niezmienne | Kolejny dokument do aktualizacji |
| Rozbudowa `README.md` | Jedno miejsce startowe | Limit 200 linii; miesza uruchomienie z budową |
| Opis w `AGENTS.md` | Agenci czytają go zawsze | Sprzeczne z zasadą 3 z ADR-0001; wydłuża instrukcje |
| Bez osobnego dokumentu (tylko ADR) | Nic nowego do utrzymania | Stan bieżący trzeba składać z kilku ADR i kodu |

## Konsekwencje

- `AGENTS.md` (część „Zakres repozytorium”) linkuje do `ARCHITECTURE.md`.
- Przegląd zmiany sprawdza, czy opis w `ARCHITECTURE.md` zgadza się z kodem.

## Warunek rewizji

Dokument przekracza ok. 300 linii albo rozjeżdża się z kodem mimo zasady z pkt 4. Wtedy dzielimy go na części albo generujemy fragmenty (np. model danych) ze schematów.
