
import React from 'react';
import Section from './Section';

const skills = [
  'React', 'TypeScript', 'Next.js', 'Node.js', 'Tailwind CSS',
  'Gemini API', 'GraphQL', 'PostgreSQL', 'Docker', 'Figma', 'Jest'
];

const SkillBadge: React.FC<{ skill: string }> = ({ skill }) => (
  <span className="inline-block bg-gray-800 text-blue-300 text-sm font-medium mr-2 mb-2 px-3 py-1 rounded-full">
    {skill}
  </span>
);

const About: React.FC = () => {
  return (
    <Section id="about" title="About Me">
      <div className="grid md:grid-cols-5 gap-10 items-center">
        <div className="md:col-span-2">
          <img
            src="https://picsum.photos/seed/portfolio_dev/600/600"
            alt="Alex Doe"
            className="rounded-full shadow-lg mx-auto w-48 h-48 md:w-64 md:h-64 object-cover border-4 border-gray-700"
          />
        </div>
        <div className="md:col-span-3">
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">
            I am a passionate and results-driven Senior Frontend Engineer with over 8 years of experience creating dynamic, responsive, and user-friendly web applications. My expertise lies in the React ecosystem, where I leverage modern tools like TypeScript, Next.js, and Tailwind CSS to build scalable and maintainable codebases.
          </p>
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">
            Recently, I've been diving deep into generative AI, integrating the Google Gemini API to build innovative features that push the boundaries of user interaction. I thrive in collaborative environments and am dedicated to writing clean, efficient code and creating beautiful, intuitive user experiences.
          </p>
          <h3 className="text-2xl font-semibold text-white mb-4">My Tech Stack</h3>
          <div className="flex flex-wrap">
            {skills.map(skill => <SkillBadge key={skill} skill={skill} />)}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default About;
