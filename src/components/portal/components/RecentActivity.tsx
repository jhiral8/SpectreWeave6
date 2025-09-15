'use client';

import React from 'react';
import { Clock, FileText, Edit3, Share2, Trash2 } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'created' | 'modified' | 'shared' | 'deleted';
  projectId: string;
  projectTitle: string;
  timestamp: Date;
  description?: string;
}

interface RecentActivityProps {
  user: any;
  onProjectOpen?: (project: any) => void;
  limit?: number;
  className?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  user,
  onProjectOpen,
  limit = 5,
  className = ''
}) => {
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Mock some activities for now
  React.useEffect(() => {
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'modified',
        projectId: '1',
        projectTitle: 'My First Novel',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        description: 'Updated Chapter 3'
      },
      {
        id: '2',
        type: 'created',
        projectId: '2',
        projectTitle: 'Poetry Collection',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        description: 'Started new project'
      },
      {
        id: '3',
        type: 'shared',
        projectId: '1',
        projectTitle: 'My First Novel',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        description: 'Shared with Sarah'
      }
    ];
    setActivities(mockActivities);
  }, []);
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'created':
        return <FileText className="w-4 h-4 text-green-400" />;
      case 'modified':
        return <Edit3 className="w-4 h-4 text-blue-400" />;
      case 'shared':
        return <Share2 className="w-4 h-4 text-purple-400" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'created':
        return 'Created';
      case 'modified':
        return 'Modified';
      case 'shared':
        return 'Shared';
      case 'deleted':
        return 'Deleted';
      default:
        return 'Updated';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const displayedActivities = activities?.slice(0, limit) || [];

  if (isLoading) {
    return (
      <div className="bg-slate-800/60 border border-purple-700/30 rounded-lg p-6 ai-neural-border">
        <h3 className="text-lg font-surgena text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-purple-600/20 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-purple-600/20 rounded mb-2"></div>
                <div className="h-3 bg-purple-600/20 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-purple-700/30 rounded-lg p-6 ai-neural-border">
      <h3 className="text-lg font-surgena text-white mb-4">Recent Activity</h3>
      
      {displayedActivities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <p className="text-purple-300/70">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 group">
              <div className="w-8 h-8 bg-slate-700/60 rounded-full flex items-center justify-center flex-shrink-0 ai-confidence-border">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="text-purple-300">
                        {getActivityText(activity)}
                      </span>{' '}
                      <button
                        onClick={() => onProjectOpen?.({ id: activity.projectId, title: activity.projectTitle })}
                        className="font-medium text-white hover:text-purple-300 transition-colors truncate inline-block max-w-xs"
                        title={activity.projectTitle}
                      >
                        {activity.projectTitle}
                      </button>
                    </p>
                    
                    {activity.description && (
                      <p className="text-xs text-purple-400/70 mt-1 line-clamp-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  
                  <span className="text-xs text-purple-400/60 flex-shrink-0 ml-2">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {activities && activities.length > limit && (
            <div className="text-center pt-4 border-t border-purple-700/30">
              <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                View all activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { RecentActivity };