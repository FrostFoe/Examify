"use client";

import Link from "next/link";
import { BarChart3, Trash2, Pencil, FileText, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ConfirmPasswordDialog from "@/components/ConfirmPasswordDialog";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Exam } from "@/lib/types";
import { deleteExam } from "@/lib/actions";
import { EditExamModal } from "./EditExamModal";
import CustomLoader from "@/components/CustomLoader";

interface AdminExamCardProps {
  exam: Exam;
  onDelete?: () => void;
  onUpdate?: (updatedExam: Exam) => void;
}

export function AdminExamCard({
  exam,
  onDelete,
  onUpdate,
}: AdminExamCardProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { admin } = useAdminAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPasswordDialog(true);
  };

  const handleCopyLink = () => {
    const examUrl = `${window.location.origin}/dashboard/exams/${exam.id}`;
    navigator.clipboard.writeText(examUrl);
    toast({
      title: "Link Copied",
      description: "Exam link clipboard-e copy kora hoyeche.",
    });
  };

  const handleDeleteConfirmed = async (password: string) => {
    setShowPasswordDialog(false);

    if (!admin) {
      toast({ title: "Access Denied", variant: "destructive" });
      return;
    }

    setDeleting(true);

    const formData = new FormData();
    formData.append("id", exam.id);
    formData.append("password", password);
    formData.append("admin_uid", admin.uid);

    if (exam.batch_id) {
      formData.append("batch_id", exam.batch_id);
    }

    const result = await deleteExam(formData);
    if (result.success) {
      toast({ title: "Exam Deleted Successfully" });
      onDelete?.();
    } else {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
    setDeleting(false);
  };

  return (
    <>
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-950 hover:shadow-md transition-all duration-300">
        {/* Header - Exam Info */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">
            {exam.name}
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            ID: {exam.id.slice(0, 12)}...
          </p>
        </div>

        {/* Details */}
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">
              Duration:
            </span>
            <span className="font-medium">{exam.duration_minutes} Min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">
              Negative Mark:
            </span>
            <span className="font-medium">{exam.negative_marks_per_wrong}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">
              Created:
            </span>
            <span className="font-medium">
              {new Date(exam.created_at).toLocaleDateString("en-GB", {
                timeZone: "Asia/Dhaka",
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 gap-2">
          <Link
            href={`/admin/exams/${exam.id}/questions`}
            className="col-span-2 sm:col-span-1"
          >
            <Button variant="outline" size="sm" className="w-full text-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Questions
            </Button>
          </Link>
          <Link
            href={`/admin/exams/${exam.id}/results`}
            className="col-span-2 sm:col-span-1"
          >
            <Button variant="outline" size="sm" className="w-full text-xs">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Results
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={handleCopyLink}
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy Link
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs"
            onClick={() => setIsEditModalOpen(true)}
            disabled={deleting}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="w-full col-span-2 text-xs"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <CustomLoader minimal />
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete Exam
              </>
            )}
          </Button>
        </div>
      </div>
      <ConfirmPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        title="Delete Exam"
        description={`Apni '${exam.name}' exam delete korte jacchen — eti permanent. Admin password din.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
      />
      <EditExamModal
        exam={exam}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updatedExam) => {
          onUpdate?.(updatedExam);
        }}
      />
    </>
  );
}
