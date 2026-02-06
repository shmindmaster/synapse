import React from 'react';
import { 
  Code, Scale, BookOpen, FileText, FileSignature, 
  ChevronDown, Check, Settings 
} from 'lucide-react';
import { 
  getAllProfiles, 
  getProfile, 
  IngestionProfile,
  DEFAULT_PROFILE_ID 
} from '../services/ingestionProfiles';

interface ProfileSelectorProps {
  selectedProfileId: string;
  onProfileChange: (profileId: string) => void;
  compact?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Scale,
  BookOpen,
  FileText,
  FileSignature,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || FileText;
}

export function ProfileSelector({ 
  selectedProfileId, 
  onProfileChange,
  compact = false 
}: ProfileSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const profiles = getAllProfiles();
  const selectedProfile = getProfile(selectedProfileId);
  const SelectedIcon = getIcon(selectedProfile.icon);

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors"
        >
          <SelectedIcon className="w-4 h-4 text-blue-400" />
          <span className="text-gray-200">{selectedProfile.name}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            {profiles.map(profile => {
              const Icon = getIcon(profile.icon);
              const isSelected = profile.id === selectedProfileId;
              return (
                <button
                  key={profile.id}
                  onClick={() => {
                    onProfileChange(profile.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-750 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    isSelected ? 'bg-gray-750' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200">{profile.name}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Settings className="w-4 h-4" />
        <span>Ingestion Profile</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map(profile => {
          const Icon = getIcon(profile.icon);
          const isSelected = profile.id === selectedProfileId;
          
          return (
            <button
              key={profile.id}
              onClick={() => onProfileChange(profile.id)}
              className={`flex flex-col items-start gap-2 p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className={`font-medium ${isSelected ? 'text-blue-300' : 'text-gray-200'}`}>
                  {profile.name}
                </span>
                {isSelected && <Check className="w-4 h-4 text-blue-400 ml-auto" />}
              </div>
              <p className="text-xs text-gray-500 text-left line-clamp-2">
                {profile.description}
              </p>
            </button>
          );
        })}
      </div>
      
      <ProfileDetails profile={selectedProfile} />
    </div>
  );
}

function ProfileDetails({ profile }: { profile: IngestionProfile }) {
  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(0)}GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  return (
    <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-500">Max file size</span>
          <div className="text-gray-300 font-medium">{formatSize(profile.maxFileSize)}</div>
        </div>
        <div>
          <span className="text-gray-500">Total limit</span>
          <div className="text-gray-300 font-medium">{formatSize(profile.maxTotalSize)}</div>
        </div>
        <div>
          <span className="text-gray-500">Chunking</span>
          <div className="text-gray-300 font-medium capitalize">{profile.chunking.strategy}</div>
        </div>
        <div>
          <span className="text-gray-500">Features</span>
          <div className="text-gray-300 font-medium">
            {[
              profile.respectGitignore && 'gitignore',
              profile.ocrEnabled && 'OCR',
              profile.tableExtraction && 'tables',
            ].filter(Boolean).join(', ') || 'basic'}
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_PROFILE_ID };
