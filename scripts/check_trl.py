"""Check that pairpick's golden export files load with Hugging Face `datasets`
and match the columns and types TRL expects.

Usage: python -I scripts/check_trl.py fixtures/expected
Prints "ALL OK" as the last line when every check passes.
"""
import json
import sys
from pathlib import Path

from datasets import Value, load_dataset


def load(path: Path):
    return load_dataset("json", data_files=str(path), split="train")


def main(folder: Path) -> None:
    from trl.data_utils import is_conversational

    # Standard preference: plain-string columns.
    std = load(folder / "trl_standard.jsonl")
    assert set(std.column_names) == {"prompt", "chosen", "rejected"}, std.column_names
    for col in ("prompt", "chosen", "rejected"):
        assert std.features[col] == Value("string"), (col, std.features[col])
    assert not is_conversational(std[0])
    print("trl_standard.jsonl", len(std), "rows", dict(std.features))

    # Conversational preference: message lists, recognized by TRL.
    conv = load(folder / "trl_conversational.jsonl")
    assert set(conv.column_names) == {"prompt", "chosen", "rejected"}, conv.column_names
    assert all(is_conversational(row) for row in conv), "TRL must see every row as conversational"
    print("trl_conversational.jsonl", len(conv), "rows, is_conversational = True")

    # KTO unpaired: boolean label.
    kto = load(folder / "trl_kto.jsonl")
    assert set(kto.column_names) == {"prompt", "completion", "label"}, kto.column_names
    assert kto.features["label"] == Value("bool"), kto.features["label"]
    assert set(kto["label"]) == {True, False}
    print("trl_kto.jsonl", len(kto), "rows, label =", kto.features["label"])

    # LLaMA-Factory alpaca preference: JSON array with four columns.
    alpaca = load(folder / "llamafactory_alpaca.json")
    assert set(alpaca.column_names) == {"instruction", "input", "chosen", "rejected"}, alpaca.column_names
    print("llamafactory_alpaca.json", len(alpaca), "rows, columns", alpaca.column_names)

    info = json.loads((folder / "dataset_info.json").read_text(encoding="utf-8"))
    entry = next(iter(info.values()))
    assert entry["ranking"] is True
    assert entry["columns"] == {
        "prompt": "instruction",
        "query": "input",
        "chosen": "chosen",
        "rejected": "rejected",
    }
    print("dataset_info.json ranking = True, columns =", entry["columns"])
    print("ALL OK")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python -I scripts/check_trl.py <folder with golden files>")
    main(Path(sys.argv[1]))
