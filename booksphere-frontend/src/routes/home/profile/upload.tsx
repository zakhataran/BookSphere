import { useState, useRef, useEffect } from 'react';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Upload, Search, X, BookOpen, User, Tag, FileText, Check, Sparkles } from 'lucide-react';
import { CircularProgress } from '@mui/material';
import { uploadBook, previewCover, getAllCategories, analyzeFile } from '../../../api/generated/sdk.gen';

export const Route = createFileRoute('/home/profile/upload')({
  loader: async () => {
    try {
      const response = await getAllCategories();
      if (response.error) throw new Error('Failed to fetch categories');
      return response.data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },
  component: UploadBookPage,
});

const MAX_CATEGORIES = 3;

function UploadBookPage() {
  const router = useRouter();
  const categories = Route.useLoaderData();

  const [title, setTitle] = useState('');
  const [authorFirstName, setAuthorFirstName] = useState('');
  const [authorSecondName, setAuthorSecondName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = categories.filter((cat: any) => 
    cat.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= MAX_CATEGORIES) return prev; 
      return [...prev, id];
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
        setCategorySearch('');
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setPdfFile(file);
    setIsPreviewLoading(true);
    setIsAiAnalyzing(true);

    // Параллельный запуск превью и ИИ-анализа
    const previewPromise = previewCover({ body: { file: file } });
    const aiAnalyzePromise = analyzeFile({ body: { file: file } });

    try {
      const [previewResponse, aiResponse] = await Promise.all([previewPromise, aiAnalyzePromise]);

      if (!previewResponse.error && previewResponse.data) {
        setCoverPreview((previewResponse.data as any).coverUrl); 
      }

      if (!aiResponse.error && aiResponse.data) {
        const aiData = aiResponse.data as any;
        if (aiData.title) setTitle(aiData.title);
        if (aiData.authorFirstName) setAuthorFirstName(aiData.authorFirstName);
        if (aiData.authorSecondName) setAuthorSecondName(aiData.authorSecondName);
        if (aiData.description) setDescription(aiData.description);
        if (aiData.categoryIds && aiData.categoryIds.length > 0) {
          setSelectedCategories(aiData.categoryIds);
        }
      }
    } catch (error) {
      console.error('Failed to process file', error);
      alert('Some automated processes failed. You can still fill in the details manually.');
    } finally {
      setIsPreviewLoading(false);
      setIsAiAnalyzing(false);
    }
  };

  const removeFile = () => {
    setPdfFile(null);
    setCoverPreview(null);
    setTitle('');
    setAuthorFirstName('');
    setAuthorSecondName('');
    setDescription('');
    setSelectedCategories([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pdfFile || selectedCategories.length === 0) {
      alert('Please fill in all fields, select at least one category and attach a PDF file');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await uploadBook({
        body: {
          title: title,
          authorFirstName: authorFirstName,
          authorSecondName: authorSecondName,
          description: description,
          categoryIds: selectedCategories,
          file: pdfFile
        }
      });

      if (response.error) {
        const err = response.error as any;
        const serverMessage = err?.message || err?.detail || err?.error || 'Failed to upload book';
        throw new Error(serverMessage);
      }

      router.navigate({ to: '/home/profile', search: { page: 0, tab: 'my' } });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error?.message || 'An error occurred while uploading the book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4F1]">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/home/profile" 
              search={{ page: 0, tab: 'my' }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">В профиль</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Выгрузка книги</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Book's PDF File
            </h2>
            <div className="flex flex-col sm:flex-row gap-6">
              
              <div className="flex-shrink-0">
                <div className="w-40 h-56 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                  {isPreviewLoading ? (
                    <div className="flex flex-col items-center">
                      <CircularProgress size={24} sx={{ color: '#D97706', mb: 1 }} />
                      <span className="text-xs text-gray-500 mt-2">Generating...</span>
                    </div>
                  ) : coverPreview ? (
                    <div className="relative w-full h-full group">
                      <img 
                        src={coverPreview} 
                        alt="Cover preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeFile}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <span className="text-xs text-gray-400">No file uploaded</span>
                      <span className="block text-[10px] text-gray-400 mt-1 text-center">
                        Please select a PDF file
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
                >
                  <Upload className="w-5 h-5" />
                  Upload PDF
                </button>
                {pdfFile && (
                  <p className="text-sm font-medium text-gray-700 mt-3 text-center truncate">
                    {pdfFile.name}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Only PDF files. Cover is generated automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5 relative">
            
            {/* Оверлей ИИ-загрузки */}
            {isAiAnalyzing && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center">
                 <Sparkles className="w-8 h-8 text-amber-500 animate-bounce mb-3" />
                 <span className="text-sm font-semibold text-amber-700">AI is analyzing the book...</span>
              </div>
            )}

            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Book Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Title *
              </label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Enter book title"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author's First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={authorFirstName}
                    onChange={(e) => setAuthorFirstName(e.target.value)}
                    required
                    placeholder="For example: George"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author's Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={authorSecondName}
                    onChange={(e) => setAuthorSecondName(e.target.value)}
                    required
                    placeholder="For example: Orwell"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Book description (generated by AI or written manually)..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-gray-900 placeholder-gray-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories * <span className="text-gray-400 font-normal">(up to {MAX_CATEGORIES})</span>
              </label>
              <div className="relative category-dropdown">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCategoryDropdown(!showCategoryDropdown);
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-left flex items-center justify-between"
                >
                  <span className={selectedCategories.length ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedCategories.length
                      ? `${selectedCategories.length} selected`
                      : 'Select categories'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                    
                {showCategoryDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Search category..."
                          className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category: any) => {
                          const isSelected = selectedCategories.includes(category.categoryId);
                          const limitReached = !isSelected && selectedCategories.length >= MAX_CATEGORIES;
                          return (
                            <button
                              key={category.categoryId}
                              type="button"
                              disabled={limitReached}
                              onClick={() => toggleCategory(category.categoryId)}
                              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'text-amber-600 font-medium bg-amber-50'
                                  : limitReached
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {category.name}
                              {isSelected && <Check className="w-4 h-4" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          Categories not found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedCategories.map((id) => {
                    const cat = categories.find((c: any) => c.categoryId === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-full"
                      >
                        {cat?.name}
                        <button
                          type="button"
                          onClick={() => toggleCategory(id)}
                          className="hover:text-amber-900"
                          aria-label={`Remove ${cat?.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pb-10">
            <Link
              to="/home/profile"
              search={{ page: 0, tab: 'my' }}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isAiAnalyzing}
              className="flex-1 px-6 py-3 flex justify-center items-center gap-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} color="inherit" />
                  Uploading...
                </>
              ) : (
                'Publish Book'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}