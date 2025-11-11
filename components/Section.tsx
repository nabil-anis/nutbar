
import React from 'react';

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, title, children }) => {
  return (
    <section id={id} className="py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          <span className="text-white">{title.split(' ')[0]}</span>
          <span className="text-blue-500"> {title.split(' ').slice(1).join(' ')}</span>
        </h2>
        {children}
      </div>
    </section>
  );
};

export default Section;
