import React, { useState } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
  };

  const handleResetApp = () => {
    setImageFile(null);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header onReset={handleResetApp} hasImage={!!imageFile} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center pt-20">
        {!imageFile ? (
          <div className="w-full h-full flex items-center justify-center">
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
        ) : (
          <ImageEditor imageFile={imageFile} />
        )}
      </main>
    </div>
  );
};

export default App;