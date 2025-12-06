import React from 'react';
import UserProfileCard from './UserProfileCard';

const UserProfileCardDemo = () => {
  const sampleProfile = {
    name: 'John Anderson',
    email: 'john.anderson@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    avatar: null,
    bio: 'Full-stack developer with 8+ years of experience in building scalable web applications. Passionate about modern technologies, cloud architecture, and mentoring junior developers.',
    linkedin: 'https://linkedin.com/in/johnanderson',
    github: 'https://github.com/johnanderson',
    portfolio: 'https://johnanderson.dev',
    resume: 'resume.pdf',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'GraphQL', 'JavaScript', 'PostgreSQL', 'Git'],
    experiences: [
      {
        title: 'Senior Full-Stack Developer',
        company: 'Tech Solutions Inc.',
        startDate: '2021-06',
        endDate: 'Present',
        description: 'Led development of microservices architecture and mentored a team of 5 developers.'
      },
      {
        title: 'Full-Stack Developer',
        company: 'Digital Innovations Ltd.',
        startDate: '2019-03',
        endDate: '2021-05',
        description: 'Developed and maintained multiple client-facing web applications using React and Node.js.'
      },
      {
        title: 'Junior Web Developer',
        company: 'StartUp Hub',
        startDate: '2017-01',
        endDate: '2019-02',
        description: 'Built responsive web interfaces and REST APIs for various e-commerce platforms.'
      }
    ],
    educations: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of California',
        startDate: '2015-09',
        endDate: '2017-05',
        grade: '3.8'
      },
      {
        degree: 'Associate Degree in Information Technology',
        institution: 'Community College',
        startDate: '2013-09',
        endDate: '2015-05'
      }
    ]
  };

  const handleEdit = () => {
    console.log('Edit profile clicked');
    alert('Navigate to profile edit page');
  };

  const handleDownloadResume = () => {
    console.log('Download resume clicked');
    alert('Resume downloaded successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">User Profile Card Component</h1>
          <p className="text-slate-600">Modern and professional profile display with collapsible sections</p>
        </div>
        
        <UserProfileCard
          profile={sampleProfile}
          onEdit={handleEdit}
          onDownloadResume={handleDownloadResume}
          isLoading={false}
        />

        {/* Features List */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-3 text-lg">✨ Key Features</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>✓ Circular avatar with gradient fallback</li>
              <li>✓ Contact information display</li>
              <li>✓ Professional bio section</li>
              <li>✓ Skills as colorful tags</li>
              <li>✓ Experience timeline</li>
              <li>✓ Education timeline</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-3 text-lg">🎯 Responsive & Interactive</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>✓ Collapsible sections</li>
              <li>✓ Mobile responsive</li>
              <li>✓ Social media links</li>
              <li>✓ Edit & Download buttons</li>
              <li>✓ Smooth animations</li>
              <li>✓ Professional styling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCardDemo;
