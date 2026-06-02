# inference/finbert_scorer.py

import nltk
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from config import FINBERT_MODEL_NAME, FINBERT_CACHE_DIR, MIN_SENTENCE_WORDS

# Download the NLTK punkt tokeniser data on first run.
# quiet=True suppresses the download progress message.
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)


def load_finbert() -> tuple:
    """
    Loads the FinBERT tokeniser and model from HuggingFace.

    What goes in: nothing
    What comes out: (tokenizer, model) — both are kept in memory for the
                    duration of the pipeline run

    Why load once and pass around:
        Loading a transformer model takes ~8 seconds and ~1.5GB of RAM.
        If you loaded it inside score_sentences(), every call would reload it.
        The pipeline calls load_finbert() once at startup and passes the
        returned objects to score_sentences().

    Why cache_dir:
        Without an explicit cache_dir, HuggingFace writes to ~/.cache/huggingface
        which is hidden and hard to find. Setting it to inference/models/ keeps
        everything visible and makes it easy to delete and re-download if needed.
    """
    print(f"Loading FinBERT from {FINBERT_CACHE_DIR} (downloads on first run)...")

    tokenizer = AutoTokenizer.from_pretrained(
        FINBERT_MODEL_NAME,
        cache_dir=FINBERT_CACHE_DIR
    )

    model = AutoModelForSequenceClassification.from_pretrained(
        FINBERT_MODEL_NAME,
        cache_dir=FINBERT_CACHE_DIR
    )

    # Set model to evaluation mode.
    # This disables dropout layers that are only needed during training.
    # Without this, you get slightly different results on each run.
    model.eval()

    print("FinBERT loaded successfully.")
    return tokenizer, model


def score_sentences(
    full_text: str,
    tokenizer,
    model
) -> list[dict]:
    """
    Splits transcript text into sentences and scores each with FinBERT.

    What goes in:
        full_text: the entire transcript as a single string
        tokenizer: the FinBERT tokenizer from load_finbert()
        model: the FinBERT model from load_finbert()

    What comes out:
        A list of dicts, one per sentence, each with these keys:
        {
            "text": "Revenue grew 12% year on year driven by volume gains.",
            "sentiment": "positive",   # one of: positive, negative, neutral
            "confidence": 0.94,        # float 0.0–1.0
            "sentence_index": 0        # position in the transcript
        }

    Why torch.no_grad():
        During inference (prediction), you do not need to compute gradients.
        Gradients are only needed during training for backpropagation.
        torch.no_grad() disables gradient computation, reducing memory usage
        by ~50% and speeding up inference.
    """
    # Tokenise full text into sentences using NLTK.
    sentences = nltk.sent_tokenize(full_text)

    # Filter out sentences too short to carry meaningful sentiment.
    # "Thank you." / "Operator." / "Yes." are noise.
    sentences = [
        s for s in sentences
        if len(s.split()) >= MIN_SENTENCE_WORDS
    ]

    print(f"Scoring {len(sentences)} sentences with FinBERT...")

    # FinBERT label mapping.
    # The model outputs three logits: index 0=positive, 1=negative, 2=neutral.
    # This matches the order in the model's config.json label2id field.
    label_map = {0: "positive", 1: "negative", 2: "neutral"}

    results = []
    batch_size = 16

    # Process sentences in batches of 16.
    # range(0, total, batch_size) gives: 0, 16, 32, 48, ...
    for batch_start in range(0, len(sentences), batch_size):
        batch = sentences[batch_start: batch_start + batch_size]

        # Tokenise the batch.
        # padding=True: adds padding tokens so all sentences in the batch
        #               are the same length (required for batched inference).
        # truncation=True: cuts sentences longer than 512 tokens (FinBERT's limit).
        # return_tensors="pt": returns PyTorch tensors, not lists.
        inputs = tokenizer(
            batch,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        )

        with torch.no_grad():
            # Forward pass through the model.
            # outputs.logits shape: (batch_size, 3)
            # Each row is [logit_positive, logit_negative, logit_neutral]
            outputs = model(**inputs)

        # Convert logits to probabilities using softmax.
        # dim=1 means softmax is applied across the three class columns,
        # not across the batch rows.
        probabilities = torch.softmax(outputs.logits, dim=1)

        # For each sentence in the batch, find the highest probability class.
        for i, sentence in enumerate(batch):
            probs = probabilities[i]

            # argmax returns the index of the highest value.
            predicted_class = torch.argmax(probs).item()
            confidence = probs[predicted_class].item()
            sentiment = label_map[predicted_class]

            results.append({
                "text": sentence,
                "sentiment": sentiment,
                "confidence": round(confidence, 4),
                "sentence_index": batch_start + i
            })

        # Progress indicator: print every 50 sentences.
        processed = min(batch_start + batch_size, len(sentences))
        if processed % 50 == 0 or processed == len(sentences):
            print(f"  Scored {processed} / {len(sentences)} sentences")

    return results