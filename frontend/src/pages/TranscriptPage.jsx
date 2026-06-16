import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { db } from "../firebase";
import useTranscript from "../hooks/useTranscript";
import QuarterSidebar from "../components/QuarterSidebar";
import TranscriptViewer from "../components/TranscriptViewer";
import AspectPanel from "../components/AspectPanel";
import { theme } from "../theme";

const QUARTER_CHRONOLOGICAL_ORDER = ["Q1_FY24", "Q2_FY24", "Q3_FY24", "Q4_FY24", "Q1_FY25", "Q2_FY25", "Q3_FY25", "Q4_FY25"];

const styles = {
  loadingPage: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bgPrimary,
    overflow: "hidden",
    paddingTop: "56px",
    boxSizing: "border-box",
  },
  loadingContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: `2px solid ${theme.colors.border}`,
    borderTopColor: theme.colors.amber,
    borderRadius: "50%",
    animation: "transcript-page-spin 0.8s linear infinite",
    boxSizing: "border-box",
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: "13px",
    lineHeight: 1.4,
    fontFamily: theme.fonts.body,
  },
  layout: {
    height: "100vh",
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: theme.colors.bgPrimary,
    minWidth: 0,
    paddingTop: "56px",
    boxSizing: "border-box",
  },
};

function normalizeCompanyInfo(data, fallbackTicker) {
  return {
    name: data?.name ?? fallbackTicker,
    sector: data?.sector ?? "unknown",
    ticker: data?.ticker ?? fallbackTicker,
  };
}

function getPriorQuarterId(quarterId) {
  const currentIndex = QUARTER_CHRONOLOGICAL_ORDER.indexOf(quarterId);

  if (currentIndex <= 0) {
    return null;
  }

  return QUARTER_CHRONOLOGICAL_ORDER[currentIndex - 1];
}

export default function TranscriptPage() {
  const navigate = useNavigate();
  const { companyId, quarterId } = useParams();
  const normalizedCompanyId = String(companyId ?? "").trim().toUpperCase();

  const [companyInfo, setCompanyInfo] = useState({ name: "", sector: "", ticker: normalizedCompanyId });
  const [quartersList, setQuartersList] = useState([]);
  const [priorScore, setPriorScore] = useState(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [isQuartersLoading, setIsQuartersLoading] = useState(true);

  const { quarterData, sentences } = useTranscript(normalizedCompanyId, quarterId);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    async function loadCompanyInfo() {
      if (!normalizedCompanyId) {
        setCompanyInfo({ name: "", sector: "", ticker: "" });
        setIsCompanyLoading(false);
        return;
      }

      try {
        setIsCompanyLoading(true);

        const response = await fetch(`https://earninglens-backend.onrender.com/api/companies/${normalizedCompanyId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Company request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!isActive) {
          return;
        }

        setCompanyInfo(normalizeCompanyInfo(data, normalizedCompanyId));
      } catch (fetchError) {
        if (!isActive || fetchError.name === "AbortError") {
          return;
        }

        setCompanyInfo({ name: normalizedCompanyId, sector: "unknown", ticker: normalizedCompanyId });
      } finally {
        if (isActive) {
          setIsCompanyLoading(false);
        }
      }
    }

    loadCompanyInfo();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [normalizedCompanyId]);

  useEffect(() => {
    let isActive = true;

    async function loadQuarterData() {
      if (!normalizedCompanyId) {
        setQuartersList([]);
        setPriorScore(null);
        setIsQuartersLoading(false);
        return;
      }

      try {
        setIsQuartersLoading(true);

        const quartersRef = collection(db, "companies", normalizedCompanyId, "quarters");
        const [quartersSnapshot, priorQuarterSnapshot] = await Promise.all([
          getDocs(quartersRef),
          (async () => {
            const priorQuarterId = getPriorQuarterId(quarterId);

            if (!priorQuarterId) {
              return null;
            }

            return getDoc(doc(db, "companies", normalizedCompanyId, "quarters", priorQuarterId));
          })(),
        ]);

        if (!isActive) {
          return;
        }

        const nextQuarters = quartersSnapshot.docs.map((quarterDoc) => ({
          quarterId: quarterDoc.id,
          ...quarterDoc.data(),
        }));

        setQuartersList(nextQuarters);
        setPriorScore(priorQuarterSnapshot?.exists() ? priorQuarterSnapshot.data()?.overall_score ?? null : null);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setQuartersList([]);
        setPriorScore(null);
      } finally {
        if (isActive) {
          setIsQuartersLoading(false);
        }
      }
    }

    loadQuarterData();

    return () => {
      isActive = false;
    };
  }, [normalizedCompanyId, quarterId]);

  const selectedQuarter = useMemo(() => {
    return quartersList.find((quarter) => quarter.quarterId === quarterId) ?? null;
  }, [quarterId, quartersList]);

  const sortedQuarters = useMemo(() => {
    return [...quartersList].sort((a, b) => {
      const aIdx = QUARTER_CHRONOLOGICAL_ORDER.indexOf(a.quarterId);
      const bIdx = QUARTER_CHRONOLOGICAL_ORDER.indexOf(b.quarterId);
      return bIdx - aIdx;
    });
  }, [quartersList]);

  const aspectScores = quarterData?.aspect_scores ?? selectedQuarter?.aspect_scores ?? {};
  const peerRelativeScore = quarterData?.peer_relative_score ?? selectedQuarter?.peer_relative_score ?? null;
  const peerRelativeLabel = quarterData?.peer_relative_label ?? selectedQuarter?.peer_relative_label ?? null;
  const sectorAverageScore = quarterData?.sector_average_score ?? selectedQuarter?.sector_average_score ?? null;
  const qaSplit = quarterData?.qa_split ?? selectedQuarter?.qa_split ?? null;

  const handleSelectQuarter = (newQuarterId) => {
    if (!newQuarterId || !normalizedCompanyId) {
      return;
    }

    navigate(`/company/${normalizedCompanyId}/${newQuarterId}`);
  };

  if (isCompanyLoading || isQuartersLoading) {
    return (
      <section style={styles.loadingPage}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner} />
          <div style={styles.loadingText}>Loading...</div>
        </div>

        <style>{`\n          @keyframes transcript-page-spin {\n            from {\n              transform: rotate(0deg);\n            }\n            to {\n              transform: rotate(360deg);\n            }\n          }\n        `}</style>
      </section>
    );
  }

  return (
    <section style={styles.layout}>
      <QuarterSidebar
        companyId={companyInfo.ticker || normalizedCompanyId}
        companyName={companyInfo.name}
        sector={companyInfo.sector}
        quarters={sortedQuarters}
        selectedQuarter={quarterId}
        onSelectQuarter={handleSelectQuarter}
      />

      <TranscriptViewer
        sentences={sentences}
        quarterData={quarterData}
        companyName={companyInfo.name}
        companyId={companyInfo.ticker || normalizedCompanyId}
        quarterId={quarterId}
        priorScore={priorScore}
      />

      <AspectPanel
        aspectScores={aspectScores}
        sentences={sentences}
        overallScore={quarterData?.overall_score ?? selectedQuarter?.overall_score}
        peerRelativeScore={peerRelativeScore}
        peerRelativeLabel={peerRelativeLabel}
        sectorAverageScore={sectorAverageScore}
        qaSplit={qaSplit}
      />
    </section>
  );
}
