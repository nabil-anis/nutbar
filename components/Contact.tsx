
import React from 'react';
import Section from './Section';
import { GitHubIcon } from './icons/GitHubIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';

const Contact: React.FC = () => {
  return (
    <Section id="contact" title="Get In Touch">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-lg text-gray-300 mb-8">
          I'm currently open to new opportunities and collaborations. Whether you have a question or just want to say hi, feel free to reach out. I'll do my best to get back to you!
        </p>
        <a
          href="mailto:alex.doe@example.com"
          className="inline-block bg-blue-600 text-white font-bold text-lg py-4 px-10 rounded-full hover:bg-blue-700 transition-transform transform hover:scale-105 duration-300 shadow-lg"
        >
          alex.doe@example.com
        </a>
        <div className="flex justify-center space-x-6 mt-12">
          <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
            <GitHubIcon className="w-8 h-8" />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
            <LinkedInIcon className="w-8 h-8" />
          </a>
        </div>
      </div>
    </Section>
  );
};

export default Contact;
