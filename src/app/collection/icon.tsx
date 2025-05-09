'use client';

import React, { useState } from 'react';

type IconProps = {
    collectionName: "Legionen" | "Skurkeriet" | "Familjen" | "Kretsn" |"NPhadderiet"; // Define the type for collectionName prop
    selected?: boolean; // Optional prop to indicate if the icon is selected
    onClick?: () => void; // Optional click handler
}

export default function Icon({ collectionName, selected = false, onClick }: IconProps) {

    return (
        <div
            onClick={onClick}
            className={`aspect-square w-full p-2 flex items-center justify-center rounded-lg transform transition-transform duration-100 ${
                selected ? "bg-gray-600 border-white border-4" : "bg-gray-900 border-gray-500 border-2"
            } active:scale-97 cursor-pointer hover:border-gray-400`}
        >
            <img
                src={`/phadderier/${collectionName.toLowerCase()}.png`}
                alt={collectionName}
                className="h-full object-cover rounded"
            />
        </div>
    );
}