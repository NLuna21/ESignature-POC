import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas"; //https://uiwjs.github.io/react-signature/
import { Document, Page, pdfjs } from 'react-pdf';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SignatureDraggable from "./components/SignatureDraggable";
import { useDrop } from "react-dnd";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// import 'react-pdf/dist/esm/Page/TextLayer.css';
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import "./App.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.min.mjs`;

function UploadButton({ onFileSelect }) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    onFileSelect(file);
  };

  return (
    <div>
      <button onClick={handleClick}>📄 Upload PDF</button>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

function handleDownload() {
  const viewer = document.querySelector('.pdf-capture-target');
  if (!viewer) return alert("PDF viewer not found");

  html2canvas(viewer, { scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
  });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('signed-document.pdf');
  });
}

function MyPdfViewer({ selectedFile }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [droppedItem, setDroppedItem] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState({ x: 100, y: 100 });

   const [{ isOver }, dropRef] = useDrop(() => ({
    accept: "SIGNATURE",
    drop: (item) => {
      setDroppedItem(item);
      console.log("Dropped item:", item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleDocumentLoad = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }
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
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const [pageDims, setPageDims] = useState({ width: 0, height: 0 });


  return (
    <div
      ref={dropRef}
      style={{
        position: "relative",
        zIndex: 1,
        border: isOver ? "2px dashed green" : "1px solid #ccc",
        padding: "1rem",
        marginTop: "1rem",
      }}
    >
      {selectedFile ? (
        <>
          <div className="pdf-capture-target" style={{ position: "relative"}}>
            <Document
              file={selectedFile}
              onLoadSuccess={handleDocumentLoad}
              onLoadError={(error) => {
                console.error("PDF load error:", error);
                alert("Failed to load PDF: " + error.message);
              }}
            >
              <Page 
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={(pageView) => {
                const { width, height } = pageView;
                setPageDims({ width, height });
                console.log("Rendered page dimensions:", width, height);

              }}
              />
            </Document>
            {droppedItem && (
              <div
                style={{
                  position: "absolute",
                  top: signaturePosition.y,
                  left: signaturePosition.x,
                  cursor: "move",
                  width: pageDims.width,
                  height: pageDims.height,
                  zIndex: 10,
                  pointerEvents: "auto",
                }}
                onMouseDown={handleDragStart}

              >
                {droppedItem.url.startsWith("data:image") ? (
                  <img src={droppedItem.url} alt="Dropped signature" width={150} />
                ) : (
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {droppedItem.url}
                  </div>
                )}
              </div>
            )}
          </div>
          </>
        ) : (
          <p>No file selected yet. Upload a PDF to begin.</p>
        )}
    </div>
  );
}



export default function App() {
  const [showModal, setShowModal] = useState(false);
  const signRef = useRef(null);
  const [url, setUrl] = useState(""); //locally store signatures
  const [name, setName] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [signatureMode, setSignatureMode] = useState("draw"); //for radio buttons
  const [selectedFile, setSelectedFile] = useState(null);


  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleClear = () => signRef.current?.clear();

  const getJoinedName = (fullName) => fullName.replace(/\s+/g, ""); // Generates Signature based on inputted name

  const getInitials = (fullName) => // Generates Initials ver. of signature
    fullName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");

  const handleUpload = (e) => { // Grabs uploaded image file
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setUploadedImage(base64);
        setUrl(base64); 
        localStorage.setItem("userSignature", base64);
      };
      reader.readAsDataURL(file);
      handleClose();
    } else {
      alert("Please upload a valid image file.");
    }
  };


  const handleSave = () => { // Handles saving of signature based on selected radio button
    let data;

    if (signatureMode === "draw") {
      if (signRef.current?.isEmpty()) {
        alert("No signature drawn!");
        return;
      }
      data = signRef.current.getCanvas().toDataURL("image/png");
    } else if (signatureMode === "name") {
      if (!name.trim()) {
        alert("Please enter your name first.");
        return;
      }
      data = getJoinedName(name);
    } else if (signatureMode === "initials") {
      if (!name.trim()) {
        alert("Please enter your name first.");
        return;
      }
      data = getInitials(name);
    } else {
      alert("Unknown signature mode.");
      return;
    }

    localStorage.setItem("userSignature", data);
    setUrl(data);
    handleClose();
  };





  
  return (
    <DndProvider backend={HTML5Backend}>

      <>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <br />
        <button onClick={handleOpen}>Make E-signature</button>
        {url && (
          <>
            <h4>Drag Your Signature:</h4>
            <SignatureDraggable url={url} />
          </>
        )}



        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Sign Below</h3>
                <input
                  type="radio"
                  name="signatureMode"
                  value="draw"
                  checked={signatureMode === "draw"}
                  onChange={(e) => setSignatureMode(e.target.value)}
                />

              <SignatureCanvas
                canvasProps={{
                  width: 300,
                  height: 100,
                  className: "sigCanvas",
                }}
                ref={signRef}
              />
              <div className="auto-signature">
                <div>
                  <input
                    type="radio"
                    name="signatureMode"
                    value="name"
                    checked={signatureMode === "name"}
                    onChange={(e) => setSignatureMode(e.target.value)}
                  />
                  {getJoinedName(name)}</div>
                  
                <div>
                  <input
                    type="radio"
                    name="signatureMode"
                    value="initials"
                    checked={signatureMode === "initials"}
                    onChange={(e) => setSignatureMode(e.target.value)}
                  />
                  {getInitials(name)}</div>
              </div>
              
              <div className="button-group">
                <button onClick={handleClear}>Clear</button>
                <button onClick={handleSave}>Save</button>
                <div>
                  <label>
                    Or Upload Signature:
                    <input type="file" accept="image/*" onChange={handleUpload} />
                  </label>
                </div>
                <button onClick={handleClose}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      <UploadButton onFileSelect={setSelectedFile} />
      <MyPdfViewer selectedFile={selectedFile} />
      <button onClick={handleDownload}>📥 Download Signed PDF</button>
      </>
    </DndProvider>
  );
  
}