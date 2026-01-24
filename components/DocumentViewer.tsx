"use client";

import { useState } from "react";

interface DocumentViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function DocumentViewer({ url, title, onClose }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  
  const isPDF = url.toLowerCase().includes('.pdf') || url.includes('pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)/i.test(url);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-sm"
            >
              Open in New Tab
            </a>
            <button
              onClick={onClose}
              className="btn btn-secondary text-sm"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 overflow-hidden relative bg-gray-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          )}
          
          {isPDF ? (
            <iframe
              src={`${url}#view=FitH`}
              className="w-full h-full border-0"
              title={title}
              onLoad={() => setLoading(false)}
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={url}
                alt={title}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setLoading(false)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <svg className="w-24 h-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">Document Preview Not Available</h4>
              <p className="text-gray-500 mb-6 max-w-md">
                This file type cannot be previewed in the browser. Please use the button above to open it in a new tab or download it.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Open Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
