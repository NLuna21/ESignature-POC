import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Document, Page } from 'react-pdf';

const MyPdfViewer = ({ selectedFile, setPageDims, signaturePosition, setSignaturePosition }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [droppedItem, setDroppedItem] = useState(null);

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: 'SIGNATURE',
    drop: (item) => {
      setDroppedItem(item);
      console.log('Dropped item:', item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleDocumentLoad = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleDragStart = (e) => {
    e.preventDefault();
    let startX = e.clientX;
    let startY = e.clientY;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      setSignaturePosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      startX = moveEvent.clientX;
      startY = moveEvent.clientY;
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={dropRef}
      style={{
        position: 'relative',
        zIndex: 1,
        border: isOver ? '2px dashed green' : '1px solid #ccc',
        padding: '1rem',
        marginTop: '1rem',
        backgroundColor: '#f9f9f9',
      }}
    >
      {selectedFile ? (
        <div className="pdf-capture-target" style={{ position: 'relative' }}>
          <Document
            file={selectedFile}
            onLoadSuccess={handleDocumentLoad}
            onLoadError={(error) => {
              console.error('PDF load error:', error);
              alert('Failed to load PDF: ' + error.message);
            }}
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={(pageView) => {
                const { width, height, view } = pageView;
                setPageDims({ width, height, pdfHeight: view[3] }); // PDF-native height
              }}
            />
          </Document>

          {droppedItem && (
            <div
              style={{
                position: 'absolute',
                top: signaturePosition.y,
                left: signaturePosition.x,
                zIndex: 10,
                pointerEvents: 'auto',
                cursor: 'move',
                //  background: '#fff',
                // border: '2px solid #007bff',
                padding: '4px',
                // borderRadius: '4px',
                // boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              }}
              onMouseDown={handleDragStart}
            >
              {droppedItem.url.startsWith('data:image') ? (
                <img src={droppedItem.url} alt="Signature" width={150} />
              ) : (
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {droppedItem.url}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p>No file selected yet. Upload a PDF to begin.</p>
      )}
    </div>
  );
};

export default MyPdfViewer;