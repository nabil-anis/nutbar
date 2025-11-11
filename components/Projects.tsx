
import React from 'react';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import Section from './Section';

const projectsData: Project[] = [
  {
    title: 'AI-Powered Content Generator',
    description: 'A SaaS platform that uses the Gemini API to generate marketing copy, blog posts, and social media content. Features a rich text editor and real-time generation.',
    imageUrl: 'https://picsum.photos/seed/project1/800/600',
    tags: ['React', 'Next.js', 'Gemini API', 'Tailwind CSS', 'PostgreSQL'],
    liveUrl: '#',
    sourceUrl: '#',
  },
  {
    title: 'E-Commerce Analytics Dashboard',
    description: 'A comprehensive dashboard for e-commerce store owners to visualize sales data, customer behavior, and inventory management using complex charts and data grids.',
    imageUrl: 'https://picsum.photos/seed/project2/800/600',
    tags: ['React', 'TypeScript', 'Recharts', 'GraphQL', 'Node.js'],
    liveUrl: '#',
    sourceUrl: '#',
  },
  {
    title: 'Real-Time Collaborative Whiteboard',
    description: 'A web application that allows multiple users to collaborate on a whiteboard in real-time, featuring drawing tools, sticky notes, and chat functionality.',
    imageUrl: 'https://picsum.photos/seed/project3/800/600',
    tags: ['React', 'WebSockets', 'Canvas API', 'Express', 'MongoDB'],
    liveUrl: '#',
    sourceUrl: '#',
  },
   {
    title: 'Portfolio Website V2',
    description: 'This very portfolio website, designed to be clean, fast, and fully responsive, showcasing my skills in modern frontend development.',
    imageUrl: 'https://picsum.photos/seed/project4/800/600',
    tags: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    liveUrl: '#',
    sourceUrl: '#',
  },
];

const Projects: React.FC = () => {
  return (
    <Section id="projects" title="My Projects">
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        {projectsData.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </div>
    </Section>
  );
};

export default Projects;
