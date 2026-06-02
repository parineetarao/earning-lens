# inference/test_vocab.py
from vocab_tracker import compute_vocab_delta

current = """
Revenue grew strongly this quarter driven by robust volume growth.
However we face significant headwinds in our margin profile.
Input costs remain elevated and we are cautious about the near term outlook.
Competition from imports is intensifying and we are concerned about pricing.
"""

prior = """
Revenue momentum was strong with confident guidance for next year.
Margins were robust and we expect continued improvement.
The macro environment remains supportive and we are optimistic.
Volume growth was healthy across all segments.
"""

result = compute_vocab_delta(current, prior)

print("Words that INCREASED:")
for w in result["increased"]:
    print(f"  {w['word']:<15} prior={w['prior']} current={w['current']} delta=+{w['delta']}")

print()
print("Words that DECREASED:")
for w in result["decreased"]:
    print(f"  {w['word']:<15} prior={w['prior']} current={w['current']} delta={w['delta']}")