'use client';

import { useState } from 'react';
import { Upload, Check } from 'lucide-react';

export default function FileUpload({ onFileUpload }: { onFileUpload: (filename: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
      onFileUpload(data.filename);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <label className="cursor-pointer">
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        disabled={isUploading}
      />
      <div className={`p-2 rounded-lg border-2 border-dashed transition ${
        uploadSuccess 
          ? 'bg-green-50 border-green-500' 
          : 'bg-gray-50 border-gray-300 hover:border-indigo-500'
      }`}>
        {uploadSuccess ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <Upload className={`w-5 h-5 ${isUploading ? 'text-gray-400' : 'text-gray-600'}`} />
        )}
      </div>
    </label>
  );
}
