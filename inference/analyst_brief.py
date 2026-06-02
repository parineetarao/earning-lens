# inference/analyst_brief.py

from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
import time


def _build_fallback_brief(
    company_name:  str,
    quarter_id:    str,
    overall:       dict,
    aspect_scores: dict,
    split_scores:  dict,
    prior_overall: dict | None,
) -> str:
    """
    Builds a data-driven fallback brief from computed scores when
    the Groq API is unavailable. Deterministic and always accurate.
    """
    score = overall["overall_score"]
    total = overall["total_sentences"]
    pos   = overall["positive_count"]
    neg   = overall["negative_count"]

    if score >= 0.65:
        tone = "constructive"
    elif score >= 0.55:
        tone = "cautiously positive"
    elif score >= 0.45:
        tone = "mixed"
    elif score >= 0.35:
        tone = "cautious"
    else:
        tone = "notably bearish"

    if prior_overall:
        change    = overall["overall_score"] - prior_overall["overall_score"]
        direction = "improved" if change > 0 else "deteriorated"
        qoq       = (
            f"Overall tone {direction} from "
            f"{prior_overall['overall_score']:.2f} last quarter to "
            f"{score:.2f} this quarter (change: {change:+.2f})."
        )
    else:
        qoq = (
            f"Overall sentiment scored {score:.2f} across {total} sentences "
            f"({pos} positive, {neg} negative)."
        )

    sorted_aspects = sorted(
        aspect_scores.items(),
        key=lambda x: x[1]["score"],
        reverse=True
    )
    strongest = sorted_aspects[0]
    weakest   = sorted_aspects[-1]

    if split_scores["boundary_found"]:
        gap    = split_scores["gap"]
        qa_str = (
            f"Prepared remarks scored {split_scores['prepared_score']:.2f} "
            f"versus {split_scores['qa_score']:.2f} in the Q&A session "
            f"(gap: {gap:+.2f})."
        )
        if gap > 0.15:
            qa_str += (
                " The meaningful gap between scripted and unscripted "
                "tone warrants attention."
            )
    else:
        qa_str = "Q&A boundary was not detected in this transcript."

    guidance_score = aspect_scores.get("guidance", {}).get("score", 0.5)
    if guidance_score < 0.40:
        guidance_str = (
            f"Guidance language was weak at {guidance_score:.2f} — "
            f"watch for further deterioration next quarter."
        )
    elif guidance_score > 0.65:
        guidance_str = (
            f"Guidance language was confident at {guidance_score:.2f}."
        )
    else:
        guidance_str = (
            f"Guidance sentiment was neutral at {guidance_score:.2f}."
        )

    para1 = (
        f"Management tone for {company_name} in {quarter_id} was {tone} "
        f"with an overall sentiment score of {score:.2f} across {total} "
        f"sentences. {qoq} "
        f"{strongest[0].capitalize()} was the strongest aspect at "
        f"{strongest[1]['score']:.2f}, while {weakest[0]} was the "
        f"weakest at {weakest[1]['score']:.2f}."
    )

    para2 = (
        f"{qa_str} {guidance_str} "
        f"Across the five tracked aspects, scores ranged from "
        f"{weakest[1]['score']:.2f} ({weakest[0]}) to "
        f"{strongest[1]['score']:.2f} ({strongest[0]}). "
        f"Monitor {weakest[0]} language in the next quarter for signs "
        f"of recovery or continued pressure."
    )

    return f"{para1}\n\n{para2}"


