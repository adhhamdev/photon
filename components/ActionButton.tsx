import React from 'react';
import Loader from './Loader';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  shape?: 'default' | 'circle';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  children, 
  isLoading = false,
  variant = 'primary',
  shape = 'default',
  icon,
  className,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500",
    secondary: "bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 focus:ring-indigo-500",
    ghost: "bg-transparent text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-indigo-500",
  };

  const shapeClasses = {
      default: "rounded-md px-4 py-2",
      circle: "rounded-full p-2"
  }

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${shapeClasses[shape]} ${className || ''}`;

  return (
    <button className={combinedClasses} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <>
          <Loader />
          {children && <span className="ml-2">Processing...</span>}
        </>
      ) : (
        <>
        {icon && !children && <span className="h-5 w-5">{icon}</span>}
        {icon && children && <span className="mr-2 -ml-1 h-5 w-5">{icon}</span>}
        {children}
        </>
      )}
    </button>
  );
};

export default ActionButton;