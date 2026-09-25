import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Search,
  Filter,
  Plus,
  Download,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  FileCheck,
  CheckCircle2,
  Trash2,
  Share2,
  Award,
  Sparkles,
  ArrowLeft,
  Eye,
  Bookmark,
  BookmarkCheck,
  Clock,
  Printer
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import AddMaterialModal from "@/components/AddMaterialModal";
import { initialSeedData } from "@/data/initialSeedData";

interface Material {
  id: string;
  title: string;
  subject: string;
  grade: string;
  category: 'notes' | 'revision' | 'past_paper' | 'syllabus' | 'video';
  term: string;
  author: string;
  downloads: number;
  fileSize: string;
  fileUrl?: string;
  description: string;
  createdAt: string;
  bookmarked?: boolean;
  framework?: { name?: string };
}

const STORAGE_KEY = "munyaka_study_corner_materials";

const DEFAULT_MATERIALS: Material[] = [
  {
    id: "mat_1",
    title: "Grade 4 Mathematics CBC Revision Pack (Term 1-3)",
    subject: "Mathematics",
    grade: "Grade 4",
    category: "revision",
    term: "All Terms",
    author: "Munyaka Academic Dept",
    downloads: 342,
    fileSize: "4.2 MB",
    description: "Comprehensive revision guide covering number operations, fractions, measurement, and geometry with worked examples.",
    createdAt: "2026-01-15",
    framework: { name: "CBC" }
  },
  {
    id: "mat_2",
    title: "Grade 7 Integrated Science Notes & Experiments",
    subject: "Integrated Science",
    grade: "Grade 7",
    category: "notes",
    term: "Term 1",
    author: "Mr. Kiprono",
    downloads: 289,
    fileSize: "8.5 MB",
    description: "Junior Secondary CBC aligned notes covering living things, laboratory safety, mixtures, and the human digestive system.",
    createdAt: "2026-01-20",
    framework: { name: "CBC" }
  },
  {
    id: "mat_3",
    title: "Grade 6 English Composition Masterclass",
    subject: "English",
    grade: "Grade 6",
    category: "notes",
    term: "Term 2",
    author: "Madam Akinyi",
    downloads: 412,
    fileSize: "3.1 MB",
    description: "Step-by-step guide to writing compelling narrative, descriptive, and functional essays for upper primary learners.",
    createdAt: "2026-02-01",
    framework: { name: "CBC" }
  },
  {
    id: "mat_4",
    title: "Grade 8 Agriculture & Nutrition Past Assessment",
    subject: "Agriculture & Nutrition",
    grade: "Grade 8",
    category: "past_paper",
    term: "Term 1",
    author: "National CBC Evaluators",
    downloads: 530,
    fileSize: "2.4 MB",
    description: "Standardized assessment test with complete marking scheme for Junior Secondary CBC agriculture and nutrition.",
    createdAt: "2026-02-10",
    framework: { name: "CBC" }
  },
  {
    id: "mat_5",
    title: "PP2 Environmental Activities Activity Book",
    subject: "Environmental Activities",
    grade: "PP2",
    category: "notes",
    term: "All Terms",
    author: "Early Years Panel",
    downloads: 195,
    fileSize: "6.0 MB",
    description: "Fun and engaging coloring, tracing, and outdoor exploration tasks for pre-primary learners.",
    createdAt: "2026-02-14",
    framework: { name: "CBC" }
  }
];

