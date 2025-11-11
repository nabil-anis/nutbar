
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative h-screen flex items-center justify-center text-center bg-gray-900 overflow-hidden">
       <div className="absolute inset-0 bg-grid-gray-700/[0.2] [mask-image:linear-gradient(to_bottom,white_10%,transparent_100%)]"></div>
       <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/80 to-gray-900"></div>

      <div className="relative z-10 p-4">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4">
          <span className="block text-gray-300">Hi, I'm</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-500 animate-gradient-x">
            Alex Doe
          </span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
          A Senior Frontend Engineer specializing in building exceptional, high-quality websites and applications with React and the Gemini API.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="#projects"
            className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-full hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-lg"
          >
            View My Work
          </a>
          <a
            href="#contact"
            className="bg-gray-700 text-white font-semibold py-3 px-8 rounded-full hover:bg-gray-600 transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Get In Touch
          </a>
        </div>
      </div>
      <style>{`
        .bg-grid-gray-700\\/\\[0\\.2\\] {
            background-image: linear-gradient(to right, rgba(55, 65, 81, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(55, 65, 81, 0.2) 1px, transparent 1px);
            background-size: 3rem 3rem;
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;
