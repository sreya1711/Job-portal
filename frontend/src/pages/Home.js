import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Building2, Users, CheckCircle, TrendingUp, Star, ArrowRight, Zap, Award, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import LoginSignup from '../pages/auth/LoginSignup.js'; // Adjust the import path as needed

function Home() {
  const [searchJob, setSearchJob] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animateStats, setAnimateStats] = useState(false);
  const [showLoginSignup, setShowLoginSignup] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);

  useEffect(() => {
    setAnimateStats(true);
    setFilteredCategories(categories);
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    { name: "Sarah Chen", role: "Software Engineer", company: "Google", text: "Found my dream job in just 2 weeks!" },
    { name: "Mike Johnson", role: "Product Manager", company: "Microsoft", text: "The recommendation engine is incredibly accurate." },
    { name: "Lisa Wang", role: "UX Designer", company: "Apple", text: "Best job platform I've ever used!" }
  ];

  const stats = [
    { icon: Briefcase, value: "15K+", label: "Active Jobs", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Building2, value: "2K+", label: "Companies", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Users, value: "50K+", label: "Job Seekers", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: CheckCircle, value: "8K+", label: "Success Stories", color: "text-orange-600", bg: "bg-orange-50" }
  ];

  const categories = [
    { icon: '💻', name: 'Technology', count: '3.2K+ jobs', trend: '+12%', color: 'from-blue-500 to-cyan-500' },
    { icon: '🎨', name: 'Design', count: '850+ jobs', trend: '+8%', color: 'from-pink-500 to-rose-500' },
    { icon: '📊', name: 'Marketing', count: '1.2K+ jobs', trend: '+15%', color: 'from-green-500 to-emerald-500' },
    { icon: '💼', name: 'Business', count: '2.1K+ jobs', trend: '+10%', color: 'from-indigo-500 to-purple-500' },
    { icon: '🔬', name: 'Science', count: '650+ jobs', trend: '+6%', color: 'from-teal-500 to-cyan-500' },
    { icon: '🏥', name: 'Healthcare', count: '980+ jobs', trend: '+18%', color: 'from-red-500 to-pink-500' },
    { icon: '🎓', name: 'Education', count: '420+ jobs', trend: '+5%', color: 'from-amber-500 to-orange-500' },
    { icon: '🏗️', name: 'Engineering', count: '1.8K+ jobs', trend: '+14%', color: 'from-gray-600 to-gray-800' }
  ];

  const features = [
    { icon: Zap, title: "AI-Powered Matching", desc: "Smart algorithms find your perfect job match" },
    { icon: Award, title: "Premium Companies", desc: "Direct connections with top-tier employers" },
    { icon: Globe, title: "Global Opportunities", desc: "Remote and international positions available" }
  ];

  const companies = [
    { name: "Google", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWIl8zC8WAMHi5JVmKUb3YVvZd5gvoCdy-NQ&s" },
    { name: "Microsoft", logo: "https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/78-microsoft-512.png" },
    { name: "Apple", logo: "https://www.transparentpng.com/thumb/apple-logo/RRgURB-apple-logo-clipart-hd.png" },
    { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png" }
  ];

  const blogPosts = [
    { title: "Top 5 Tips for a Winning Resume", excerpt: "Learn how to craft a resume that stands out.", date: "Sep 25, 2025" },
    { title: "How to Ace Your Next Interview", excerpt: "Master the art of interviewing with these pro tips.", date: "Sep 20, 2025" },
    { title: "The Future of Remote Work", excerpt: "Explore trends shaping the modern workplace.", date: "Sep 15, 2025" }
  ];

  const handleSearch = () => {
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchJob.toLowerCase())
    );
    setFilteredCategories(filtered);
  };

  const handleTestimonialChange = (index) => {
    setCurrentTestimonial(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20 mb-8 shadow-lg">
            <Star className="w-4 h-4 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Trusted by 50,000+ professionals</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Land Your 
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse">
              Dream Career
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect with world-class companies and unlock opportunities that match your ambitions. 
            <span className="font-semibold text-gray-800"> Your future starts here.</span>
          </p>
          
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4 max-w-4xl mx-auto">
           
           
          </div>
          {searchJob && (
            <div className="mt-4 max-w-4xl mx-auto bg-white/90 rounded-lg shadow-lg p-4">
              <p className="text-gray-600">Suggested: {filteredCategories.map(c => c.name).join(', ')}</p>
            </div>
          )}
        </div>

        {/* Animated Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 ${animateStats ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: `${index * 200}ms`, animationDuration: '1s', animationFillMode: 'both' }}
            >
              <div className={`${stat.bg} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-black ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Why Choose Us?</h2>
          <p className="text-xl text-gray-600">Discover the tools and opportunities to elevate your career</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Companies Section */}
      <div className="container mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Trusted by Leading Companies</h2>
          <p className="text-xl text-gray-600">Partnered with the best in the industry</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {companies.map((company, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 text-center">
              <img src={company.logo} alt={`${company.name} logo`} className="h-16 mx-auto mb-4" />
              <p className="text-gray-800 font-semibold">{company.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Categories */}
      <div className="container mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Trending Job Categories</h2>
          <p className="text-xl text-gray-600">Explore opportunities across high-demand industries</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map((category, index) => (
            <div
              key={index}
              className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2 text-lg">{category.name}</h3>
              <p className="text-gray-600 mb-2">{category.count}</p>
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-semibold">{category.trend}</span>
              </div>
              <ArrowRight className="absolute top-8 right-8 w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="container mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Success Stories</h2>
          <p className="text-xl text-gray-600">Join thousands who found their dream careers</p>
        </div>
        <div className="max-w-4xl mx-auto relative">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-6">"</div>
            <p className="text-2xl text-gray-700 mb-8 font-medium leading-relaxed">
              {testimonials[currentTestimonial].text}
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-800 text-lg">{testimonials[currentTestimonial].name}</div>
                <div className="text-gray-600">{testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}</div>
              </div>
            </div>
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleTestimonialChange(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-blue-600 w-8' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                ></button>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleTestimonialChange((currentTestimonial - 1 + testimonials.length) % testimonials.length)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={() => handleTestimonialChange((currentTestimonial + 1) % testimonials.length)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
      {/* Enhanced CTA */}
      <div className="container mx-auto px-4 mb-20">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white text-center shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-6">Ready to Transform Your Career?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
              Join the revolution. Connect with opportunities that align with your passion and expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-gray-800 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg">
                Explore All Jobs
              </button>
              <button
                onClick={() => setShowLoginSignup(true)}
                className="border-2 border-white text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-gray-800 transition-all duration-300 hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login/Signup Modal */}
      {showLoginSignup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-modal-in">
            <button
              onClick={() => setShowLoginSignup(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
            <LoginSignup onSwitchToOther={() => {}} />
          </div>
        </div>
      )}

      {/* Custom CSS for Animations */}
      <style>
        {`
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slide-up {
            animation: slide-up 0.5s ease-out forwards;
          }

          @keyframes modal-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .animate-modal-in {
            animation: modal-in 0.3s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}

export default Home;