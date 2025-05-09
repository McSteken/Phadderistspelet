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
                <div className="w-full h-full flex items-center justify-center">
                    <img src={profilePicture} alt={`${name}'s profile`} className="w-32 h-32 rounded-full" />
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  {/* Placeholder for no profile picture */}
                  <FaUserCircle className="h-32 w-32" />
                </div>
              )}
            <div className="flex flex-col items-center">
                <h1 className="text-lg font-semibold text-gray-800">{name}</h1>
                    {isReady ? <FaCheckCircle className="inline h-16 w-16 text-green-500" /> : <h2 className="inline text-2xl font-bold text-red-600">Inte redo</h2>}
            </div>
        </div>
    );
}

export default UserBox;