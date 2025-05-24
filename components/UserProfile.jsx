'use client'
// User Profile Component
import { Play, Square, Mic, MicOff } from "lucide-react";

export const UserProfile = ({ user, darkMode, volumeLevel, isCallActive, stopCall, isMuted, startCall, toggleMute }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 rounded-2xl h-full transition-colors ${
      darkMode
        ? 'bg-gradient-to-br from-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-gray-100 to-gray-200'
    }`}>
      <div className="relative">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-32 h-32 rounded-full border-1 border-gray-600"
        />
        {volumeLevel > 0.1 && (
          <div className={`absolute inset-0 inline-flex w-full h-full rounded-full opacity-75`}></div>
        )}
      </div>
      <span className={`text-xl font-light ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {user.name} (You)
      </span>
      <div className="flex justify-center gap-3">
        {!isCallActive ? (
          <button
            onClick={startCall}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Start Call
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : `${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={stopCall}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
              title="End Call"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      </div>
  );
};