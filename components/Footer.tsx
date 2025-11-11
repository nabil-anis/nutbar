
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Alex Doe. All Rights Reserved.</p>
        <p className="text-sm mt-1">Built with React, TypeScript, and Tailwind CSS.</p>
      </div>
    </footer>
  );
};

export default Footer;
