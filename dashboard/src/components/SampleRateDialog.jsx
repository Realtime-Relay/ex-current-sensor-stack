import { SampleRateForm } from "./SampleRateForm.jsx";

/**
 * Modal shell around SampleRateForm. Closes on overlay click, Escape key,
 * Cancel, or successful submission.
 */
export function SampleRateDialog({ open, onClose, onSuccess }) {
  if (!open) return null;

  const handleSuccess = (rateMs) => {
    onClose();
    onSuccess?.(rateMs);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        background: "rgba(21,17,10,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fade-in 160ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slide-in-top 220ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      >
        <SampleRateForm open={open} onCancel={onClose} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
