'use client';

import { useState } from 'react';
import { Upload, Check, X } from 'lucide-react';

export interface UploadedFileData {
  filename: string;
  content: string;
  contentPreview: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  onFileUpload: (file: UploadedFileData) => void;
  onRemove?: (filename: string) => void;
}

export default function FileUpload({ onFileUpload, onRemove }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showContentPreview, setShowContentPreview] = useState<UploadedFileData | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Pass file data including content to parent
      const fileData: UploadedFileData = {
        filename: data.filename,
        content: data.content || '',
        contentPreview: data.contentPreview || '',
        size: data.size || 0,
        type: data.type || '',
      };
      
      onFileUpload(fileData);
      setShowContentPreview(fileData);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="cursor-pointer block">
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.json,.md,.jpg,.jpeg,.png"
          disabled={isUploading}
        />
        <div className={`p-3 rounded-lg border-2 border-dashed transition ${
          uploadSuccess 
            ? 'bg-green-50 border-green-500' 
            : 'bg-gray-50 border-gray-300 hover:border-blue-500'
        }`}>
          {uploadSuccess ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">File uploaded successfully!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600">
              <Upload className={`w-4 h-4 ${isUploading ? 'text-gray-400' : ''}`} />
              <span className="text-sm font-medium">
                {isUploading ? 'Uploading...' : 'Click to upload file'}
              </span>
            </div>
          )}
        </div>
      </label>

      {/* File content preview hidden */}
    </div>
  );
}
