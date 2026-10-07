# Dziennik Treningowy — rejestr decyzji architektonicznych

Indeks decyzji. Każda decyzja ma krótki dokument ADR w [`adr/`](adr/).

## Zasady zmiany decyzji

1. Nowa decyzja lub zmiana obowiązującej powstaje jako ADR ze statusem **proponowana**. Implementacja zaczyna się po zmianie statusu na **przyjęta** przez właściciela repozytorium.
2. Przyjętego ADR nie edytujemy merytorycznie. Zmienia go nowy ADR, a stary dostaje status **zastąpiona** z numerem następcy.
3. W tej samej zmianie aktualizujemy indeks, zadania w [KNOWN_ISSUES.md](KNOWN_ISSUES.md) i [AGENTS.md](../AGENTS.md), jeśli decyzja ich dotyczy.
4. Sekcje ADR: Status, Kontekst, Decyzja, Rozważane warianty, Konsekwencje, Warunek rewizji. Limit: 150 linii.

## Decyzje

| ADR | Decyzja | Status |
|---|---|---|
| [0001](adr/0001-documentation-and-agents.md) | Dokumentacja: jeden cel na dokument, jeden fakt w jednym miejscu; wspólne instrukcje agentów w `AGENTS.md` | Przyjęta 2026-10-07 |
| [0002](adr/0002-spa-firebase.md) | SPA React + TypeScript bez własnego backendu; dane w Cloud Firestore, szkic treningu w LocalStorage | Przyjęta 2026-10-07 |
| [0003](adr/0003-owner-authentication.md) | Logowanie Google; dostęp do danych tylko dla właściciela z kolekcji `owners`; walidacja zapisów w `firestore.rules` | Przyjęta 2026-10-07 |
