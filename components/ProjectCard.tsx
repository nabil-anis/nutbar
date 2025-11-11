
import React from 'react';
import type { Project } from '../types';
import { GitHubIcon } from './icons/GitHubIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { title, description, imageUrl, tags, liveUrl, sourceUrl } = project;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-500/30 transition-shadow duration-300 flex flex-col group">
      <div className="relative overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-4 flex-grow">{description}</p>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="bg-blue-900/50 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-700 flex items-center justify-start space-x-4">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center"
            >
              <ExternalLinkIcon className="w-5 h-5 mr-2" />
              Live Demo
            </a>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center"
            >
              <GitHubIcon className="w-5 h-5 mr-2" />
              Source Code
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
