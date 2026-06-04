import { Save } from "lucide-react";
import { useState } from "react";

interface Props {
  analysis: unknown;
  onSave: (parsedJson: unknown) => void;
  isSaving?: boolean;
}

export function NoticeAnalysisReview({ analysis, onSave, isSaving }: Props) {
  const [json, setJson] = useState(JSON.stringify(analysis, null, 2));
  const [error, setError] = useState("");

  return (
    <section className="card grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">공지 분석 결과</h2>
        <button
          className="btn-primary"
          disabled={isSaving}
          onClick={() => {
            try {
              setError("");
              onSave(JSON.parse(json));
            } catch {
              setError("JSON 형식을 확인해 주세요.");
            }
          }}
        >
          <Save size={16} />
          저장
        </button>
      </div>
      {error && <div className="text-sm font-semibold text-red-600">{error}</div>}
      <textarea
        className="field min-h-[320px] font-mono text-xs"
        value={json}
        onChange={(event) => setJson(event.target.value)}
      />
    </section>
  );
}

