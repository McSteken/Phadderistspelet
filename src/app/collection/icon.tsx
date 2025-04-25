'use client';

import React, { useState } from 'react';

type IconProps = {
    collectionName: "Legionen" | "Skurkeriet" | "Familjen" | "Kretsn" |"NPhadderiet"; // Define the type for collectionName prop
    selected?: boolean; // Optional prop to indicate if the icon is selected
    onClick?: () => void; // Optional click handler
}

export default function Icon({ collectionName, onClick }: IconProps) {
    const [selected, setSelected] = useState(false);

    const handleClick = () => {
        setSelected(!selected);
        if (onClick) {
            onClick();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`p-3 flex items-center justify-center rounded-lg transform transition-transform duration-10 ${selected ? "bg-gray-600 border-white border-3" : "bg-gray-900 border-gray-500 border-2"} active:scale-97 cursor-pointer hover:border-gray-400`}
        >
            <img
            src={`/phadderier/${collectionName.toLowerCase()}.png`}
            alt={collectionName}
            className="max-w-full max-h-full object-contain"
            />
        </div>
    );
}