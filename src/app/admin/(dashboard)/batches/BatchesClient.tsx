"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ConfirmPasswordDialog from "@/components/ConfirmPasswordDialog";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { Batch } from "@/lib/types";
import {
  createBatch,
  deleteBatch,
  exportBatchData,
  importBatchData,
} from "@/lib/actions";
import { EditBatchModal } from "@/components/EditBatchModal";
import { BatchCard } from "@/components/BatchCard";
import { CustomLoader } from "@/components";
import { Download, Upload } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BatchWithCount extends Batch {
  student_count?: number;
  exam_count?: number;
}

export function BatchesClient({
  initialBatches,
}: {
  initialBatches: BatchWithCount[];
}) {
  const [batches, setBatches] = useState<BatchWithCount[]>(initialBatches);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("live");
  const [isPublic, setIsPublic] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPassword, setImportPassword] = useState("");

  const refetchBatches = async () => {
    const { apiRequest } = await import("@/lib/api");
    const result = await apiRequest<Batch[]>("batches");
    if (result.success && result.data) {
      setBatches(result.data as BatchWithCount[]);
    }
  };

  const { admin } = useAdminAuth();
  const [pendingBatchToDelete, setPendingBatchToDelete] = useState<
    string | null
  >(null);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "শুধুমাত্র ছবি ফাইল আপলোড করুন",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setImagePreview(base64String);
      setImageBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    setPendingBatchToDelete(batchId);
    setIsPasswordOpen(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setIsEditModalOpen(true);
  };

  const handleDeleteBatchConfirmed = async (password: string) => {
    if (!pendingBatchToDelete) return;

    if (!admin) {
      toast({ variant: "destructive", title: "অনুমতি নেই" });
      setIsPasswordOpen(false);
      setPendingBatchToDelete(null);
      return;
    }

    const formData = new FormData();
    formData.append("id", pendingBatchToDelete);
    formData.append("password", password);
    formData.append("admin_uid", admin.uid);

    const result = await deleteBatch(formData);

    if (result.success) {
      toast({
        title: "ব্যাচ মুছে গেছে",
      });
      // Refetch batches to remove deleted batch from list
      await refetchBatches();
    } else {
      toast({
        title: "ব্যাচ মুছে ফেলতে সমস্যা হয়েছে",
        description: result.message,
        variant: "destructive",
      });
    }

    setIsPasswordOpen(false);
    setPendingBatchToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("status", status);
    if (isPublic) formData.set("is_public", "true");
    if (imageBase64) formData.set("icon_url", imageBase64);

    const result = await createBatch(formData);
    if (result.success) {
      toast({
        title: "ব্যাচ যুক্ত হয়েছে",
      });
      formRef.current?.reset();
      setIsPublic(false);
      setStatus("live");
      clearImage();
      // Refetch batches to show new batch immediately
      await refetchBatches();
    } else {
      toast({
        title: "ব্যাচ যোগ করতে সমস্যা হয়েছে",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const handleExportBatch = async (batchId: string) => {
    setIsExporting(true);
    try {
      const result = await exportBatchData(batchId);
      if (result.success && result.data && result.filename) {
        const element = document.createElement("a");
        element.setAttribute(
          "href",
          "data:text/plain;charset=utf-8," + encodeURIComponent(result.data),
        );
        element.setAttribute("download", result.filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast({
          title: "এক্সপোর্ট সফল",
          description: "ব্যাচ ডেটা ডাউনলোড হয়েছে।",
        });
      } else {
        toast({
          variant: "destructive",
          title: "এক্সপোর্ট ব্যর্থ",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "এক্সপোর্ট ব্যর্থ",
        description: (error as Error).message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBatch = async (file: File) => {
    if (!admin) {
      toast({ variant: "destructive", title: "অনুমতি নেই" });
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("adminPassword", importPassword);
      formData.append("adminUid", admin.uid);

      const result = await importBatchData(formData);

      if (result.success) {
        toast({
          title: "ইমপোর্ট সফল",
          description: result.message,
        });
        setIsImportDialogOpen(false);
        setImportPassword("");
        await refetchBatches();
      } else {
        toast({
          variant: "destructive",
          title: "ইমপোর্ট ব্যর্থ",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "ইমপোর্ট ব্যর্থ",
        description: (error as Error).message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-1 md:p-2 lg:p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
            <div>
              <CardTitle>ব্যাচ পরিচালনা</CardTitle>
              <CardDescription>
                নতুন ব্যাচ তৈরি করুন এবং বিদ্যমান ব্যাচ পরিচালনা করুন।
              </CardDescription>
            </div>
            <Dialog
              open={isImportDialogOpen}
              onOpenChange={setIsImportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <Upload className="h-3.5 w-3.5" />
                  <span className="whitespace-nowrap">ইমপোর্ট ব্যাচ</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ব্যাচ ডেটা ইমপোর্ট করুন</DialogTitle>
                  <DialogDescription>
                    পূর্ববর্তী এক্সপোর্টকৃত ব্যাচ JSON ফাইল নির্বাচন করুন। এটি
                    নতুন ব্যাচ হিসেবে তৈরি হবে।
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-file">JSON ফাইল</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      disabled={isImporting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="import-password">অ্যাডমিন পাসওয়ার্ড</Label>
                    <Input
                      id="import-password"
                      type="password"
                      placeholder="আপনার পাসওয়ার্ড"
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                      disabled={isImporting}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsImportDialogOpen(false)}
                    disabled={isImporting}
                  >
                    বাতিল করুন
                  </Button>
                  <Button
                    onClick={() => {
                      const fileInput = document.getElementById(
                        "import-file",
                      ) as HTMLInputElement;
                      const file = fileInput?.files?.[0];
                      if (!file) {
                        toast({
                          variant: "destructive",
                          title: "ফাইল বেছে নিন",
                        });
                        return;
                      }
                      if (!importPassword) {
                        toast({
                          variant: "destructive",
                          title: "পাসওয়ার্ড দিন",
                        });
                        return;
                      }
                      handleImportBatch(file);
                    }}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <>
                        <CustomLoader />
                        ইমপোর্ট হচ্ছে...
                      </>
                    ) : (
                      "ইমপোর্ট করুন"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-4 mb-8 border p-4 rounded-xl bg-muted/5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-name">ব্যাচের নাম</Label>
                <Input
                  id="batch-name"
                  type="text"
                  name="name"
                  placeholder="ব্যাচের নাম"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-desc">ব্যাচের বিবরণ</Label>
                <Input
                  id="batch-desc"
                  type="text"
                  name="description"
                  placeholder="ব্যাচের বিবরণ"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-icon">ব্যাচ ছবি (ঐচ্ছিক)</Label>
                <div className="space-y-3">
                  <Input
                    ref={fileInputRef}
                    id="batch-icon"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={isSubmitting}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="space-y-2">
                      <div className="relative w-24 h-24">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover rounded-lg border"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={clearImage}
                        disabled={isSubmitting}
                      >
                        ছবি সরান
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>ব্যাচের স্ট্যাটাস</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="স্ট্যাটাস নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">লাইভ</SelectItem>
                    <SelectItem value="end">শেষ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="is_public_create"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor="is_public_create"
                  className="text-sm cursor-pointer"
                >
                  পাবলিক ব্যাচ
                </Label>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <CustomLoader />
                  যোগ করা হচ্ছে...
                </>
              ) : (
                "নতুন ব্যাচ তৈরি করুন"
              )}
            </Button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            {batches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                studentCount={batch.student_count}
                examCount={batch.exam_count}
                onEdit={handleEditBatch}
                onDelete={handleDeleteBatch}
                onExport={handleExportBatch}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      <hr className="h-8 border-transparent" />
      <ConfirmPasswordDialog
        open={isPasswordOpen}
        onOpenChange={(open) => {
          setIsPasswordOpen(open);
          if (!open) setPendingBatchToDelete(null);
        }}
        title="ব্যাচ মুছে ফেলার নিশ্চিতকরণ"
        description={
          pendingBatchToDelete
            ? "আপনি এই ব্যাচটি মুছে ফেলতে যাচ্ছেন — এটি সব পরীক্ষা এবং সম্পর্কিত তথ্য মুছে ফেলবে। অনুগ্রহ করে আপনার অ্যাডমিন পাসওয়ার্ড দিন।"
            : undefined
        }
        confirmLabel="মুছে ফেলুন"
        onConfirm={handleDeleteBatchConfirmed}
      />
      <EditBatchModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBatch(null);
        }}
        batch={editingBatch}
        onSuccess={refetchBatches}
      />
    </div>
  );
}
