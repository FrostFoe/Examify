"use client";

import { useState, useRef, ChangeEvent } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBox, CustomLoader } from "@/components";
import { Upload, FileSpreadsheet } from "lucide-react";

interface CSVUploadComponentProps {
  onUploadSuccess?: (result: Record<string, unknown>) => void;
  isBank?: boolean;
}

export default function CSVUploadComponent({
  onUploadSuccess,
  isBank = true,
}: CSVUploadComponentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<Record<string, unknown> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (
        file.type !== "text/csv" &&
        !file.name.toLowerCase().endsWith(".csv")
      ) {
        setError("Please select a valid CSV file");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }

      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("csv_file", selectedFile);
      formData.append("is_bank", isBank ? "1" : "0");

      const result = await apiRequest("upload-csv", "POST", formData);

      if (!result.success) {
        throw new Error(result.message || "Upload failed");
      }

      setUploadResult((result.data as Record<string, unknown>) || (result as Record<string, unknown>));
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Upload Questions from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file containing questions to create or update your
          question bank
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="csv-upload" className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <p className="mt-2 font-medium">
                {selectedFile ? selectedFile.name : "Click to select CSV file"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                  : "Max file size: 5MB, Format: CSV"}
              </p>
            </div>
          </Label>
          <Input
            id="csv-upload"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
        </div>

        {error && <AlertBox type="error" title={error} />}

        {uploadResult && (
          <AlertBox
            type="success"
            title={`Successfully uploaded ${uploadResult.total_questions || "some"} questions. File ID: ${uploadResult.file_id || "unknown"}`}
          />
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <CustomLoader minimal />
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload CSV
              </>
            )}
          </Button>

          {selectedFile && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setUploadResult(null);
                setError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
