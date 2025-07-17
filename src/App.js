import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas"; //https://uiwjs.github.io/react-signature/
import { Document, Page, pdfjs } from 'react-pdf';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SignatureDraggable from "./components/SignatureDraggable";
import { useDrop } from "react-dnd";
import { PDFDocument } from 'pdf-lib';
import MyPdfViewer from './components/MyPdfViewer';
// import 'react-pdf/dist/esm/Page/TextLayer.css'
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

async function handleDownloadWithPdfLib(file, signatureUrl, position, pdfHeight) {
  if (!file || !signatureUrl || !position) {
    alert("Missing PDF or signature.");
    return;
  }

  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const page = pdfDoc.getPages()[0]; // You can expand to target multiple pages

  const { x, y } = position;

  if (signatureUrl.startsWith("data:image")) {
    const imageBytes = await fetch(signatureUrl).then(res => res.arrayBuffer());
    const signatureImage = await pdfDoc.embedPng(imageBytes);
    const dims = signatureImage.scale(0.5);

    const imageWidth = dims.width;
    const imageHeight = dims.height;

    const pdfX = x;
    const pdfY = pdfHeight - position.y - imageHeight;

    page.drawImage(signatureImage, {
      x: pdfX,
      y: pdfY,
      width: imageWidth,
      height: imageHeight,
    });
  } else {
    const textSize = 24;
    page.drawText(signatureUrl, {
      x,
      y: page.getHeight() - y - textSize,
      size: textSize,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "signed-traditional.pdf";
  link.click();
}






export default function App() {
  const [showModal, setShowModal] = useState(false);
  const signRef = useRef(null);
  const [url, setUrl] = useState(""); //locally store signatures
  const [name, setName] = useState("");
  const [setUploadedImage] = useState(null);
  const [signatureMode, setSignatureMode] = useState("draw"); //for radio buttons
  const [selectedFile, setSelectedFile] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState({ x: 100, y: 100 });
  const [pageDims, setPageDims] = useState({ width: 0, height: 0, pdfHeight: 0 });


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
      <MyPdfViewer 
        selectedFile={selectedFile} 
        signaturePosition={signaturePosition}
        setSignaturePosition={setSignaturePosition}
        setPageDims={setPageDims}
      />
      <button onClick={()=> handleDownloadWithPdfLib(selectedFile, url, signaturePosition, pageDims.pdfHeight)
      }
    >
      Download Signed PDF
    </button>
      </>
    </DndProvider>
  );
  
}