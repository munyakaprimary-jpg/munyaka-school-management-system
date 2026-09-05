import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Clock, 
  GraduationCap, 
  FileText, 
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';

export interface AssessmentConfig {
  examTitle: string;
  assessmentCategory: string;
  classLevel: string;
  subject: string;
  duration: number;
  totalMarks: number;
  randomizeQuestions: boolean;
  showImmediateFeedback: boolean;
  offlineSyncEnabled: boolean;
}

const defaultConfig: AssessmentConfig = {
  examTitle: '',
  assessmentCategory: '',
  classLevel: '',
  subject: '',
  duration: 60,
  totalMarks: 100,
  randomizeQuestions: false,
  showImmediateFeedback: true,
  offlineSyncEnabled: true,
};

const STORAGE_KEY = 'assessment_config';

const ASSESSMENT_CATEGORIES = [
  { value: 'formative', label: 'Formative Quiz', description: 'Short, frequent assessments' },
  { value: 'summative', label: 'Summative Quiz', description: 'End-of-topic assessment' },
  { value: 'midterm', label: 'Mid-Term Exam', description: 'Semester midpoint evaluation' },
  { value: 'endterm', label: 'End-Term Exam', description: 'Final semester examination' },
  { value: 'revision', label: 'Revision Test', description: 'Practice and review session' },
  { value: 'diagnostic', label: 'Diagnostic Test', description: 'Identify learning gaps' },
];

const CLASS_LEVELS = [
  { value: '1', label: 'Class 1', range: 'Ages 6-7' },
  { value: '2', label: 'Class 2', range: 'Ages 7-8' },
  { value: '3', label: 'Class 3', range: 'Ages 8-9' },
  { value: '4', label: 'Class 4', range: 'Ages 9-10' },
  { value: '5', label: 'Class 5', range: 'Ages 10-11' },
  { value: '6', label: 'Class 6', range: 'Ages 11-12' },
  { value: '7', label: 'Class 7', range: 'Ages 12-13' },
  { value: '8', label: 'Class 8', range: 'Ages 13-14' },
  { value: '9', label: 'Class 9', range: 'Ages 14-15' },
  { value: '10', label: 'Class 10', range: 'Ages 15-16' },
  { value: '11', label: 'Class 11', range: 'Ages 16-17' },
  { value: '12', label: 'Class 12', range: 'Ages 17-18' },
];

const SUBJECTS = [
  { value: 'mathematics', label: 'Mathematics', icon: '🔢', color: 'bg-blue-100 text-blue-700' },
  { value: 'science', label: 'Science', icon: '🔬', color: 'bg-green-100 text-green-700' },
  { value: 'english', label: 'English', icon: '📖', color: 'bg-purple-100 text-purple-700' },
  { value: 'hindi', label: 'Hindi', icon: '📝', color: 'bg-orange-100 text-orange-700' },
  { value: 'social-studies', label: 'Social Studies', icon: '🌍', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'physics', label: 'Physics', icon: '⚡', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'chemistry', label: 'Chemistry', icon: '🧪', color: 'bg-pink-100 text-pink-700' },
  { value: 'biology', label: 'Biology', icon: '🧬', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'history', label: 'History', icon: '🏛️', color: 'bg-amber-100 text-amber-700' },
  { value: 'geography', label: 'Geography', icon: '🗺️', color: 'bg-teal-100 text-teal-700' },
];

