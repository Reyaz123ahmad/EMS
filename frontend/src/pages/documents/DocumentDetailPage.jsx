import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDocument, useVerifyDocument, useRejectDocument, useDeleteDocument } from '../../hooks/useDocuments.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';

export function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useDocument(id);

  const verifyMutation = useVerifyDocument();
  const rejectMutation = useRejectDocument();
  const deleteMutation = useDeleteDocument();

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const doc = data?.data?.document;

  if (!doc) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Document Not Found</h2>
        <Link to="/documents">
          <Button variant="outline">Back to Documents</Button>
        </Link>
      </div>
    );
  }

  const handleVerify = async () => {
    try {
      await verifyMutation.mutateAsync({ id, data: {} });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({ id, data: { reason: rejectReason } });
      setIsRejectModalOpen(false);
      setRejectReason('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/documents');
    } catch (err) {
      console.error(err);
    }
  };

  const isImage = doc.fileUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.fileUrl);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/documents" className="hover:text-white transition-colors">Documents</Link>
            <span>/</span>
            <span className="text-slate-200">{doc.title || doc.fileName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{doc.title || doc.fileName}</h1>
        </div>

        <div className="flex items-center gap-3">
          {doc.fileUrl && (
            <a href={doc.fileUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="border-slate-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download / Open
              </Button>
            </a>
          )}

          {doc.status === 'PENDING' && (
            <>
              <Button
                onClick={handleVerify}
                isLoading={verifyMutation.isPending}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Approve & Verify
              </Button>
              <Button
                onClick={() => setIsRejectModalOpen(true)}
                size="sm"
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Reject
              </Button>
            </>
          )}

          <Button
            onClick={() => setIsDeleteModalOpen(true)}
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-base font-semibold text-white">Metadata</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Status</span>
              <span className="font-semibold text-slate-200">{doc.status}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Type</span>
              <span className="font-mono text-slate-300">{doc.type}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">File Name</span>
              <span className="font-mono text-xs text-slate-300 break-all">{doc.fileName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Uploaded At</span>
              <span className="text-slate-300">{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '—'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-base font-semibold text-white">Employee</h3>
          {doc.employee ? (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Name</span>
                <Link to={`/employees/${doc.employee.id}`} className="text-blue-400 hover:underline font-medium">
                  {doc.employee.firstName} {doc.employee.lastName}
                </Link>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Email</span>
                <span className="text-slate-300 font-mono text-xs">{doc.employee.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Employee Code</span>
                <span className="text-slate-300 font-mono">{doc.employee.employeeCode || '—'}</span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-slate-400">Company-wide generic document</span>
          )}
        </Card>

        <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-base font-semibold text-white">Audit & Notes</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Notes</span>
              <span className="text-slate-300">{doc.notes || 'None'}</span>
            </div>
            {doc.rejectedReason && (
              <div>
                <span className="text-xs text-red-400 block">Rejection Reason</span>
                <span className="text-red-300">{doc.rejectedReason}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Preview Section */}
      <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
        <h3 className="text-base font-semibold text-white">Document Preview</h3>
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-center min-h-[300px]">
          {isImage ? (
            <img src={doc.fileUrl} alt="Document Scan" className="max-h-[500px] object-contain rounded-lg shadow-lg" />
          ) : (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-sm font-medium text-slate-200">{doc.fileName}</div>
              {doc.fileUrl && (
                <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="border-slate-700">
                    Open in New Tab
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Document"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Specify reason for rejecting this document:
          </p>
          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Document is expired or invalid"
            className="bg-slate-950/60 border-slate-800"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReject}
              isLoading={rejectMutation.isPending}
              className="bg-red-600 hover:bg-red-500"
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Document"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to permanently delete this document?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-500"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DocumentDetailPage;
