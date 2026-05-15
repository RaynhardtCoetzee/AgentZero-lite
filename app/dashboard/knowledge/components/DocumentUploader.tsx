'use client';

import { useState } from 'react';
import { processAndStoreDocument } from '@/lib/actions/document-processing-actions';
import { Button } from '@/components/ui/button';

export function DocumentUploader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const fileBytes = await file.arrayBuffer();
      const fileType = file.name.split('.').pop() || 'unknown';

      const result = await processAndStoreDocument(
        fileBytes,
        file.name,
        fileType,
        {
          uploadedAt: new Date().toISOString(),
          originalSize: file.size,
        }
      );

      if (result.status === 'success') {
        setSuccess(
          `Document processed: ${result.chunkCount} chunks created`
        );
        event.target.value = '';
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={isLoading}
          accept=".pdf,.docx,.doc,.txt,.html,.md"
          className="block w-full text-sm"
        />
        <Button disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Upload'}
        </Button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-500 text-sm">{success}</div>}
    </div>
  );
}
