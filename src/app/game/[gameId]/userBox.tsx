import React from "react";
import { FaUserCircle, FaCheckCircle } from 'react-icons/fa';


type UserBoxProps = {
    name: string;
    profilePicture?: string;
    isReady: boolean;
}

const UserBox: React.FC<UserBoxProps> = ({ name, profilePicture, isReady }) => {
    return (
        <div className="flex flex-col items-center space-x-4 p-4 bg-gray-100 rounded-lg shadow-md w-1/3 mx-auto h-full">
            {profilePicture ? (
                <img src={profilePicture} alt={`${name}'s profile`} className="w-12 h-12 rounded-full" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  {/* Placeholder for no profile picture */}
                  <FaUserCircle className="h-32 w-32" />
                </div>
              )}
            <div className="flex flex-col items-center">
                <h1 className="text-lg font-semibold text-gray-800">{name}</h1>
                <h2 className={`text-lg ${isReady ? 'text-green-500' : 'text-red-500'}`}>
                    {isReady ? <FaCheckCircle className="inline h-16 w-16" /> : <h2 className="inline">Inte redo</h2>}
                </h2>
            </div>
        </div>
    );
}

export default UserBox;