def _build_prompt(
    company_name:   str,
    quarter_id:     str,
    overall:        dict,
    aspect_scores:  dict,
    split_scores:   dict,
    vocab_delta:    dict,
    prior_overall:  dict | None,
) -> str:
    """
    Builds the detailed prompt sent to Groq.
    Designed to produce interpretive, insight-driven briefs rather than
    number recitations. Forces the model to reason about what the data
    means for investors, not just what the numbers are.
    """
    # Format aspect scores
    aspect_lines = []
    for aspect, scores in aspect_scores.items():
        pos_pct = round(scores['positive'] / max(scores['positive'] + scores['negative'] + scores['neutral'], 1) * 100)
        neg_pct = round(scores['negative'] / max(scores['positive'] + scores['negative'] + scores['neutral'], 1) * 100)
        aspect_lines.append(
            f"  {aspect.upper():<12} score={scores['score']:.2f}  "
            f"positive={pos_pct}%  negative={neg_pct}%  "
            f"sentences={scores['positive'] + scores['negative'] + scores['neutral']}"
        )
    aspects_str = "\n".join(aspect_lines)

    # Format vocab delta with explicit framing
    increased_words = ", ".join(
        f"'{w['word']}' (+{w['delta']}x)"
        for w in vocab_delta.get("increased", [])[:6]
    )
    decreased_words = ", ".join(
        f"'{w['word']}' (-{abs(w['delta'])}x)"
        for w in vocab_delta.get("decreased", [])[:6]
    )

    # Quarter over quarter
    if prior_overall:
        change       = overall["overall_score"] - prior_overall["overall_score"]
        direction    = "IMPROVED" if change > 0 else "DETERIORATED"
        magnitude    = "sharply" if abs(change) > 0.10 else "marginally" if abs(change) < 0.05 else "meaningfully"
        qoq_line     = (
            f"Tone {direction} {magnitude}: "
            f"{prior_overall['overall_score']:.2f} → {overall['overall_score']:.2f} "
            f"(Δ {change:+.2f})"
        )
    else:
        qoq_line = "First quarter on record — no prior quarter comparison available."

    # QA split
    if split_scores["boundary_found"]:
        gap      = split_scores["gap"]
        gap_flag = "LARGE GAP — perception management signal" if gap > 0.15 else "gap within normal range"
        qa_line  = (
            f"Prepared={split_scores['prepared_score']:.2f} "
            f"({split_scores['prepared_count']} sentences) vs "
            f"Q&A={split_scores['qa_score']:.2f} "
            f"({split_scores['qa_count']} sentences) | "
            f"Gap={gap:+.2f} [{gap_flag}]"
        )
    else:
        qa_line = "Q&A boundary not detected."

    # Identify the most deteriorated aspect vs prior
    worst_aspect    = min(aspect_scores.items(), key=lambda x: x[1]["score"])
    best_aspect     = max(aspect_scores.items(), key=lambda x: x[1]["score"])
    guidance_score  = aspect_scores.get("guidance", {}).get("score", 0.5)
    margins_score   = aspect_scores.get("margins",  {}).get("score", 0.5)
    revenue_score   = aspect_scores.get("revenue",  {}).get("score", 0.5)

    prompt = f"""You are a seasoned sell-side equity research analyst at a top-tier Indian brokerage covering {company_name}. You have just reviewed the FinBERT sentence-level sentiment analysis of their {quarter_id} earnings call transcript. Your job is to write an internal analyst note — sharp, specific, and actionable — for a portfolio manager who has 30 seconds to read it before a client call.

=== SENTIMENT ANALYSIS DATA ===

COMPANY: {company_name}
QUARTER: {quarter_id}

OVERALL:
  Score: {overall['overall_score']:.2f} / 1.00  (0.5 = neutral, <0.4 = bearish, >0.6 = constructive)
  Sentences: {overall['total_sentences']} total  |  {overall['positive_count']} positive  |  {overall['negative_count']} negative  |  {overall['neutral_count']} neutral
  Quarter-on-quarter: {qoq_line}

ASPECT BREAKDOWN:
{aspects_str}

PREPARED REMARKS vs Q&A SESSION:
  {qa_line}

VOCABULARY SHIFT vs PRIOR QUARTER:
  Words used MORE this quarter: {increased_words or 'insufficient prior data'}
  Words used LESS this quarter: {decreased_words or 'insufficient prior data'}

=== CONTEXTUAL BENCHMARKS FOR YOUR ANALYSIS ===

Use these benchmarks to frame your interpretation:
- An aspect score below 0.40 is distinctly bearish — management is expressing clear concern
- An aspect score above 0.65 is distinctly constructive — management is expressing confidence
- A prepared-vs-QA gap above 0.15 indicates management is more defensive under questioning than in scripted remarks — a credibility signal
- A quarter-on-quarter drop of more than 0.08 in overall score is a meaningful deterioration
- If guidance sentiment is below margins sentiment, management sees the future as worse than the present — a forward-looking red flag
- Vocabulary that disappears (decreased words) is often more revealing than vocabulary that appears — what management stops saying matters
- If revenue sentiment is strong but margins sentiment is weak, the company is growing but not profitably — a margin squeeze pattern

=== SPECIFIC SIGNALS TO CHECK AND COMMENT ON ===

1. Guidance vs reality gap: Guidance score is {guidance_score:.2f}, margins score is {margins_score:.2f}, revenue score is {revenue_score:.2f}. Does this suggest management sees deterioration ahead even if current results look acceptable?
2. Weakest aspect: {worst_aspect[0].upper()} scored {worst_aspect[1]['score']:.2f}. Is this a one-quarter blip or a structural concern?
3. Strongest aspect: {best_aspect[0].upper()} scored {best_aspect[1]['score']:.2f}. Is this holding up the overall narrative?
4. Vocabulary shift: What does the change in language — words appearing and disappearing — tell you about where management anxiety is concentrated?
5. Q&A gap: If the gap is large, what does this say about management's confidence in the scripted narrative versus their answers under pressure?

=== WRITING INSTRUCTIONS ===

Write exactly two paragraphs. Total length: 160 to 220 words.

MANDATORY RULES — violating any of these makes the brief unusable:
1. You MUST include the actual score numbers in your brief. Every interpretive claim must be anchored with the specific score. Example: "Margin language was distinctly defensive — the margins aspect scored 0.38, the weakest of all five dimensions and well below the 0.40 bearish threshold." Never make a claim without the supporting number.
2. You MUST include the quarter-on-quarter change with exact figures. Example: "Overall sentiment deteriorated from 0.57 last quarter to 0.48 this quarter, a drop of 0.09 points."
3. You MUST reference the prepared remarks vs Q&A gap with exact numbers if the boundary was detected.
4. You MUST write in third person institutional voice. Never use "I", "my", or "we". Write as "this analysis suggests", "the data indicates", "management's language implies."
5. You MUST NOT use bullet points, headers, or markdown of any kind.

Paragraph 1 — What happened this quarter:
Interpret the overall tone and the most important aspect-level signals. Lead with the overall score and quarter-on-quarter change. Then identify the two or three most important aspect signals — both the strongest and weakest — with their exact scores. Translate the vocabulary shift into meaning: if 'headwinds' increased and 'confident' decreased, say what that implies about where management anxiety is concentrated. Be specific about which aspects are under pressure and what that means for this company in this sector.

Paragraph 2 — What to watch next quarter:
Open with the prepared remarks vs Q&A gap and what it signals about management credibility. Then identify the single most important forward-looking signal — guidance sentiment, the weakest aspect trend, or the vocabulary trajectory — whichever is most meaningful. State the exact score threshold that would represent a recovery or further deterioration. End with one concrete sentence telling the portfolio manager what a change in that signal would mean for their position."""

    return prompt


