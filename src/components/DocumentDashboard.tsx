import React, { useState } from 'react';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  status: 'indexed' | 'analyzing' | 'error' | 'sensitive';
  confidence: number;
  createdAt: string;
}

interface DocumentDashboardProps {
  documents?: Document[];
}

const statusColors = {
  indexed: 'bg-success-500',
  analyzing: 'bg-warning-500',
  error: 'bg-error-500',
  sensitive: 'bg-error-600',
};

const statusLabels = {
  indexed: 'Indexed',
  analyzing: 'Analyzing',
  error: 'Error',
  sensitive: 'Sensitive',
};

export const DocumentDashboard: React.FC<DocumentDashboardProps> = ({ documents = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const documentTypes = [...new Set(documents.map((d) => d.type))];

  return (
    <div className="flex flex-col h-full bg-secondary-50 dark:bg-secondary-900">
      {/* Header */}
      <header className="px-6 py-4 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-white">
            Document Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary-500">
              {filteredDocuments.length} documents
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4">
          <input
            type="search"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Search documents"
          />
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white"
            aria-label="Filter by document type"
          >
            <option value="all">All Types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="indexed">Indexed</option>
            <option value="analyzing">Analyzing</option>
            <option value="error">Error</option>
            <option value="sensitive">Sensitive</option>
          </select>
        </div>
      </header>

      {/* Document List */}
      <main className="flex-1 overflow-auto p-6">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-secondary-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">No documents found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

interface DocumentCardProps {
  document: Document;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  return (
    <article 
      className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-document-card border border-secondary-200 dark:border-secondary-700 hover:shadow-md transition-shadow"
      aria-label={`Document: ${document.name}`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-secondary-900 dark:text-white truncate flex-1">
          {document.name}
        </h3>
        <span 
          className={`ml-2 px-2 py-1 text-xs font-medium text-white rounded-full ${statusColors[document.status]}`}
          aria-label={`Status: ${statusLabels[document.status]}`}
        >
          {statusLabels[document.status]}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-secondary-600 dark:text-secondary-400">
          <span className="font-medium mr-2">Type:</span>
          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
            {document.type}
          </span>
        </div>

        <div className="flex items-center text-secondary-600 dark:text-secondary-400">
          <span className="font-medium mr-2">Category:</span>
          <span>{document.category}</span>
        </div>

        <div className="flex items-center text-secondary-600 dark:text-secondary-400">
          <span className="font-medium mr-2">Confidence:</span>
          <div className="flex-1 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${document.confidence * 100}%` }}
              role="progressbar"
              aria-valuenow={document.confidence * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="ml-2">{Math.round(document.confidence * 100)}%</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-secondary-200 dark:border-secondary-700">
        <time className="text-xs text-secondary-500" dateTime={document.createdAt}>
          {new Date(document.createdAt).toLocaleDateString()}
        </time>
      </div>
    </article>
  );
};

export default DocumentDashboard;
