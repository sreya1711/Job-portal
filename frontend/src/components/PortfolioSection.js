import React, { useState } from 'react';
import { Github, Link as LinkIcon, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import jobsApi from '../services/jobsApi';

const PortfolioSection = ({ portfolio, onPortfolioUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    github: portfolio?.github || '',
    website: portfolio?.website || '',
  });
  const [projects, setProjects] = useState(portfolio?.projects || []);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    link: '',
    technologies: '',
  });

  const handleSocialLinks = async () => {
    try {
      setLoading(true);
      await jobsApi.updatePortfolio({ github: formData.github, website: formData.website });
      onPortfolioUpdate({ ...portfolio, ...formData });
      toast.success('Social links updated!');
    } catch (error) {
      toast.error('Failed to update social links');
    } finally {
      setLoading(false);
    }
  };

  const addProject = async () => {
    if (!newProject.title || !newProject.description) {
      toast.error('Title and description are required');
      return;
    }

    try {
      setLoading(true);
      const project = {
        ...newProject,
        technologies: newProject.technologies.split(',').map(t => t.trim()).filter(t => t),
      };
      const updatedProjects = [...projects, project];
      await jobsApi.updatePortfolio({ projects: updatedProjects });
      setProjects(updatedProjects);
      setNewProject({ title: '', description: '', link: '', technologies: '' });
      toast.success('Project added!');
    } catch (error) {
      toast.error('Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (index) => {
    try {
      setLoading(true);
      const updatedProjects = projects.filter((_, i) => i !== index);
      await jobsApi.updatePortfolio({ projects: updatedProjects });
      setProjects(updatedProjects);
      toast.success('Project removed');
    } catch (error) {
      toast.error('Failed to remove project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <LinkIcon className="mr-3 text-purple-600" size={28} />
        Portfolio
      </h2>

      {/* Social Links */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-4 flex items-center">
          <Github size={20} className="mr-2" />
          Social Links
        </h3>
        <div className="space-y-4">
          <input
            type="url"
            placeholder="GitHub Profile URL"
            value={formData.github}
            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="url"
            placeholder="Personal Website/Blog URL"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSocialLinks}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Save Links
          </button>
        </div>
      </div>

      {/* Projects */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-4 flex items-center">
          <Plus size={20} className="mr-2" />
          Projects
        </h3>

        {projects.length > 0 && (
          <div className="mb-6 space-y-4">
            {projects.map((project, index) => (
              <div key={index} className="bg-white p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{project.title}</h4>
                  <button
                    onClick={() => deleteProject(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-gray-600 mb-2">{project.description}</p>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mb-2 inline-block"
                  >
                    View Project →
                  </a>
                )}
                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Add New Project</h4>
          <input
            type="text"
            placeholder="Project Title"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Project Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows="3"
          />
          <input
            type="url"
            placeholder="Project Link (optional)"
            value={newProject.link}
            onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="Technologies (comma-separated)"
            value={newProject.technologies}
            onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={addProject}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          >
            <Plus size={18} className="mr-2" />
            Add Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSection;