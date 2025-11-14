import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-transparent mt-16 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-500 dark:text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Content Engine. Powered by Google Gemini.</p>
        <span className="absolute right-4 bottom-2 text-gray-400 dark:text-zinc-600 text-xs italic">By nosh.</span>
      </div>
    </footer>
  );
};

export default Footer;