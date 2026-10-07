# ADR-0001: Dokumentacja i instrukcje agentów

- **Status:** przyjęta 2026-10-07

## Kontekst

Repozytorium miało tylko `README.md`, który opisuje też stan nieaktualny (zapis w LocalStorage zamiast Firestore). Nad kodem pracują agenci AI (Claude Code, Codex), którzy potrzebują jednego, spójnego zestawu zasad jakości oraz miejsca na zadania i decyzje.

## Decyzja

**Każdy dokument ma jeden cel:**

| Rodzaj | Odpowiada na pytanie | Miejsce |
|---|---|---|
| Instrukcje agentów i standard jakości | Jak pracować w repozytorium? | [AGENTS.md](../../AGENTS.md); `CLAUDE.md` tylko go importuje |
| Decyzja (ADR) | Dlaczego tak? | `docs/adr/`, indeks [DECISIONS.md](../DECISIONS.md) |
| Zadania | Co zostało do zrobienia? | [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) |
| Wizja i plan rozwoju | Dokąd zmierza produkt i w jakiej kolejności? | [ROADMAP.md](../ROADMAP.md) |
| Testy manualne | Jak sprawdzić aplikację ręcznie? | [MANUAL_TESTING_CHECKLIST.md](../MANUAL_TESTING_CHECKLIST.md) |
| Referencja i uruchomienie | Jaki stack, jakie komendy? | [README.md](../../README.md) |

**Zasady:**

1. Jeden fakt w jednym miejscu — pozostałe dokumenty linkują, nie powtarzają.
2. Stan bieżący, nie historia — przebieg prac i powody zmian są w commitach.
3. Instrukcje agentów nie opisują architektury — odsyłają do ADR.
4. Limity: ADR ≤ 150 linii, `README.md` ≤ 200 linii.

## Rozważane warianty

| Wariant | Ocena |
|---|---|
| Osobne `CLAUDE.md` i `AGENTS.md` | Rozjazd treści i sprzeczne instrukcje dla różnych agentów |
| Zadania w GitHub Issues | Dla jednoosobowego projektu jeden plik w repozytorium jest prostszy i dostępny dla agentów offline |
| Kopia standardu z innego repozytorium przez skrypt synchronizacji | YAGNI — jedno repozytorium, brak drugiego odbiorcy |

## Konsekwencje

- Zmiana zasad dotyka jednego pliku (`AGENTS.md`).
- Każda zmiana zachowania aktualizuje `README.md`/`docs/` i checklistę testów w tym samym commicie.

## Warunek rewizji

Brak — zasady obowiązują do odwołania nowym ADR.
