import React from 'react';
import ActionButton from './ActionButton';
import { PhotoIcon, CloseIcon } from './Icons';

interface HeaderProps {
    onReset: () => void;
    hasImage: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasImage }) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <PhotoIcon className="h-8 w-8 text-purple-400" />
            <p className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
              Photon
            </p>
          </div>
          {hasImage && (
             <ActionButton
                onClick={onReset}
                variant="ghost"
                shape="circle"
                title="Start Over"
                className='text-gray-300 hover:text-white'
              >
                <CloseIcon className="h-6 w-6" />
            </ActionButton>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;