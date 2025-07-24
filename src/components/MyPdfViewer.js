import React, { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { pdfjs, Document, Page } from 'react-pdf';
import PlacedSignature from './PlacedSignature';
import SignaturePlaceholder from './SignaturePlaceholder';

pdfjs.GlobalWorkerOptions.workerSrc = `/my-app/pdf.worker.min.js`;

const MyPdfViewer = ({
  selectedFile,
  setPageDims,
  signatureFields,
  setSignatureFields,
  setActiveFieldId,
  handleOpenSignatureModal,
  hasDroppedSignature,
  setHasDroppedSignature,
}) => {
  const [pageNumber, setPageNumber] = useState(1);
  const dropRef = useRef(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'SIGNATURE_SLOT',
    drop: (item, monitor) => {
      const offset = monitor.getSourceClientOffset();
      const pdfRect = document.getElementById("pdf-container")?.getBoundingClientRect();
      if (!offset || !pdfRect || hasDroppedSignature) return;


      const x = offset.x - pdfRect.left;
      const y = offset.y - pdfRect.top;
      const adjustedY = y - 30;

      const newField = {
        id: `field-${Date.now()}`,
        x,
        y: adjustedY,
        url: null,
      };

      setSignatureFields((prev) => [...prev, newField]);
      setHasDroppedSignature(true);
    },
}));

  drop(dropRef);

  const handleDocumentLoad = ({ numPages }) => {
    setPageNumber(1);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        id="pdf-container"
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
              onLoadError={(err) => {
                console.error('PDF load error:', err);
                alert('Failed to load PDF');
              }}
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={(pageView) => {
                  const { width, height, view } = pageView;
                  setPageDims({ width, height, pdfHeight: view[3] });
                }}
              />
            </Document>

            {/* 🟨 Placeholder before signing */}
            {signatureFields.map((field) =>
              field.url ? (
                <PlacedSignature
                  key={field.id}
                  url={field.url}
                  position={{ x: field.x, y: field.y }}
                  onPositionChange={(pos) => {
                    setSignatureFields((prev) =>
                      prev.map((f) =>
                        f.id === field.id ? { ...f, ...pos } : f
                      )
                    );
                  }}
                  draggable={false}
                />
              ) : (
                <SignaturePlaceholder
                  key={field.id}
                  position={{ x: field.x, y: field.y }}
                  onPositionChange={(pos) => {
                    setSignatureFields((prev) =>
                      prev.map((f) =>
                        f.id === field.id ? { ...f, ...pos } : f
                      )
                    );
                  }}
                  onClick={() => {
                    setActiveFieldId(field.id);
                    handleOpenSignatureModal();
                  }}
                  field={field} // ✅ Pass field object
                  setActiveFieldId={setActiveFieldId} // ✅ Pass setter
                  handleOpenSignatureModal={handleOpenSignatureModal}
                />
              )
            )}
          </div>
        ) : (
          <p>No file selected yet. Upload a PDF to begin.</p>
        )}
      </div>
    </div>
  );
};

export default MyPdfViewer;