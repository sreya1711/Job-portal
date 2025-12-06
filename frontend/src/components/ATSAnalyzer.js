import React, { useState } from 'react';
import { FileText, CheckCircle, XCircle, AlertTriangle, Upload, BarChart3 } from 'lucide-react';
import { toast } from 'react-toastify';

const ATSAnalyzer = ({ job, onAnalysisComplete, onClose }) => {
  const [resumeFile, setResumeFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Debug logging
  console.log('ATSAnalyzer job prop:', job);

  const analyzeResume = async () => {
    if (!resumeFile) {
      toast.error('Please select a resume file to analyze');
      return;
    }

    setAnalyzing(true);

    try {
      // Simulate ATS analysis (in a real app, this would call an AI service)
      const mockAnalysis = await performATSAnalysis(resumeFile, job);
      setAnalysisResult(mockAnalysis);
      onAnalysisComplete && onAnalysisComplete(mockAnalysis);
    } catch (error) {
      console.error('ATS analysis error:', error);
      toast.error('Failed to analyze resume. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const performATSAnalysis = async (file, jobDetails) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock ATS analysis based on job requirements
    const jobKeywords = jobDetails.requirements || [];
    const jobTitle = jobDetails.title?.toLowerCase() || '';
    const jobDescription = jobDetails.description?.toLowerCase() || '';

    console.log('ATSAnalysis - jobDetails:', jobDetails);
    console.log('ATSAnalysis - jobKeywords:', jobKeywords);

    // Simulate keyword matching
    const matchedKeywords = [];
    const missingKeywords = [];

    // Check for common keywords that ATS systems look for
    const commonKeywords = [
      'javascript', 'react', 'python', 'java', 'node.js', 'html', 'css',
      'sql', 'database', 'api', 'git', 'agile', 'scrum', 'leadership',
      'communication', 'teamwork', 'problem solving', 'analytical'
    ];

    jobKeywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      // Simulate 70% chance of matching for demo purposes
      if (Math.random() > 0.3) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });

    // Calculate ATS score based on various factors
    const keywordScore = jobKeywords.length > 0 ? (matchedKeywords.length / jobKeywords.length) * 100 : 0;
    const formatScore = file.name.toLowerCase().includes('.pdf') ? 95 : 85; // PDF preferred
    const lengthScore = Math.min(100, Math.max(60, 85 + (Math.random() * 15))); // Simulate length analysis
    const overallScore = Math.round((keywordScore * 0.6) + (formatScore * 0.2) + (lengthScore * 0.2));

    // Generate recommendations
    const recommendations = [];

    if (keywordScore < 70) {
      recommendations.push('Add more relevant keywords from the job description');
    }
    if (formatScore < 90) {
      recommendations.push('Consider using PDF format for better ATS compatibility');
    }
    if (lengthScore < 80) {
      recommendations.push('Ensure resume is comprehensive but not too lengthy');
    }
    if (!matchedKeywords.some(k => k.toLowerCase().includes('experience'))) {
      recommendations.push('Highlight relevant work experience more prominently');
    }

    // Section analysis
    const sections = {
      contact: { present: Math.random() > 0.1, score: Math.round(85 + Math.random() * 15) },
      summary: { present: Math.random() > 0.2, score: Math.round(75 + Math.random() * 25) },
      experience: { present: Math.random() > 0.05, score: Math.round(80 + Math.random() * 20) },
      education: { present: Math.random() > 0.1, score: Math.round(85 + Math.random() * 15) },
      skills: { present: Math.random() > 0.15, score: Math.round(70 + Math.random() * 30) },
      certifications: { present: Math.random() > 0.3, score: Math.round(60 + Math.random() * 40) }
    };

    return {
      overallScore,
      keywordScore: Math.round(keywordScore),
      formatScore,
      lengthScore: Math.round(lengthScore),
      matchedKeywords,
      missingKeywords,
      recommendations,
      sections,
      jobTitle: jobDetails.title,
      companyName: jobDetails.company
    };
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center">
              <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
              Resume ATS Analyzer
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {!analysisResult ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-800 mb-2">Analyze Your Resume</h4>
                <p className="text-blue-700 mb-4">
                  Upload your resume to get an ATS compatibility score and recommendations for the job:
                  <strong className="block mt-1">{job.title} at {job.company}</strong>
                </p>

                <div className="bg-white p-4 rounded border border-blue-100">
                  <h5 className="font-medium text-gray-900 mb-2">Job Requirements:</h5>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements?.slice(0, 8).map((req, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {req}
                      </span>
                    ))}
                    {job.requirements?.length > 8 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        +{job.requirements.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Resume (PDF or Word)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {resumeFile && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      Selected: {resumeFile.name}
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={analyzeResume}
                    disabled={analyzing || !resumeFile}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {analyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Analyze Resume
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(analysisResult.overallScore)} mb-4`}>
                  <span className={`text-3xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                    {analysisResult.overallScore}
                  </span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">ATS Compatibility Score</h4>
                <p className="text-gray-600">
                  Your resume's compatibility with {analysisResult.jobTitle} at {analysisResult.companyName}
                </p>
              </div>

              {/* Detailed Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysisResult.keywordScore)} mb-1`}>
                    {analysisResult.keywordScore}%
                  </div>
                  <div className="text-sm text-gray-600">Keyword Match</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysisResult.formatScore)} mb-1`}>
                    {analysisResult.formatScore}%
                  </div>
                  <div className="text-sm text-gray-600">Format Score</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysisResult.lengthScore)} mb-1`}>
                    {analysisResult.lengthScore}%
                  </div>
                  <div className="text-sm text-gray-600">Content Score</div>
                </div>
              </div>

              {/* Keyword Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Matched Keywords ({analysisResult.matchedKeywords.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.matchedKeywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    Missing Keywords ({analysisResult.missingKeywords.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.missingKeywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section Analysis */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-4">Resume Sections Analysis</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(analysisResult.sections).map(([section, data]) => (
                    <div key={section} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        {data.present ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{section}</div>
                      <div className={`text-sm font-bold ${getScoreColor(data.score)}`}>
                        {data.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  Recommendations to Improve ATS Score
                </h5>
                <div className="space-y-3">
                  {analysisResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 border border-yellow-300 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-xs font-medium text-yellow-800">{index + 1}</span>
                      </div>
                      <span className="text-gray-800">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Analyze Another Resume
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Continue with Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ATSAnalyzer;