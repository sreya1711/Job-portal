import React, { useState } from 'react';
import { Award, Plus, Trash2, Star, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import jobsApi from '../services/jobsApi';

const SkillBadges = ({ skills, onSkillsUpdate }) => {
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper function to convert string skills to object format
  const convertSkillsToObjects = (skillsData) => {
    if (!skillsData) return [];
    
    // If it's a string, split by comma
    if (typeof skillsData === 'string') {
      return skillsData
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
        .map(skillName => ({
          name: skillName,
          endorsements: 0,
          badge: 'bronze',
          verifiedByAssessment: false
        }));
    }
    
    // If it's already an array, convert each item to object if needed
    if (Array.isArray(skillsData)) {
      return skillsData.map(skill => {
        if (typeof skill === 'string') {
          return {
            name: skill,
            endorsements: 0,
            badge: 'bronze',
            verifiedByAssessment: false
          };
        }
        return skill;
      });
    }
    
    return [];
  };

  // Convert skills to objects for use in component
  const skillObjects = convertSkillsToObjects(skills);

  const getBadgeColor = (badge) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-300',
      silver: 'bg-gray-100 text-gray-800 border-gray-300',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      verified: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[badge] || 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getBadgeIcon = (badge) => {
    if (badge === 'verified') return <CheckCircle size={16} className="mr-1 inline" />;
    if (badge === 'gold') return <Star size={16} className="mr-1 inline" />;
    return null;
  };

  const addSkill = async () => {
    if (!newSkill.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    try {
      setLoading(true);
      const skillData = {
        name: newSkill,
        endorsements: 0,
        badge: 'bronze',
        verifiedByAssessment: false,
      };
      
      // Create array of skill names as strings for storage
      const updatedSkillNames = [...skillObjects.map(s => s.name), newSkill];
      await jobsApi.updateSkills(updatedSkillNames);
      // Update parent with updated skill objects
      onSkillsUpdate([...skillObjects, skillData]);
      setNewSkill('');
      toast.success('Skill added!');
    } catch (error) {
      toast.error('Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const removeSkill = async (skillName) => {
    try {
      setLoading(true);
      // Create array of remaining skill names as strings for storage
      const updatedSkillNames = skillObjects
        .filter(s => s.name !== skillName)
        .map(s => s.name);
      await jobsApi.updateSkills(updatedSkillNames);
      // Update parent with filtered skill objects
      onSkillsUpdate(skillObjects.filter(s => s.name !== skillName));
      toast.success('Skill removed');
    } catch (error) {
      toast.error('Failed to remove skill');
    } finally {
      setLoading(false);
    }
  };

  const endorseSkill = async (skillName) => {
    try {
      setLoading(true);
      await jobsApi.endorseSkill(skillName);
      const updatedSkills = skillObjects.map(s => 
        s.name === skillName 
          ? { ...s, endorsements: s.endorsements + 1 }
          : s
      );
      onSkillsUpdate(updatedSkills);
      toast.success('Skill endorsed!');
    } catch (error) {
      toast.error('Failed to endorse skill');
    } finally {
      setLoading(false);
    }
  };

  const upgradeToVerified = async (skillName) => {
    try {
      setLoading(true);
      await jobsApi.verifySkill(skillName);
      const updatedSkills = skillObjects.map(s =>
        s.name === skillName
          ? { ...s, badge: 'verified', verifiedByAssessment: true }
          : s
      );
      onSkillsUpdate(updatedSkills);
      toast.success('Skill verified through assessment!');
    } catch (error) {
      toast.error('Failed to verify skill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Award className="mr-3 text-yellow-600" size={28} />
        Skills & Badges
      </h2>

      {/* Add New Skill */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Add New Skill</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter skill name (e.g., JavaScript, React, Python)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={addSkill}
            disabled={loading}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Skills Display */}
      {skillObjects.length > 0 ? (
        <div className="space-y-3">
          {skillObjects.map((skill, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${getBadgeColor(skill.badge || 'bronze')}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="font-semibold text-lg">
                      {getBadgeIcon(skill.badge)}
                      {skill.name}
                    </span>
                    {skill.verifiedByAssessment && (
                      <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                        Verified by Assessment
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      Endorsements: <strong>{skill.endorsements || 0}</strong>
                    </span>
                    {skill.assessmentScore !== undefined && (
                      <span>
                        Assessment Score: <strong>{skill.assessmentScore}%</strong>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => endorseSkill(skill.name)}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Endorse
                  </button>
                  {!skill.verifiedByAssessment && (
                    <button
                      onClick={() => upgradeToVerified(skill.name)}
                      disabled={loading}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => removeSkill(skill.name)}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No skills added yet. Start by adding your key skills!
        </p>
      )}

      {/* Badge Information */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold mb-3 text-blue-900">Badge Levels</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
            <strong>Bronze:</strong> 1-3 endorsements
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
            <strong>Silver:</strong> 4-9 endorsements
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            <strong>Gold:</strong> 10+ endorsements
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <strong>Verified:</strong> Assessment passed
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillBadges;