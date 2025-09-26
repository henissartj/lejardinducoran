import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface BilingualButtonProps {
  textFr: string;
  textAr: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  onClick?: () => void;
  isRTL: boolean;
}

export const BilingualButton: React.FC<BilingualButtonProps> = ({
  textFr,
  textAr,
  icon: Icon,
  variant = 'primary',
  className = '',
  onClick,
  isRTL
}) => {
  const baseStyles = "relative flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-300 ease-in-out min-w-[120px] min-h-[40px]";
  
  const variantStyles = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300",
    outline: "border-2 border-teal-600 text-teal-600 hover:bg-teal-50 active:bg-teal-100"
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${className}
        ${isRTL ? 'font-arabic text-lg' : 'font-sans'}
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <span className="flex items-center gap-2 transform-gpu transition-transform duration-300">
        {Icon && <Icon size={18} className={isRTL ? 'ml-2' : 'mr-2'} />}
        <span>{isRTL ? textAr : textFr}</span>
      </span>
    </button>
  );
};