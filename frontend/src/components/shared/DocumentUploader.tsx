import { useRef, useState } from "react";
import { FileText, Upload, RefreshCw, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useApplicationDocumentsQuery,
  useUploadDocumentMutation,
  useReplaceDocumentMutation,
  useDeleteDocumentMutation,
} from "@/features/documents/documents.api";

const DOCUMENT_TYPES = [
  { value: "PASSPORT_PHOTO", label: "Passport Photo" },
  { value: "AADHAAR_CARD", label: "Aadhaar Card" },
  { value: "TENTH_MARKSHEET", label: "10th Marksheet" },
  { value: "TWELFTH_MARKSHEET", label: "12th Marksheet" },
  { value: "TRANSFER_CERTIFICATE", label: "Transfer Certificate" },
  { value: "COMMUNITY_CERTIFICATE", label: "Community Certificate" },
  { value: "INCOME_CERTIFICATE", label: "Income Certificate" },
  { value: "SIGNATURE", label: "Signature" },
  { value: "ENTRANCE_SCORECARD", label: "Entrance Scorecard" },
  { value: "OTHER", label: "Other" },
];

const STATUS_ICON = {
  PENDING: Clock,
  VERIFIED: CheckCircle2,
  REJECTED: XCircle,
};

export function DocumentUploader({ applicationId, editable }: { applicationId: string; editable: boolean }) {
  const { data: documents, isLoading } = useApplicationDocumentsQuery(applicationId);
  const uploadMutation = useUploadDocumentMutation(applicationId);
  const replaceMutation = useReplaceDocumentMutation(applicationId);
  const deleteMutation = useDeleteDocumentMutation(applicationId);
  const [selectedType, setSelectedType] = useState(DOCUMENT_TYPES[0].value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate({ file, type: selectedType });
    e.target.value = "";
  };

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;
    replaceMutation.mutate({ documentId: replacingId, file });
    e.target.value = "";
    setReplacingId(null);
  };

  return (
    <div className="space-y-4">
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploadMutation.isPending}
          >
            <Upload className="mr-2 h-4 w-4" /> Upload document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleUpload}
          />
          <input
            ref={replaceInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleReplace}
          />
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading documents…</p>}

      <div className="space-y-2">
        {documents?.map((doc) => {
          const StatusIcon = STATUS_ICON[doc.status];
          return (
            <div
              key={doc._id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="overflow-hidden">
                  <p className="truncate font-medium">{doc.originalName}</p>
                  <p className="text-xs text-muted-foreground">{doc.type.replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    doc.status === "VERIFIED" && "text-emerald-600",
                    doc.status === "REJECTED" && "text-red-600",
                    doc.status === "PENDING" && "text-amber-600"
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5" /> {doc.status}
                </span>
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                  Preview
                </a>
                {editable && (
                  <>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setReplacingId(doc._id);
                        replaceInputRef.current?.click();
                      }}
                      aria-label="Replace document"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(doc._id)}
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {documents?.length === 0 && (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
