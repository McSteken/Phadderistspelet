import React, {useState, useRef, useEffect} from 'react'
import { useAuth } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../../lib/firebase"; // Import the auth object from firebase
import { useRouter } from 'next/navigation';
//import Dropdown from 'react-bootstrap/Dropdown'

//import {UserCircle} from '@heroicons/react/24/solid' // Import user icon
import { FaUserCircle } from 'react-icons/fa';

export default function Navbar() {

    const router = useRouter();
    const { user, loading } = useAuth(); 
    const [ dropdownOpen, setDropdownOpen ] = useState(false); // State to manage dropdown visibility
    const [error, setError] = useState(""); // State to hold error messages

    const dropdownRef = useRef<HTMLDivElement>(null); // Ref to manage dropdown element
    console.error("Error signing out:", error);

  const goToLogin = () => {
    router.push("/login");
  }

  const handleSignOut = async () => {
    setError(""); // Reset error state
    try {
      await signOut(auth); // Sign out the user
      router.push("/login"); // Redirect to login page
    } catch (error) {
      setError("Failed to log out"); // Set error message if sign out fails
    }
  }

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen); 
  }

  const handleClickOutside = (event: { target: any; }) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false); // Close dropdown if clicked outside
    }
  }

  // Add event listener on component mount and remove on unmount
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  
  return (
  <div className='absolute top-0 left-0 w-full z-10'>

    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
        <div className="text-lg font-bold"></div>
      
        <div className="flex space-x-10">
                    <a href="/" className="hover:text-gray-400 flex items-center">Hem</a>
                    <a href="/collection" className="hover:text-gray-400 flex items-center">Collection</a>
                    <a href="/about" className="hover:text-gray-400 flex items-center">Regler</a>
                    {user ? (
                      <div className="relative">
                        <button  onClick={toggleDropdown} className="hover:outline-none flex items-center">
                            <FaUserCircle className="h-8 w-8"/> 
                        </button>
                        {dropdownOpen && (
                          <div ref={dropdownRef} className={'absolute right-0 mt-4 w-48 bg-white text-black rounded shadow-lg z-10'}>
                            <ul className="py-2">
                              <li>
                                  <a
                                    href="/profile"
                                    className="block mx-auto px-4 py-2 hover:bg-gray-100"
                                  >
                                    Profil
                                  </a>
                              </li>
                              <hr className="border-t border-gray-400 my-2 w-7/8 mx-auto" />
                              <li>
                                <button
                                  onClick={handleSignOut}
                                  className="block w-7/8 text-middle mx-auto px-4 py-2 hover:bg-red-700 bg-red-500 text-white rounded cursor-pointer"
                                >
                                  Logga ut
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      )
                      
                      : 
                        (<button onClick={goToLogin} className="p-2 bg-blue-500 text-white rounded">Login</button>)}
                  

                </div>
          </nav>
          
      </div>
    )
}