import React, { useCallback } from 'react';
import { UploadType } from '../types';

interface FileUploaderProps {
  type: UploadType;
  onFilesSelected: (files: File[]) => void;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  type,
  onFilesSelected,
  title,
  description,
  icon
}) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 hover:border-zome-red transition-colors cursor-pointer bg-white shadow-sm"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => document.getElementById(`file-input-${type}`)?.click()}
    >
      <input
        type="file"
        id={`file-input-${type}`}
        className="hidden"
        multiple
        accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleChange}
      />
      <div className="flex justify-center mb-4 text-zome-dark">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-zome-dark mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      <span className="text-zome-red font-semibold text-sm bg-red-50 px-4 py-2 rounded-full">
        Clique ou Arraste ficheiros aqui
      </span>
    </div>
  );
};