export default function AssessmentSettings() {
  const [config, setConfig] = useState<AssessmentConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig({ ...defaultConfig, ...parsed });
      } catch {
        console.error('Failed to parse stored config');
      }
    }
    setIsLoaded(true);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');

    // Persist to localStorage with try/catch + success toast
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        setSaveStatus('saved');
        showSuccess('Assessment settings saved successfully.');
      } catch (e) {
        console.error('[AssessmentSettings] Failed to save:', e);
        setSaveStatus('idle');
      }
      // Reset status after showing saved confirmation
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 300);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    localStorage.removeItem(STORAGE_KEY);
    setSaveStatus('idle');
  };

  const updateField = <K extends keyof AssessmentConfig>(
    key: K,
    value: AssessmentConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Assessment Settings</h1>
              <p className="text-sm text-slate-500">Configure your exam parameters</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <Badge 
            variant={isOnline ? "default" : "secondary"}
            className={`flex items-center gap-1.5 px-3 py-1.5 ${
              isOnline 
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 pb-10 pt-8 px-6">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium uppercase tracking-wide">Step 1</span>
              </div>
              <CardTitle className="text-2xl text-white">Basic Information</CardTitle>
              <CardDescription className="text-white/70">
                Set up the fundamental details for your assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Exam Title */}
              <div className="space-y-2">
                <Label htmlFor="examTitle" className="text-slate-700 font-semibold">
                  Exam/Quiz Title
                </Label>
                <Input
                  id="examTitle"
                  placeholder="e.g., Chapter 5 - Algebra Fundamentals"
                  value={config.examTitle}
                  onChange={(e) => updateField('examTitle', e.target.value)}
                  className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 transition-all"
                />
              </div>

              {/* Assessment Category */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold">
                  Assessment Category
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ASSESSMENT_CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => updateField('assessmentCategory', category.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                        config.assessmentCategory === category.value
                          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-200'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium text-sm text-slate-800">
                        {category.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {category.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class & Subject */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 pb-10 pt-8 px-6">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm font-medium uppercase tracking-wide">Step 2</span>
              </div>
              <CardTitle className="text-2xl text-white">Class & Subject</CardTitle>
              <CardDescription className="text-white/70">
                Define the target audience and subject matter
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Class Level */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold">
                  Class/Grade Level
                </Label>
                <Select
                  value={config.classLevel}
                  onValueChange={(value) => updateField('classLevel', value)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-emerald-200">
                    <SelectValue placeholder="Select class level" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{level.label}</span>
                          <span className="text-slate-400 text-sm ml-4">{level.range}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold">
                  Subject
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject.value}
                      onClick={() => updateField('subject', subject.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                        config.subject === subject.value
                          ? `${subject.color} border-current shadow-md`
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{subject.icon}</div>
                      <div className="font-medium text-xs text-slate-700">
                        {subject.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exam Parameters */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 pb-10 pt-8 px-6">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium uppercase tracking-wide">Step 3</span>
              </div>
              <CardTitle className="text-2xl text-white">Exam Parameters</CardTitle>
              <CardDescription className="text-white/70">
                Set duration and scoring requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-slate-700 font-semibold">
                    Duration (minutes)
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="300"
                      value={config.duration}
                      onChange={(e) => updateField('duration', parseInt(e.target.value) || 0)}
                      className="h-14 pl-12 rounded-xl border-slate-200 focus:border-amber-500 focus:ring-amber-200 text-lg font-medium"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[30, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => updateField('duration', mins)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          config.duration === mins
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Marks */}
                <div className="space-y-2">
                  <Label htmlFor="totalMarks" className="text-slate-700 font-semibold">
                    Total Marks
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="totalMarks"
                      type="number"
                      min="1"
                      max="500"
                      value={config.totalMarks}
                      onChange={(e) => updateField('totalMarks', parseInt(e.target.value) || 0)}
                      className="h-14 pl-12 rounded-xl border-slate-200 focus:border-amber-500 focus:ring-amber-200 text-lg font-medium"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[50, 100, 150, 200].map((marks) => (
                      <button
                        key={marks}
                        onClick={() => updateField('totalMarks', marks)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          config.totalMarks === marks
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {marks}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Options */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 pb-10 pt-8 px-6">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium uppercase tracking-wide">Step 4</span>
              </div>
              <CardTitle className="text-2xl text-white">Assessment Options</CardTitle>
              <CardDescription className="text-white/70">
                Configure how the assessment will be delivered
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Randomize Questions */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="randomize" className="text-slate-800 font-semibold cursor-pointer">
                      Randomize Questions
                    </Label>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Shuffle question order for each student
                    </p>
                  </div>
                </div>
                <Switch
                  id="randomize"
                  checked={config.randomizeQuestions}
                  onCheckedChange={(checked) => updateField('randomizeQuestions', checked)}
                  className="data-[state=checked]:bg-slate-500"
                />
              </div>

              {/* Show Immediate Feedback */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="feedback" className="text-slate-800 font-semibold cursor-pointer">
                      Show Immediate Feedback
                    </Label>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Display results right after submission
                    </p>
                  </div>
                </div>
                <Switch
                  id="feedback"
                  checked={config.showImmediateFeedback}
                  onCheckedChange={(checked) => updateField('showImmediateFeedback', checked)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {/* Offline Sync */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="offlineSync" className="text-slate-800 font-semibold cursor-pointer">
                      Offline Sync Enabled
                    </Label>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Store data locally for offline access
                    </p>
                  </div>
                </div>
                <Switch
                  id="offlineSync"
                  checked={config.offlineSyncEnabled}
                  onCheckedChange={(checked) => updateField('offlineSyncEnabled', checked)}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="h-14 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-semibold text-slate-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`h-14 rounded-xl font-semibold flex-1 transition-all duration-300 ${
                saveStatus === 'saved'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
              }`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Settings Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>

          {/* Offline Notice */}
          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">You're currently offline</p>
                <p className="text-sm text-amber-600">
                  Your settings are saved locally and will sync when you're back online.
                </p>
              </div>
            </div>
          )}

          {/* Summary Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-lg mb-4">Configuration Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Title</p>
                  <p className="text-white font-medium truncate">
                    {config.examTitle || 'Not set'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Category</p>
                  <p className="text-white font-medium">
                    {ASSESSMENT_CATEGORIES.find(c => c.value === config.assessmentCategory)?.label || 'Not set'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Class</p>
                  <p className="text-white font-medium">
                    {config.classLevel ? `Class ${config.classLevel}` : 'Not set'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Subject</p>
                  <p className="text-white font-medium">
                    {SUBJECTS.find(s => s.value === config.subject)?.label || 'Not set'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Duration</p>
                  <p className="text-white font-medium">{config.duration} min</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Total Marks</p>
                  <p className="text-white font-medium">{config.totalMarks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
