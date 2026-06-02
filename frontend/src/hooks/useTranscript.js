import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export default function useTranscript(companyId, quarterId) {
  const [quarterData, setQuarterData] = useState(null);
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companyId || !quarterId) {
      setQuarterData(null);
      setSentences([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    let isActive = true;
    let quarterLoaded = false;
    let sentencesLoaded = false;
    let unsubscribe = null;

    const markLoaded = (which) => {
      if (!isActive) {
        return;
      }

      if (which === "quarter") {
        quarterLoaded = true;
      } else if (which === "sentences") {
        sentencesLoaded = true;
      }

      if (quarterLoaded && sentencesLoaded) {
        setLoading(false);
      }
    };

    const quarterRef = doc(db, "companies", companyId, "quarters", quarterId);
    const sentencesRef = collection(db, "companies", companyId, "quarters", quarterId, "sentences");
    const sentencesQuery = query(sentencesRef, orderBy("sentence_index", "asc"));

    setLoading(true);
    setError(null);

    getDoc(quarterRef)
      .then((snapshot) => {
        if (!isActive) {
          return;
        }

        setQuarterData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        markLoaded("quarter");
      })
      .catch((fetchError) => {
        if (!isActive) {
          return;
        }

        setError(fetchError.message || "Failed to load quarter data");
        setLoading(false);
        quarterLoaded = true;
      });

    unsubscribe = onSnapshot(
      sentencesQuery,
      (snapshot) => {
        if (!isActive) {
          return;
        }

        setSentences(snapshot.docs.map((sentenceDoc) => ({ id: sentenceDoc.id, ...sentenceDoc.data() })));
        markLoaded("sentences");
      },
      (snapshotError) => {
        if (!isActive) {
          return;
        }

        setError(snapshotError.message || "Failed to subscribe to sentences");
        setLoading(false);
        sentencesLoaded = true;
      }
    );

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [companyId, quarterId]);

  return {
    quarterData,
    sentences,
    loading,
    error,
  };
}