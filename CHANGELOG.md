# Changelog

## 0.3.0 - 2026-11-12
- Add an English / 한국어 language menu in the header. The choice is saved in the browser; the first visit follows the browser language (Korean if it starts with "ko", otherwise English) and `<html lang>` follows the choice.
- Export files, progress files and file names are unchanged and do not depend on the language.

## 0.2.0 - 2026-11-11
- Accept a JSON array of row objects (same record schema as JSONL). The format is detected from the content, not the file extension; array rows use their 1-based position as the default id and in error messages.
- Show guidance for empty files, whitespace-only files and `[]`, and report a multi-line single JSON object as one error instead of one per line.

## 0.1.0 - 2026-11-10
- First release: static browser app (React, Vite, TypeScript) to pick the better of two responses with the keyboard.
- Reads JSONL in three shapes (`responses[]`, `response_a`/`response_b`, `chosen`/`rejected`), reports broken lines by line number.
- Random but reproducible left/right layout, quality warnings, and a left-pick rate for position bias.
- Exports TRL standard, TRL conversational, TRL KTO, and LLaMA-Factory alpaca (plus a `dataset_info.json` snippet).
- Resume from IndexedDB, with a progress JSON backup and import.
