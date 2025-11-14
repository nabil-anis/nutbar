
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-4 left-0 right-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-lg">
        <nav className="bg-white/50 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-2xl shadow-lg border border-slate-300/30 dark:border-zinc-700/50">
          <div className="flex items-center justify-center h-16 px-4 sm:px-6">
            <a href="/" className="text-xl font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600">
                <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
                <path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.006 1.511 3.744 3.744 0 0 1-1.51-3.006Z" />
              </svg>
              <span>Content Engine</span>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
