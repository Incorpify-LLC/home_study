import json

with open("scripts/output.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Module 2 Q4 refinement:
for q in data["modules"][0]["questions"]:
    if q["id"] == "xii-goodwill-abnormal-adjustment":
        q["prompt"] = "A firm reported a net profit of ₹1,50,000 for the year ended 31st March 2026. This included an abnormal loss on fire of ₹30,000, interest on non-trade investments of ₹12,000, and an unrecorded annual insurance premium of ₹8,000 to be accounted for in the future. Calculate the adjusted normal business profit for goodwill valuation in rupees."
        q["answer"] = {"value": 160000, "tolerance": 0}
        q["rationale"] = "Adjusted normal business profit = Reported net profit + Abnormal loss on fire − Non-trade investment interest − Recurring annual insurance premium = ₹1,50,000 + ₹30,000 − ₹12,000 − ₹8,000 = ₹1,60,000."

# Module 4 Q1 refinement:
for q in data["modules"][2]["questions"]:
    if q["id"] == "xii-retirement-gaining-ratio":
        q["prompt"] = "L, M, and N were partners sharing profits in the ratio 5:3:2. M retires, and L and N decide to share future profits in the ratio 3:2. Calculate L's gaining share as a fraction, expressed as a decimal (e.g. 0.10)."
        q["answer"] = {"value": 0.1, "tolerance": 0.001}
        q["rationale"] = "L's old share = 5/10. L's new share = 3/5 = 6/10. L's gaining share = New share − Old share = 6/10 − 5/10 = 1/10 = 0.1."

# Save updated JSON
with open("scripts/output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated and verified scripts/output.json successfully.")
