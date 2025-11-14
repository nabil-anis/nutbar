
import React from 'react';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <main className="flex-grow flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Instantly Generate <span className="text-red-600">SEO-Optimized</span> Blog Posts
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Leverage AI to create buyer-intent topics and high-quality articles for any product, tailored to your business.
          </p>
          <div className="mt-10">
            <button
              onClick={onStart}
              className="bg-red-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Generate Content Now &rarr;
            </button>
          </div>
        </div>
    </main>
  );
};

export default Hero;
