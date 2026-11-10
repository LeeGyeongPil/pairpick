# Changelog

## 0.1.0 - 2026-11-10
- First release: static browser app (React, Vite, TypeScript) to pick the better of two responses with the keyboard.
- Reads JSONL in three shapes (`responses[]`, `response_a`/`response_b`, `chosen`/`rejected`), reports broken lines by line number.
- Random but reproducible left/right layout, quality warnings, and a left-pick rate for position bias.
- Exports TRL standard, TRL conversational, TRL KTO, and LLaMA-Factory alpaca (plus a `dataset_info.json` snippet).
- Resume from IndexedDB, with a progress JSON backup and import.
