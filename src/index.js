import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, rgb } from "pdf-lib";

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = pdfjs.GlobalWorkerOptions.workerSrc =
  new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const App = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [textAdded, setTextAdded] = useState(false);
  const pdfContainerRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(pdfDoc);
      setPdfFile(file);
      setTextAdded(false);
    }
  };

  const addTextField = async () => {
    if (pdfDoc) {
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height } = firstPage.getSize();

      firstPage.drawText("Sample Text Field", {
        x: textPosition.x,
        y: height - textPosition.y,
        size: 20,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const newFile = new File([blob], "modified.pdf", {
        type: "application/pdf",
      });
      setPdfFile(newFile);
      setPdfDoc(await PDFDocument.load(await newFile.arrayBuffer()));
      setTextAdded(true);
    }
  };

  const downloadModifiedPdf = async () => {
    if (pdfDoc) {
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "modified.pdf";
      link.click();
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (isDragging && pdfContainerRef.current) {
      const rect = pdfContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTextPosition({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (textAdded) {
      // Reset the text position after adding text
      setTextPosition({ x: 50, y: 50 });
    }
  }, [textAdded]);

  return (
    <div>
      <h1>PDF Uploader and Editor</h1>
      <input type="file" accept=".pdf" onChange={handleFileUpload} />
      {pdfFile && (
        <>
          <button onClick={addTextField}>Add Text Field</button>
          <button onClick={downloadModifiedPdf}>Download Modified PDF</button>
          <div
            ref={pdfContainerRef}
            style={{ position: "relative" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page key={`page_${index + 1}`} pageNumber={index + 1} />
              ))}
            </Document>
            {
              <div
                style={{
                  position: "absolute",
                  left: textPosition.x,
                  top: textPosition.y,
                  cursor: "move",
                  userSelect: "none",
                  backgroundColor: "rgba(255, 255, 0, 0.3)",
                  padding: "5px",
                }}
              >
                Sample Text Field
              </div>
            }
          </div>
        </>
      )}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
