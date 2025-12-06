import React from 'react';
import UserProfileView from './UserProfileView';

/**
 * Demo component showcasing UserProfileView with sample data
 * This component displays a full profile with all sections populated
 */
const UserProfileViewDemo = () => {
  // Sample profile data with all sections
  const sampleProfile = {
    // Personal Information
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, California",
    headline: "Full-Stack Developer & Tech Lead",
    bio: "Passionate full-stack developer with 7+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies. Strong advocate for clean code and agile methodologies. Mentor at local coding bootcamp and open-source contributor.",
    avatar: null, // Will show initials badge
    resume: "#", // Resume link
    
    // Social Links
    linkedin: "https://linkedin.com/in/sarahjohnson",
    github: "https://github.com/sarahjohnson",
    portfolio: "https://sarahjohnson.dev",
    
    // Work Experience
    experiences: [
      {
        title: "Senior Full-Stack Developer",
        company: "TechCorp Inc.",
        role: "Senior Full-Stack Developer",
        startDate: "2022-03-01",
        endDate: null,
        currentlyWorking: true,
        description: "Led development of microservices architecture serving 2M+ users. Managed team of 5 junior developers. Implemented CI/CD pipelines reducing deployment time by 60%. Mentored junior developers on best practices and code quality."
      },
      {
        title: "Full-Stack Developer",
        company: "StartupXYZ",
        role: "Full-Stack Developer",
        startDate: "2020-06-15",
        endDate: "2022-02-28",
        currentlyWorking: false,
        description: "Built and maintained multiple React applications handling real-time data. Designed RESTful APIs using Node.js and Express. Implemented database optimization strategies improving query performance by 40%. Collaborated with product team to deliver features on schedule."
      },
      {
        title: "Junior Developer",
        company: "WebSolutions Ltd",
        role: "Junior Developer",
        startDate: "2018-01-10",
        endDate: "2020-05-30",
        currentlyWorking: false,
        description: "Developed responsive web applications using vanilla JavaScript and jQuery. Participated in code reviews and pair programming sessions. Contributed to bug fixes and feature implementations. Learned and grew with experienced mentors in a collaborative environment."
      }
    ],
    
    // Education
    educations: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: "University of California, Berkeley",
        startDate: "2014-09-01",
        endDate: "2018-05-15",
        grade: "3.8",
        description: "Major in Computer Science with focus on Software Engineering and Distributed Systems. Completed coursework in Data Structures, Algorithms, Database Design, and Web Development."
      },
      {
        degree: "High School Diploma",
        institution: "Lincoln High School",
        startDate: "2010-09-01",
        endDate: "2014-06-30",
        grade: "4.0",
        description: "Graduated with honors. Advanced Placement courses in Computer Science and Mathematics."
      }
    ],
    
    // Skills
    skills: [
      "JavaScript",
      "React.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "PostgreSQL",
      "AWS",
      "Docker",
      "Kubernetes",
      "REST APIs",
      "GraphQL",
      "Git",
      "Agile/Scrum",
      "HTML5",
      "CSS3",
      "Tailwind CSS",
      "Vue.js",
      "TypeScript",
      "Firebase",
      "Microservices"
    ],
    
    // Certifications
    certifications: [
      {
        name: "AWS Certified Solutions Architect - Associate",
        issuer: "Amazon Web Services",
        date: "2023-06-15",
        credentialId: "AWS-SAA-2023-001234",
        description: "Certified in designing and deploying AWS applications"
      },
      {
        name: "Google Cloud Professional Cloud Architect",
        issuer: "Google Cloud",
        date: "2022-12-20",
        credentialId: "GCP-PCA-2022-005678",
        description: "Certified in designing cloud solutions on Google Cloud Platform"
      },
      {
        name: "Docker Certified Associate",
        issuer: "Docker",
        date: "2022-04-10",
        credentialId: "DCA-2022-9876543",
        description: "Certified in containerization and Docker best practices"
      },
      {
        name: "Certified Scrum Master",
        issuer: "Scrum Alliance",
        date: "2021-11-05",
        credentialId: "CSM-2021-111222",
        description: "Certified in Scrum framework and agile methodologies"
      }
    ]
  };

  const handleEdit = () => {
    alert('Edit profile clicked! In a real app, this would navigate to the edit page.');
    console.log('Edit profile action');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            User Profile View Component Demo
          </h1>
          <p className="text-lg text-gray-600">
            Professional profile display with all sections and features
          </p>
        </div>

        {/* Demo Component */}
        <UserProfileView 
          profile={sampleProfile}
          onEdit={handleEdit}
          isLoading={false}
        />

        {/* Feature Highlights */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features Demonstrated</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="text-3xl mb-3">👤</div>
              <h3 className="font-semibold text-gray-900 mb-2">Avatar Section</h3>
              <p className="text-sm text-gray-600">
                Circular profile picture with gradient fallback and initials badge
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-900 mb-2">Header Info</h3>
              <p className="text-sm text-gray-600">
                Name, headline, email, phone, and location with icons
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="font-semibold text-gray-900 mb-2">Social Links</h3>
              <p className="text-sm text-gray-600">
                LinkedIn, GitHub, and Portfolio links with external icons
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
              <div className="text-3xl mb-3">💼</div>
              <h3 className="font-semibold text-gray-900 mb-2">Work Timeline</h3>
              <p className="text-sm text-gray-600">
                Experience timeline with company, role, dates, and descriptions
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-6 border border-cyan-200">
              <div className="text-3xl mb-3">🎓</div>
              <h3 className="font-semibold text-gray-900 mb-2">Education</h3>
              <p className="text-sm text-gray-600">
                Education timeline with degree, institution, dates, and GPA
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-6 border border-yellow-200">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="font-semibold text-gray-900 mb-2">Certifications</h3>
              <p className="text-sm text-gray-600">
                Credentials with issuer, date, and credential ID
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
              <div className="text-3xl mb-3">🏷️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Skill Tags</h3>
              <p className="text-sm text-gray-600">
                Modern pill-style skill badges with hover effects
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-6 border border-rose-200">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Stats</h3>
              <p className="text-sm text-gray-600">
                Summary cards showing counts of experiences, education, and skills
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-200">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold text-gray-900 mb-2">Responsive Design</h3>
              <p className="text-sm text-gray-600">
                Fully responsive layout for mobile, tablet, and desktop
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-semibold text-gray-900 mb-2">Tab Navigation</h3>
              <p className="text-sm text-gray-600">
                Organized content into Overview, Experience, Education, and Skills tabs
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-semibold text-gray-900 mb-2">Smooth Animations</h3>
              <p className="text-sm text-gray-600">
                Hover effects, transitions, and interactive elements
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-2">Action Buttons</h3>
              <p className="text-sm text-gray-600">
                Edit Profile and Download Resume buttons with callbacks
              </p>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-16 bg-gray-900 rounded-2xl shadow-lg p-8 text-white font-mono text-sm">
          <h3 className="text-xl font-bold mb-4 text-blue-400">Usage Example</h3>
          <pre className="overflow-x-auto">
{`import UserProfileView from './components/UserProfileView';

function MyPage() {
  const profile = {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    headline: "Full-Stack Developer",
    bio: "Passionate developer...",
    skills: ["React", "Node.js", "MongoDB"],
    experiences: [...],
    educations: [...],
    certifications: [...]
  };

  const handleEdit = () => {
    // Handle edit action
  };

  return (
    <UserProfileView 
      profile={profile}
      onEdit={handleEdit}
      isLoading={false}
    />
  );
}`}
          </pre>
        </div>

        {/* Notes */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-blue-900 mb-4">📝 Demo Notes</h3>
          <ul className="space-y-2 text-blue-800">
            <li>✅ This demo shows all available profile sections and features</li>
            <li>✅ The component is responsive and works on all device sizes</li>
            <li>✅ Click the tabs to navigate between different profile sections</li>
            <li>✅ Hover over elements to see interactive effects</li>
            <li>✅ The "Edit Profile" button demonstrates callback functionality</li>
            <li>✅ Social media links open in new tabs</li>
            <li>✅ Avatar displays initials when no image is provided</li>
            <li>✅ All dates are formatted consistently</li>
            <li>✅ Currently working positions show "Present" instead of end date</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserProfileViewDemo;