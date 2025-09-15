'use client';

import React from 'react';
import { Sparkles, ArrowRight, Star } from 'lucide-react';

interface WelcomeBannerProps {
  user: any;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  user
}) => {
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Writer';
  const isNewUser = false;
  const projectCount = 3; // Mock project count
  const showQuickTips = true;
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getWelcomeMessage = () => {
    if (isNewUser) {
      return "Welcome to SpectreWeave! Let's get you started with your first writing project.";
    }
    if (projectCount === 0) {
      return "Ready to begin your writing journey? Create your first project to get started.";
    }
    return "Welcome back! Continue working on your projects or start something new.";
  };

  const quickTips = [
    "Use AI assistance for brainstorming and editing",
    "Organize projects with folders and tags", 
    "Collaborate with teammates in real-time",
    "Export your work in multiple formats"
  ];

  return (
    <div className="relative bg-gradient-to-br from-purple-900/40 via-slate-800/60 to-purple-800/40 border border-purple-700/40 rounded-xl p-8 ai-neural-border overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-transparent to-blue-600/5"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-surgena text-white">
                {getGreeting()}, {userName}!
              </h2>
            </div>
            
            <p className="text-purple-200/80 text-lg mb-4 max-w-2xl">
              {getWelcomeMessage()}
            </p>

            <div className="flex flex-wrap gap-3">
              {isNewUser || projectCount === 0 ? (
                <button
                  onClick={() => console.log('Get started clicked')}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all ai-confidence-border"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => console.log('Explore features clicked')}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all ai-confidence-border"
                >
                  <Star className="w-4 h-4" />
                  <span>Explore Features</span>
                </button>
              )}
              
              <button className="px-6 py-3 bg-slate-700/60 hover:bg-slate-600/60 text-purple-200 rounded-lg border border-purple-600/30 transition-all ai-data-flow">
                View Documentation
              </button>
            </div>
          </div>
          
          {showQuickTips && (
            <div className="hidden lg:block w-80 ml-8">
              <div className="bg-slate-700/40 border border-purple-600/30 rounded-lg p-4 ai-confidence-border">
                <h3 className="text-sm font-surgena text-purple-200 mb-3">Quick Tips</h3>
                <ul className="space-y-2">
                  {quickTips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2 text-xs text-purple-300/80">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {!isNewUser && projectCount > 0 && (
          <div className="flex items-center space-x-6 text-sm text-purple-300/70">
            <div className="flex items-center space-x-1">
              <span className="text-purple-400 font-medium">{projectCount}</span>
              <span>active {projectCount === 1 ? 'project' : 'projects'}</span>
            </div>
            <div className="w-1 h-1 bg-purple-500/50 rounded-full"></div>
            <div>Last login: Today</div>
          </div>
        )}
      </div>
    </div>
  );
};

export { WelcomeBanner };