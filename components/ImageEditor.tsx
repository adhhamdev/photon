import React, { useState, useEffect } from 'react';
import { editImageWithGemini } from '../services/geminiService';
import ActionButton from './ActionButton';
import { SparklesIcon, DownloadIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from './Icons';
import Loader from './Loader';

interface ImageEditorProps {
    imageFile: File;
}

/**
 * Normalizes an image file by drawing it onto a square canvas.
 * This ensures the image has consistent dimensions (1024x1024) for editing,
 * preserving aspect ratio by padding with a black background.
 * @param file The image file to normalize.
 * @returns A promise that resolves with a data URL of the normalized image.
 */
const normalizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error('FileReader did not return a result'));
            }

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }

                const MAX_DIMENSION = 1024;
                canvas.width = MAX_DIMENSION;
                canvas.height = MAX_DIMENSION;

                // Fill background with black for non-square images
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, MAX_DIMENSION, MAX_DIMENSION);

                // Calculate dimensions to fit the image inside the canvas while maintaining aspect ratio
                let newWidth, newHeight;
                if (img.width > img.height) {
                    newWidth = MAX_DIMENSION;
                    newHeight = (img.height * MAX_DIMENSION) / img.width;
                } else {
                    newHeight = MAX_DIMENSION;
                    newWidth = (img.width * MAX_DIMENSION) / img.height;
                }

                const x = (MAX_DIMENSION - newWidth) / 2;
                const y = (MAX_DIMENSION - newHeight) / 2;

                ctx.drawImage(img, x, y, newWidth, newHeight);
                
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => reject(new Error('Image failed to load'));
            img.src = event.target.result as string;
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};


const ImageEditor: React.FC<ImageEditorProps> = ({ imageFile }) => {
    const [history, setHistory] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>('');

    const currentImageUrl = history[currentIndex];

    useEffect(() => {
        if (imageFile) {
            const processImage = async () => {
                // Clear previous state and show loader
                setHistory([]);
                setCurrentIndex(-1);
                setIsLoading(true);
                setLoadingMessage('Preparing your image...');
                setError(null);

                try {
                    const normalizedImageUrl = await normalizeImage(imageFile);
                    setHistory([normalizedImageUrl]);
                    setCurrentIndex(0);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to process image.");
                } finally {
                    setIsLoading(false);
                }
            };
            processImage();
        }
    }, [imageFile]);

    const handleEdit = async () => {
        if (!prompt.trim() || !currentImageUrl) {
            setError("Please enter an editing instruction.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Photon is working its magic...');
        setError(null);
        try {
            // Pass the current image URL for cumulative edits
            const { imageUrl } = await editImageWithGemini(currentImageUrl, prompt);
            const newHistory = history.slice(0, currentIndex + 1);
            setHistory([...newHistory, imageUrl]);
            setCurrentIndex(newHistory.length);
            setPrompt(''); // Clear prompt on success
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUndo = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };
    
    const handleRedo = () => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };
    
    const handleDownload = () => {
        if (!currentImageUrl) return;
        const link = document.createElement('a');
        link.href = currentImageUrl;
        const sanitizedName = imageFile.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        link.download = `edited-v${currentIndex + 1}-${sanitizedName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (prompt.trim() && currentImageUrl && !isLoading) {
                handleEdit();
            }
        }
    }

    return (
        <div className="w-full h-full flex flex-col animate-fade-in pb-24">
            <h1 className="sr-only">Image Editor</h1>
            <div className="flex-grow flex items-center justify-center p-2 sm:p-4 relative min-h-0">
                <div className="relative w-full max-w-[512px] aspect-square bg-gray-950/50 border border-gray-800 rounded-lg sm:rounded-xl shadow-2xl flex items-center justify-center overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-opacity">
                            <Loader />
                            <p className="text-white text-sm mt-3 font-medium">{loadingMessage}</p>
                        </div>
                    )}
                    {currentImageUrl && (
                        <img src={currentImageUrl} alt={`Edited image version ${currentIndex + 1}`} className="w-full h-auto object-contain" />
                    )}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-gray-800 z-20">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    {error && <p className="text-sm text-red-500 animate-shake text-center absolute -top-8 left-1/2 -translate-x-1/2 bg-red-950/50 px-3 py-1 rounded-md shadow-lg">{error}</p>}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="flex-grow relative flex items-center">
                            <input
                                type="text"
                                id="prompt-input"
                                value={prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value);
                                    if(error) setError(null);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g., 'Add a birthday hat' or 'make the background black and white'"
                                className="w-full p-3 pl-4 pr-14 rounded-full border border-gray-700 bg-gray-900 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                disabled={isLoading}
                            />
                             <ActionButton
                                onClick={handleEdit}
                                isLoading={isLoading}
                                disabled={!prompt.trim() || !currentImageUrl}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                                shape="circle"
                                title="Generate Edit"
                            >
                                <SparklesIcon className="w-5 h-5"/>
                            </ActionButton>
                        </div>
                        <div className="flex items-center space-x-0.5 sm:space-x-1">
                            <ActionButton variant="ghost" shape='circle' onClick={handleUndo} disabled={currentIndex <= 0 || isLoading} title="Undo">
                                <ArrowUturnLeftIcon className="h-6 w-6" />
                            </ActionButton>
                            <ActionButton variant="ghost" shape='circle' onClick={handleRedo} disabled={currentIndex >= history.length - 1 || isLoading} title="Redo">
                                <ArrowUturnRightIcon className="h-6 w-6" />
                            </ActionButton>
                            <ActionButton 
                                variant="ghost" 
                                shape='circle'
                                onClick={handleDownload} 
                                disabled={!currentImageUrl || isLoading}
                                title="Download current version"
                            >
                                <DownloadIcon className="h-6 w-6" />
                            </ActionButton>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default ImageEditor;