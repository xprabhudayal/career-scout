// Assistant Avatar Component
'use client'
import { Telescope } from "lucide-react";

export const VoiceAgent = ({ darkMode, isSpeaking }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 rounded-2xl h-full transition-colors ${
      darkMode
        ? 'bg-gradient-to-br from-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-gray-100 to-gray-200'
    }`}>
      <div className="relative">
        <div className={`z-10 flex items-center justify-center rounded-full w-[120px] h-[120px] transition-all ${
          darkMode
            ? 'bg-gradient-to-br from-gray-600 to-gray-900 border-1 border-gray-600'
            : 'bg-gradient-to-br from-gray-100 to-gray-400 border-1 border-gray-300'
        }`}>
          <Telescope className={`w-12 h-12 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
        </div>
        {isSpeaking && (
          <div className={`absolute inset-0 inline-flex w-5/6 h-5/6 animate-ping rounded-full opacity-75 ${
            darkMode ? 'bg-blue-400' : 'bg-blue-300'
          }`} style={{ top: '10%', left: '10%' }}></div>
        )}
      </div>
      <span className={`text-xl font-light${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Your Personal Assistant
      </span>
    </div>
  );
};