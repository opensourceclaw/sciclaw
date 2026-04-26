import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '../common/Button';
import type { Report } from '../../types';

interface ExportPanelProps {
  report: Report;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ report }) => {
  const handleExportMarkdown = () => {
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportPDF = async () => {
    // Use browser's print to PDF functionality
    window.print();
  };
  
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleExportMarkdown}>
        <Download size={16} className="mr-2" />
        Markdown
      </Button>
      <Button variant="outline" onClick={handleExportPDF}>
        <FileText size={16} className="mr-2" />
        PDF
      </Button>
    </div>
  );
};

export default ExportPanel;
