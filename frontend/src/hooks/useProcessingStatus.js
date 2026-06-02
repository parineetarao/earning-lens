import { useEffect, useState } from "react";
import { off, onValue, ref } from "firebase/database";
import { rtdb } from "../firebase";

const defaultStatus = {
  status: null,
  sentencesProcessed: 0,
  totalSentences: 0,
  startedAt: null,
  completedAt: null,
};

export default function useProcessingStatus(companyId, quarterId) {
  const [status, setStatus] = useState(defaultStatus.status);
  const [sentencesProcessed, setSentencesProcessed] = useState(defaultStatus.sentencesProcessed);
  const [totalSentences, setTotalSentences] = useState(defaultStatus.totalSentences);
  const [startedAt, setStartedAt] = useState(defaultStatus.startedAt);
  const [completedAt, setCompletedAt] = useState(defaultStatus.completedAt);

  useEffect(() => {
    if (!rtdb) {
      setStatus(defaultStatus.status);
      setSentencesProcessed(defaultStatus.sentencesProcessed);
      setTotalSentences(defaultStatus.totalSentences);
      setStartedAt(defaultStatus.startedAt);
      setCompletedAt(defaultStatus.completedAt);
      return undefined;
    }

    if (!companyId || !quarterId) {
      setStatus(defaultStatus.status);
      setSentencesProcessed(defaultStatus.sentencesProcessed);
      setTotalSentences(defaultStatus.totalSentences);
      setStartedAt(defaultStatus.startedAt);
      setCompletedAt(defaultStatus.completedAt);
      return undefined;
    }

    const statusRef = ref(rtdb, `processing_status/${companyId}/${quarterId}`);

    const handleValue = (snapshot) => {
      if (!snapshot.exists()) {
        setStatus(defaultStatus.status);
        setSentencesProcessed(defaultStatus.sentencesProcessed);
        setTotalSentences(defaultStatus.totalSentences);
        setStartedAt(defaultStatus.startedAt);
        setCompletedAt(defaultStatus.completedAt);
        return;
      }

      const data = snapshot.val() || {};

      setStatus(data.status ?? defaultStatus.status);
      setSentencesProcessed(data.sentencesProcessed ?? defaultStatus.sentencesProcessed);
      setTotalSentences(data.totalSentences ?? defaultStatus.totalSentences);
      setStartedAt(data.startedAt ?? defaultStatus.startedAt);
      setCompletedAt(data.completedAt ?? defaultStatus.completedAt);
    };

    onValue(statusRef, handleValue);

    return () => {
      off(statusRef, "value", handleValue);
    };
  }, [companyId, quarterId]);

  return {
    status,
    sentencesProcessed,
    totalSentences,
    startedAt,
    completedAt,
  };
}