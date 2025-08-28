import React, { useCallback, useRef, useState } from 'react';
import ActionButton from './ActionButton';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragIn = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onImageUpload(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [onImageUpload]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div 
        className="w-full h-full"
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
    >
        <div className={`w-full max-w-2xl text-center animate-fade-in mx-auto flex flex-col items-center justify-center p-8 rounded-lg transition-colors ${isDragging ? 'bg-indigo-950/50' : ''}`}>
            <h2 className="text-3xl font-bold text-gray-100 mb-2">Your photos, perfected with AI</h2>
            <p className="text-gray-400 mb-8 max-w-md">Upload an image to get started. Remove backgrounds, add objects, change colors, and more using simple text prompts.</p>
            <ActionButton 
                onClick={openFileDialog}
                icon={<UploadIcon className="w-5 h-5"/>}
            >
                Upload from computer
            </ActionButton>
            <div className="w-full mt-8">
                <p className="text-sm text-gray-600">{isDragging ? "Drop your image here to upload" : "Or drag and drop a file"}</p>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
            />
        </div>
        <p className="mt-4 text-xs text-gray-500 text-center">Supports PNG, JPG, WEBP</p>
    </div>
  );
};

export default ImageUploader;