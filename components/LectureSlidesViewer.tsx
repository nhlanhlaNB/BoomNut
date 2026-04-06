'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Share2, Printer } from 'lucide-react';

export interface Slide {
  title: string;
  content: string[];
  keyPoints?: string[];
}

interface LectureSlidesViewerProps {
  slides: Slide[];
  title?: string;
  onClose?: () => void;
}

export default function LectureSlidesViewer({ slides, title, onClose }: LectureSlidesViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenterMode, setIsPresenterMode] = useState(false);

  if (!slides || slides.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No slides generated yet
      </div>
    );
  }

  const slide = slides[currentSlide];
  const nextSlide = () => setCurrentSlide(Math.min(currentSlide + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide(Math.max(currentSlide - 1, 0));

  const downloadSlides = () => {
    const content = slides
      .map((s, i) => `SLIDE ${i + 1}: ${s.title}\n${s.content.join('\n')}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture_slides_${title || 'untitled'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printSlides = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
          }
          
          body {
            background: white !important;
          }
          
          #slides-viewer-print {
            display: block !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
            page-break-after: avoid !important;
          }
          
          #slides-viewer-print .bg-white,
          #slides-viewer-print .bg-gradient-to-r,
          #slides-viewer-print .bg-gray-50,
          #slides-viewer-print .border-t {
            background: white !important;
            border: none !important;
          }
          
          #slides-viewer-header-print {
            display: none !important;
          }
          
          #slides-viewer-navigation-print,
          #slides-viewer-actions-print,
          #slides-viewer-notes-print {
            display: none !important;
          }
          
          #slides-content-print {
            display: block !important;
            padding: 40px !important;
            min-height: auto !important;
            background: white !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
          }
          
          #slides-content-print * {
            color: black !important;
            background: white !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
      <div id="slides-viewer-print" className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div id="slides-viewer-header-print" className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Generated Lecture Slides</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded transition"
              title="Close slides"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Slide Display */}
      <div id="slides-content-print" className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[500px] flex flex-col justify-between">
        {/* Slide Content */}
        <div>
          <div className="text-sm text-gray-500 mb-4">
            Slide {currentSlide + 1} of {slides.length}
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
            {slide.title}
          </h2>

          <div className="space-y-4">
            {slide.content.map((line, idx) => (
              <p
                key={idx}
                className="text-lg text-gray-700 leading-relaxed pl-4 border-l-4 border-indigo-500"
              >
                {line}
              </p>
            ))}
          </div>

          {slide.keyPoints && slide.keyPoints.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-300">
              <h4 className="font-semibold text-gray-900 mb-3">Key Points:</h4>
              <ul className="space-y-2">
                {slide.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700">
                    <span className="text-indigo-600 font-bold mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div id="slides-viewer-navigation-print" className="flex justify-between items-center mt-8">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-3 h-3 rounded-full transition ${
                  idx === currentSlide ? 'bg-indigo-600' : 'bg-gray-400 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div id="slides-viewer-actions-print" className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between gap-3">
        <button
          onClick={printSlides}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          title="Print slides"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>

        <button
          onClick={downloadSlides}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          title="Download slides"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* Presenter Notes (Optional) */}
      {isPresenterMode && (
        <div id="slides-viewer-notes-print" className="bg-gray-100 px-6 py-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">Presenter Notes:</h4>
          <p className="text-gray-700 text-sm">
            Focus on explaining the main concepts above and engage with the audience on key points.
          </p>
        </div>
      )}
    </div>
    </>
  );
}
