import re
import spacy

nlp = spacy.load("en_core_web_sm")

EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")


def extract_entities(text: str) -> dict:
    doc = nlp(text[:100000])

    entities = {
        "people": set(),
        "organizations": set(),
        "locations": set(),
        "dates": set(),
    }

    label_map = {
        "PERSON": "people",
        "ORG": "organizations",
        "GPE": "locations",
        "DATE": "dates",
    }

    for ent in doc.ents:
        category = label_map.get(ent.label_)
        if category:
            entities[category].add(ent.text.strip())

    return {k: sorted(v) for k, v in entities.items()}


def detect_pii(text: str) -> dict:
    emails_found = EMAIL_PATTERN.findall(text)
    phones_found = PHONE_PATTERN.findall(text)

    doc = nlp(text[:100000])
    people_found = list({ent.text.strip() for ent in doc.ents if ent.label_ == "PERSON"})

    pii_detected = bool(emails_found or phones_found or people_found)

    return {
        "pii_detected": pii_detected,
        "emails_found_count": len(emails_found),
        "phones_found_count": len(re.findall(PHONE_PATTERN, text)),
        "names_found_count": len(people_found),
    }


def mask_pii(text: str) -> str:
    masked_text = EMAIL_PATTERN.sub("[EMAIL REDACTED]", text)
    masked_text = PHONE_PATTERN.sub("[PHONE REDACTED]", masked_text)

    doc = nlp(masked_text[:100000])
    person_names = sorted({ent.text for ent in doc.ents if ent.label_ == "PERSON"}, key=len, reverse=True)

    for name in person_names:
        masked_text = masked_text.replace(name, "[NAME REDACTED]")

    return masked_text