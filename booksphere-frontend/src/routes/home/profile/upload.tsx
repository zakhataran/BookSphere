import { useState, useRef, useEffect } from 'react';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Upload, Search, X, BookOpen, User, Tag, FileText } from 'lucide-react';
import { CircularProgress } from '@mui/material';
import { uploadBook, previewCover, getAllCategories } from '../../../api/generated/sdk.gen';

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

function UploadBookPage() {
  const router = useRouter();
  const categories = Route.useLoaderData();

  console.log('МОИ КАТЕГОРИИ ИЗ БЭКЕНДА:', categories);

  const [title, setTitle] = useState('');
  const [authorFirstName, setAuthorFirstName] = useState('');
  const [authorSecondName, setAuthorSecondName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = categories.filter((cat: any) => 
    cat.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );

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

    try {
      const response = await previewCover({
        body: {
          file: file
        }
      });

      if (response.error) {
        console.error('SERVER ERROR:', response.error); 
        throw new Error('Preview failed');
      }
      
      setCoverPreview((response.data as any).coverUrl); 
    } catch (error) {
      console.error('Failed to generate preview', error);
      alert('Failed to generate cover preview. Please try again.');
      setCoverPreview(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const removeFile = () => {
    setPdfFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pdfFile || !selectedCategory) {
      alert('Please fill in all fields and attach a PDF file');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await uploadBook({
        body: {
          title: title,
          authorFirstName: authorFirstName,
          authorSecondName: authorSecondName,
          categoryId: selectedCategory as number,
          file: pdfFile
        }
      });

      if (response.error) {
        throw new Error('Failed to upload book');
      }

      router.navigate({ to: '/home/profile', search: { page: 0 } });
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred while uploading the book');
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
              search={{ page: 0 }}
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

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
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

            {/* 🔥 Разделенные поля для Имени и Фамилии */}
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
                Category *
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
                  <span className={selectedCategory ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedCategory 
                      ? categories.find((c: any) => c.categoryId === selectedCategory)?.name 
                      : 'Select a category'}
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
                        filteredCategories.map((category: any) => (
                          <button
                            key={category.categoryId}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category.categoryId);
                              setShowCategoryDropdown(false);
                              setCategorySearch('');
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              selectedCategory === category.categoryId 
                                ? 'text-amber-600 font-medium bg-amber-50' 
                                : 'text-gray-700'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          Categories not found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pb-10">
            <Link
              to="/home/profile"
              search={{ page: 0 }}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
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