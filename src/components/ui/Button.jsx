import React from 'react';

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, title = "" }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300",
    outline: "border border-gray-300 text-gray-600 hover:bg-gray-50",
    magic: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-sm"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm justify-center ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