const StudyCorner: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "bookmarks">("all");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // Load materials on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMaterials(parsed);
          return;
        }
      }
      // Fallback to initialSeedData or defaults
      const seed = (initialSeedData as any)?.studyCorner;
      const initial = Array.isArray(seed) && seed.length > 0 ? seed : DEFAULT_MATERIALS;
      setMaterials(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {
      setMaterials(DEFAULT_MATERIALS);
    }

    try {
      const savedBookmarks = localStorage.getItem("munyaka_study_bookmarks");
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch {}
  }, []);

  // Save materials
  const persistMaterials = (updated: Material[]) => {
    setMaterials(updated || []);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated || []));
    } catch {}
  };

  const toggleBookmark = (id: string) => {
    const list = bookmarks || [];
    const next = list.includes(id)
      ? list.filter(b => b !== id)
      : [...list, id];
    setBookmarks(next);
    try {
      localStorage.setItem("munyaka_study_bookmarks", JSON.stringify(next));
    } catch {}
    showSuccess(list.includes(id) ? "Removed from bookmarks" : "Saved to bookmarks");
  };

  const handleDownload = (mat: Material) => {
    const list = materials || [];
    const updated = list.map(m => m?.id === mat?.id ? { ...m, downloads: (m.downloads || 0) + 1 } : m);
    persistMaterials(updated);
    showSuccess(`Downloading "${mat?.title || 'Material'}" (${mat?.fileSize || ''})…`);
    
    const link = document.createElement('a');
    link.href = mat?.fileUrl || '#';
    link.download = `${(mat?.title || 'material').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    document.body.appendChild(link);
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this learning material?")) return;
    const list = materials || [];
    const filtered = list.filter(m => m?.id !== id);
    persistMaterials(filtered);
    showSuccess("Material deleted successfully.");
  };

  const gradesList = ["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"];
  const subjectsList = ["Mathematics", "English", "Kiswahili", "Science & Technology", "Integrated Science", "Agriculture & Nutrition", "Social Studies", "Environmental Activities"];

  const filteredMaterials = useMemo(() => {
    const list = materials || [];
    return list.filter(m => {
      if (!m) return false;
      const title = m.title || "";
      const subject = m.subject || "";
      const description = m.description || "";
      const author = m.author || "";
      
      const matchesSearch = 
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGrade = selectedGrade === "all" || m.grade === selectedGrade;
      const matchesSubject = selectedSubject === "all" || subject === selectedSubject;
      const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
      const matchesTab = activeTab === "all" || (bookmarks || []).includes(m.id);

      return matchesSearch && matchesGrade && matchesSubject && matchesCategory && matchesTab;
    });
  }, [materials, searchQuery, selectedGrade, selectedSubject, selectedCategory, activeTab, bookmarks]);

  const totalCount = (materials || []).length;
  const bookmarkCount = (bookmarks || []).length;

  return (
    <div className="space-y-6 pb-20 max-w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-inner">
            <BookMarked className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Study Corner</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              CBC learning resources - Grades 1-9 notes, revision guides, &amp; past papers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Learning Material</span>
          </Button>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              All Materials ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5",
                activeTab === "bookmarks" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Bookmark size={15} /> Bookmarks ({bookmarkCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search notes, past papers, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
              Grade Level
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">All Grades (PP1 - Grade 9)</option>
              {(gradesList || []).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
              Learning Area / Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">All Subjects</option>
              {(subjectsList || []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
              Resource Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">All Categories</option>
              <option value="notes">Class Notes</option>
              <option value="revision">Revision Guides</option>
              <option value="past_paper">Past Papers</option>
              <option value="syllabus">Syllabus</option>
              <option value="video">Video Lesson</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {(!filteredMaterials || filteredMaterials.length === 0) ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No learning materials found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Try adjusting your search query or filters, or add a new material to the Study Corner.
          </p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-xl bg-indigo-600 text-white font-bold px-6 h-11"
          >
            <Plus size={16} className="mr-2" /> Add Material
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredMaterials || []).map((mat) => {
            if (!mat) return null;
            const isBookmarked = (bookmarks || []).includes(mat.id);
            const frameworkName = mat?.framework?.name || 'CBC';
            return (
              <Card key={mat.id} className="border border-gray-100 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-xs rounded-lg px-2.5 py-0.5">
                        {mat.grade || 'General'}
                      </Badge>
                      <Badge variant="outline" className="text-gray-600 font-medium text-xs rounded-lg px-2.5 py-0.5">
                        {mat.subject || 'General'}
                      </Badge>
                      {mat.framework && (
                        <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 font-semibold">
                          {frameworkName}
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => toggleBookmark(mat.id)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
                        isBookmarked ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400 hover:text-gray-700"
                      )}
                      title={isBookmarked ? "Bookmarked" : "Bookmark material"}
                    >
                      {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 text-base">
                      {mat.title || 'Untitled Material'}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed font-medium">
                      {mat.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-semibold">
                    <span>By {mat.author || 'Munyaka Staff'}</span>
                    <span>{mat.fileSize || '1.0 MB'} · {mat.downloads || 0} downloads</span>
                  </div>
                </CardContent>

                <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMaterial(mat)}
                    className="rounded-xl border-gray-200 text-gray-700 font-bold text-xs h-9 hover:bg-white"
                  >
                    <Eye size={14} className="mr-1.5" /> Preview
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(mat)}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 shadow-sm"
                    >
                      <Download size={14} className="mr-1.5" /> Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(mat.id)}
                      className="rounded-xl h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete material"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Material Modal */}
      <AddMaterialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newMat) => {
          const list = materials || [];
          const updated = [newMat, ...list];
          persistMaterials(updated);
          showSuccess("Learning material successfully added to Study Corner!");
        }}
      />

      {/* Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-indigo-50 text-indigo-700 font-bold">{previewMaterial.grade || 'General'}</Badge>
                  <Badge variant="outline">{previewMaterial.subject || 'General'}</Badge>
                </div>
                <h2 className="text-xl font-black text-gray-900">{previewMaterial.title || 'Untitled'}</h2>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Author: {previewMaterial.author || 'Staff'}</span>
                  <span>Size: {previewMaterial.fileSize || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Category: {(previewMaterial.category || 'notes').toUpperCase()}</span>
                  <span>Downloads: {previewMaterial.downloads || 0}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-1">Description</h4>
                <p className="leading-relaxed">{previewMaterial.description || 'No description available.'}</p>
              </div>

              <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-3 bg-indigo-50/30">
                <FileText className="w-12 h-12 text-indigo-500 mx-auto" />
                <p className="font-bold text-gray-800">Document Ready for Offline Reading / Printing</p>
                <p className="text-xs text-gray-500">This resource is stored locally on your device and is fully accessible without internet.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setPreviewMaterial(null)}
                className="rounded-xl font-bold"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleDownload(previewMaterial);
                  setPreviewMaterial(null);
                }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 gap-2"
              >
                <Download size={16} /> Download File
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyCorner;
