'use client'

import { Play, Square, Mic, MicOff } from "lucide-react";


// Call Controls Component
export const CallControls = ({ isCallActive, isMuted, startCall, stopCall, toggleMute, darkMode }) => {
  return (
    <div className="flex justify-center gap-4 mb-6">
      {!isCallActive ? (
        <button
          onClick={startCall}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full transition-colors"
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
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={stopCall}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};