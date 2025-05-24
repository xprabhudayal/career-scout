// floating navigation bar

import React from "react";
import { Sun, Moon, LogOut, Telescope } from "lucide-react";
import { FeedbackFish } from '@feedback-fish/react'


const Navbar = ({ darkMode, setDarkMode, user, logout }) => {
    return (
        <nav className={`fixed top-4 left-4 right-4 z-50 px-6 py-3 rounded-2xl border backdrop-blur-md transition-colors ${darkMode
                ? 'bg-gray-800/80 border-gray-700'
            : 'bg-white/80 border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Telescope className={`w-7 h-7 ${darkMode ? 'text-white' : 'text-gray-900'
                        }`}/>
                    <span className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        Career Scout
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <FeedbackFish projectId={process.env.NEXT_PUBLIC_FEEDBACK_FISH_PROJECT} userId={user.email} className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}>
                            Give us feedback
                        </button>
                    </FeedbackFish>


                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`p-2 rounded-lg transition-colors ${darkMode
                                ? 'hover:bg-gray-700 text-gray-300'
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                    >
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    <button 
            onClick={logout}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              darkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
                </div>
            </div>
        </nav>
    )
};

export default Navbar;