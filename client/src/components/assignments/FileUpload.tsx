'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function FileUpload({ file, onFileChange, error }: FileUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFileChange(accepted[0]);
    },
    [onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  if (file) {
    return (
      <div>
        <div className="file-upload__preview">
          <div className="file-upload__preview-info">
            <div className="file-upload__preview-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 2H12L16 6V18H4V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2V6H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="file-upload__preview-name">{file.name}</div>
              <div className="file-upload__preview-size">{formatSize(file.size)}</div>
            </div>
          </div>
          <button className="file-upload__remove" onClick={() => onFileChange(null)} aria-label="Remove file">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {error && <div className="file-upload__error">{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <div {...getRootProps()} className={`file-upload ${isDragActive ? 'file-upload--active' : ''}`}>
        <input {...getInputProps()} />
        <svg className="file-upload__icon" viewBox="0 0 40 40" fill="none">
          <path d="M20 8V26M20 8L14 14M20 8L26 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 26V30C6 31.1046 6.89543 32 8 32H32C33.1046 32 34 31.1046 34 30V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="file-upload__text">Choose a file or drag &amp; drop it here</p>
        <p className="file-upload__formats">PDF, PNG, JPG, DOCX</p>
        <span className="file-upload__browse">Browse Files</span>
      </div>
      <p className="file-upload__helper">Upload images of your preferred document/Image</p>
      {error && <div className="file-upload__error">{error}</div>}
    </div>
  );
}
