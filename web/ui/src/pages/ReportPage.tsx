import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';
import { MarkdownRenderer } from '../components/report/MarkdownRenderer';
import { TableOfContents } from '../components/report/TableOfContents';
import { ExportPanel } from '../components/report/ExportPanel';
import { Button } from '../components/common/Button';
import { useResearchStore } from '../store/useResearchStore';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentReport, loadReport } = useResearchStore();
  const [activeHeading, setActiveHeading] = useState('');
  
  useEffect(() => {
    if (id) {
      loadReport(id);
    }
  }, [id, loadReport]);
  
  const handleHeadingClick = (headingId: string) => {
    setActiveHeading(headingId);
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  if (!currentReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Loading report...</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft size={18} className="mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/results')}>
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentReport.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText size={14} />
                  {currentReport.sources.length} sources
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(currentReport.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <ExportPanel report={currentReport} />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents Sidebar */}
          <aside className="w-full lg:w-64 shrink-0 hidden lg:block">
            <TableOfContents
              content={currentReport.content}
              activeId={activeHeading}
              onHeadingClick={handleHeadingClick}
            />
          </aside>
          
          {/* Markdown Content */}
          <article className="flex-1 max-w-3xl">
            <MarkdownRenderer
              content={currentReport.content}
            />
          </article>
        </div>
      </main>
    </div>
  );
};

export default ReportPage;
