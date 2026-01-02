'use client';

interface DeleteModalProps {
  templateName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({
  templateName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>

        <h2 className="modal-title">Delete Template</h2>
        <p className="modal-text">
          Are you sure you want to delete <strong>{templateName}</strong>? This action
          cannot be undone and the template will be permanently removed from the
          repository.
        </p>

        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
