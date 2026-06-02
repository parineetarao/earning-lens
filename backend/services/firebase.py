# backend/services/firebase.py

import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()


def init_firebase() -> firestore.Client:
    """
    Initialises Firebase Admin SDK and returns a Firestore client.
    Safe to call multiple times — checks if already initialised.
    """
    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CRED_PATH")

        if cred_path and os.path.exists(cred_path):
            # Local development — use service account key file
            cred = credentials.Certificate(cred_path)
        else:
            # Render deployment — credentials inlined as environment variable
            import json
            cred_json = os.getenv("FIREBASE_CRED_JSON")
            if not cred_json:
                raise ValueError(
                    "No Firebase credentials found. Set FIREBASE_CRED_PATH "
                    "for local development or FIREBASE_CRED_JSON for deployment."
                )
            cred_dict = json.loads(cred_json)
            cred      = credentials.Certificate(cred_dict)

        firebase_admin.initialize_app(cred, {
            "databaseURL": os.getenv("FIREBASE_DATABASE_URL"),
        })

    return firestore.client()


# Module-level client — initialised once when the module is first imported
db = init_firebase()