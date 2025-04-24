'use client'

import React from "react";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "tertiary";
    size?: "small" | "medium" | "large" | "xlarge";
    shape?: "rectangle" | "square";
    children: React.ReactNode;
}

const baseStyles = "rounded-xl font-semibold focus:outline-none transition duration-300 ease-in-out border-gray-300 border-2 shadow-sm hover:shadow-md active:scale-95";

const variantStyles = {
    primary: "bg-green-500 text-white hover:bg-green-800",
    secondary: "bg-blue-500 text-white hover:bg-blue-800",
    tertiary: "bg-transparent text-blue-500 border border-blue-500 hover:bg-blue-500 hover:text-white",
};

const sizeStyles = {
    small: "px-2 py-1 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
    xlarge: "px-12 py-6 text-xl",
};

const CustomButton: React.FC<CustomButtonProps> = ({
    variant = "primary",
    size = "large",
    shape = "rectangle",
    children,
    ...props
}) => {

    const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} `;

    return (
        <button className={buttonStyles} {...props}>
            {children}
        </button>
    );
}

export default CustomButton;
