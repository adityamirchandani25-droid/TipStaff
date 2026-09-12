"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Users } from "lucide-react";
import { removeCompanyWorker } from "@/lib/actions/company";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { CompanyWorker } from "@/components/company/types";

export function WorkerRoster({ workers }: { workers: CompanyWorker[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(worker: CompanyWorker) {
    if (!confirm(`Remove ${worker.user.name} from your company? They'll be taken off the map immediately.`)) {
      return;
    }
    setPendingId(worker.id);
    setError(null);
    const result = await removeCompanyWorker(worker.id);
    setPendingId(null);
    if (!result.ok) {
      setError(result.error ?? "Couldn’t remove that worker.");
      return;
    }
    router.refresh();
  }

  if (workers.length === 0) {
    return (
      <div className="ts-worker-empty">
        <Users size={34} />
        <h3>No workers yet</h3>
        <p>Add your first worker with the form above.</p>
      </div>
    );
  }

  return (
    <div className="ts-roster">
      {error && <p role="alert" className="ts-roster-error">{error}</p>}
      {workers.map((worker) => (
        <article key={worker.id} className="ts-roster-row">
          <span className={`ts-roster-dot${worker.isOnline ? " is-online" : ""}`} aria-hidden="true" />
          <div>
            <strong>{worker.user.name}</strong>
            <p>
              {worker.user.email}
              {worker.user.phone ? ` · ${worker.user.phone}` : ""}
            </p>
          </div>
          <span className="ts-roster-category">{worker.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}</span>
          <span className={`ts-roster-status status-${worker.approvalStatus.toLowerCase()}`}>
            {worker.isOnline ? "online" : worker.approvalStatus.toLowerCase()}
          </span>
          <button
            type="button"
            onClick={() => handleRemove(worker)}
            disabled={pendingId === worker.id}
            aria-label={`Remove ${worker.user.name}`}
            title="Remove worker"
          >
            <Trash2 size={16} />
          </button>
        </article>
      ))}
    </div>
  );
}
