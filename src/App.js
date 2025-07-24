import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SignatureDraggable from "./components/SignatureDraggable";
import { PDFDocument } from 'pdf-lib';
import MyPdfViewer from './components/MyPdfViewer';
import DropWrapper from "./components/DropWrapper";
import PlacedSignature from "./components/PlacedSignature";
import "./App.css";

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

async function handleDownloadWithPdfLib(file, signatureFields, pdfHeight) {
  if (!file || !signatureFields || signatureFields.length === 0) {
    alert("Missing PDF or signature.");
    return;
  }

  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const page = pdfDoc.getPages()[0];

  for (const field of signatureFields) {
    const { x, y, url } = field;
    if (!url) continue;

    if (url.startsWith("data:image")) {
      const imageBytes = await fetch(url).then(res => res.arrayBuffer());
      const signatureImage = await pdfDoc.embedPng(imageBytes);
      const dims = signatureImage.scale(0.5);

      const imageWidth = dims.width;
      const imageHeight = dims.height;

      const pdfX = x;
      const pdfY = pdfHeight - y - imageHeight;

      page.drawImage(signatureImage, {
        x: pdfX,
        y: pdfY,
        width: imageWidth,
        height: imageHeight,
      });
    } else {
      const textSize = 24;
      page.drawText(url, {
        x,
        y: page.getHeight() - y - textSize,
        size: textSize,
      });
    }
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
  const [url, setUrl] = useState(""); // signature data
  const [name, setName] = useState("");
  const [setUploadedImage] = useState(null);
  const [signatureMode, setSignatureMode] = useState("draw");
  const [selectedFile, setSelectedFile] = useState(null);
  const [pageDims, setPageDims] = useState({ width: 0, height: 0, pdfHeight: 0 });
  const [signatureFields, setSignatureFields] = useState([]);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [hasDroppedSignature, setHasDroppedSignature] = useState(false);

  const handleOpenSignatureModal = () => setShowModal(true);
  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleClear = () => signRef.current?.clear();

  const getJoinedName = (fullName) => fullName.replace(/\s+/g, "");
  const getInitials = (fullName) =>
    fullName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");

  const handleUpload = (e) => {
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

  const handleSave = () => {
    let signatureData;

    if (signatureMode === "draw") {
      const canvas = signRef.current;
      signatureData = canvas.getCanvas().toDataURL("image/png");
    } else if (signatureMode === "name") {
      signatureData = getJoinedName(name);
    } else if (signatureMode === "initials") {
      signatureData = getInitials(name);
    }
    setSignatureFields((prev) =>
      prev.map((f) =>
        f.id === activeFieldId ? { ...f, url: signatureData } : f
      )
    );

    setShowModal(false);
    setActiveFieldId(null);
  };




  return (
    <DndProvider backend={HTML5Backend}>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br />
      <button onClick={handleOpen}>Make E-signature</button>
      <h4>Drag Signature field:</h4>
      <SignatureDraggable url={url} />
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
            Draw
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
                {getJoinedName(name)}
              </div>
              <div>
                <input
                  type="radio"
                  name="signatureMode"
                  value="initials"
                  checked={signatureMode === "initials"}
                  onChange={(e) => setSignatureMode(e.target.value)}
                />
                {getInitials(name)}
              </div>
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
      <DropWrapper
        onDrop={(item, monitor) => {
          const offset = monitor.getSourceClientOffset();
          const pdfRect = document.getElementById("pdf-container")?.getBoundingClientRect();
          if (offset && pdfRect) {
            const x = offset.x - pdfRect.left;
            const y = offset.y - pdfRect.top;
            const newField = {
              id: `field-${Date.now()}`,
              x,
              y,
              url: null,
            };
            setSignatureFields((prev) => [...prev, newField]);
  }
}}
      >
        <div id="pdf-container" style={{ position: "relative", display: "inline-block" }}>
          <MyPdfViewer
            selectedFile={selectedFile}
            setPageDims={setPageDims}
            signatureFields={signatureFields}
            setSignatureFields={setSignatureFields}
            setActiveFieldId={setActiveFieldId}
            hasDroppedSignature={hasDroppedSignature}
            setHasDroppedSignature={setHasDroppedSignature}
            handleOpenSignatureModal={() => setShowModal(true)}
          />
        </div>
      </DropWrapper>
      <div>
        <button
          onClick={() =>
            handleDownloadWithPdfLib(
              selectedFile,
              signatureFields,
              pageDims.pdfHeight
            )
          }
        >
          Download Signed PDF
        </button>
      </div>
    </DndProvider>
  );
}