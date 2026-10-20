import json

with open("scripts/compact_output.json") as f:
    d = json.load(f)

# Let's see the character length of each field
total_chars = 0
for m in d["modules"]:
    ov = len(m["overview"])
    kp = sum(len(x) for x in m["key_points"])
    we = len(m["worked_example"]["prompt"]) + sum(len(x) for x in m["worked_example"]["steps"]) + len(m["worked_example"]["answer"])
    pa = len(m["practice_advice"])
    qs = 0
    for q in m["questions"]:
        qs += len(q["prompt"]) + len(q["rationale"])
        if "options" in q:
            qs += sum(len(o["label"]) for o in q["options"])
    m_total = ov + kp + we + pa + qs
    total_chars += m_total
    print(f"Mod {m['sequence']}: ov={ov}, kp={kp}, we={we}, pa={pa}, qs={qs} -> mod_content={m_total}")

print("Total content chars:", total_chars)
raw_json = json.dumps(d)
print("Raw JSON chars:", len(raw_json))
