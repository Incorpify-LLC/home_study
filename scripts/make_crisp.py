import json

with open("scripts/compact_output.json") as f:
    d = json.load(f)

# Let's inspect each module's size and tighten rationales and descriptions
for m in d["modules"]:
    # Check overview words
    w = m["overview"].split()
    print(f"Mod {m['sequence']}: {len(w)} words")