def generate_brief(
    company_name:   str,
    quarter_id:     str,
    overall:        dict,
    aspect_scores:  dict,
    split_scores:   dict,
    vocab_delta:    dict,
    prior_overall:  dict | None = None,
) -> str:
    """
    Calls Groq and returns a two-paragraph analyst brief.
    Falls back to a computed brief if the API fails for any reason.

    Reliability layers:
        1. Groq works normally  → LLM-generated interpretive brief
        2. Response too short   → computed fallback
        3. API error / timeout  → computed fallback
        4. No API key           → computed fallback
    """
    # Always build fallback first — costs nothing, always available
    fallback = _build_fallback_brief(
        company_name, quarter_id, overall,
        aspect_scores, split_scores, prior_overall
    )

    if not GROQ_API_KEY:
        print("  ⚠ No Groq API key — using computed brief")
        return fallback

    try:
        client = Groq(api_key=GROQ_API_KEY)

        prompt = _build_prompt(
            company_name, quarter_id, overall,
            aspect_scores, split_scores, vocab_delta, prior_overall
        )

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior equity research analyst at a top Indian brokerage. "
                        "You write sharp, specific, insight-driven internal notes. "
                        "You never recite numbers — you interpret what they mean. "
                        "You have strong views and express them directly. "
                        "Your notes are read by portfolio managers with limited time."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=500,
        )

        brief = response.choices[0].message.content.strip()

        # Sanity check — if response is too short, use fallback
        if len(brief.split()) < 80:
            print("  ⚠ Groq response too short — using computed brief")
            return fallback

        print(f"  ✓ Analyst brief generated ({len(brief.split())} words)")
        return brief

    except Exception as e:
        error_str = str(e)

        # Handle rate limiting gracefully — wait and retry once
        if "rate_limit" in error_str.lower() or "429" in error_str:
            print(f"  ⚠ Groq rate limit hit — waiting 60 seconds before retry")
            time.sleep(60)
            try:
                client   = Groq(api_key=GROQ_API_KEY)
                response = client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a senior equity research analyst. "
                                "Write sharp, specific, insight-driven internal notes."
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=500,
                )
                brief = response.choices[0].message.content.strip()
                if len(brief.split()) >= 80:
                    print(f"  ✓ Analyst brief generated on retry ({len(brief.split())} words)")
                    return brief
            except Exception:
                pass

        print(f"  ✗ Groq API error: {e} — using computed brief")
        return fallback