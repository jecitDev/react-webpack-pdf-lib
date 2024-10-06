import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, rgb } from "pdf-lib";
import { Resizable } from "re-resizable";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the worker for react-pdf
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   `pdfjs-dist/build/pdf.worker.min.js`,
//   import.meta.url
// ).toString();
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const App = () => {
  const [fields, setFields] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [showField, setShowField] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [textAdded, setTextAdded] = useState(false);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [fieldText, setFieldText] = useState("");
  const [fieldSize, setFieldSize] = useState(100);
  const pdfContainerRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(pdfDoc);
      setPdfFile(file);
      setTextAdded(false);
      setCurrentPage(1);
    }
  };

  const addTextField = async () => {
    if (pdfDoc && fieldText) {
      const pages = pdfDoc.getPages();
      const page = pages[currentPage - 1];
      const { height } = page.getSize();

      // page.drawText(fieldText, {
      //   x: textPosition.x,
      //   y: height - textPosition.y - fieldSize, // Adjust y-coordinate
      //   size: fieldSize,
      //   color: rgb(0, 0, 0),
      // });

      // const pdfBytes = await pdfDoc.save();
      // const blob = new Blob([pdfBytes], { type: "application/pdf" });
      // const newFile = new File([blob], "modified.pdf", {
      //   type: "application/pdf",
      // });
      // setPdfFile(newFile);
      // setPdfDoc(await PDFDocument.load(await newFile.arrayBuffer()));
      // setTextAdded(true);
      setShowField(false);
      setFields([
        ...fields,
        {
          text: fieldText,
          position: textPosition,
          pdfX: textPosition.x,
          pdfY: height - textPosition.y - fieldSize,
          page: currentPage,
          width: fieldSize, // Default width
          height: fieldSize,
        },
      ]);
      setFieldText("");
      setTextPosition({ x: 50, y: 50 });
      // console.log(fields);
    }
  };

  const handleFieldResize = (index, size) => {
    setFields((prevFields) => {
      const newFields = [...prevFields];
      const field = newFields[index];
      const heightDiff = size.height - field.height;
      newFields[index] = {
        ...newFields[index],
        pdfY: field.pdfY - heightDiff,
        width: size.width,
        height: size.height,
      };
      return newFields;
    });
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

  const handleFieldMouseDown = (e, index) => {
    e.stopPropagation();
    setActiveField(index);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (isDragging && pdfContainerRef.current) {
      // console.log(activeField);
      const pages = pdfDoc.getPages();
      const page = pages[currentPage - 1];
      const { height } = page.getSize();

      const rect = pdfContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (activeField !== null) {
        setFields((prevFields) => {
          const newFields = [...prevFields];
          newFields[activeField] = {
            ...newFields[activeField],
            pdfX: x,
            pdfY: height - y - newFields[activeField].height,
            position: { x, y },
          };
          return newFields;
        });
      } else {
        setTextPosition({ x, y });
      }
      // console.log(fields);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveField(null);
  };

  // useEffect(() => {
  //   if (textAdded) {
  //     // Reset the text position after adding text
  //     setTextPosition({ x: 50, y: 50 });
  //   }
  // }, [textAdded]);

  const goToPreviousPage = () => {
    setCurrentPage((prevPage) => (prevPage > 1 ? prevPage - 1 : prevPage));
  };

  const goToNextPage = () => {
    setCurrentPage((prevPage) =>
      prevPage < numPages ? prevPage + 1 : prevPage
    );
  };

  const onPageLoadSuccess = ({ width, height }) => {
    setPdfDimensions({ width, height });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex justify-between bg-[#034A5A] text-white p-2 w-full">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">
            Document: MEDICAL RESUME_001_001.pdf
          </h1>
          <p>created by : Jane Doe</p>
        </div>
        <div className="flex gap-2 items-center">
          <button className="bg-[#034A5A] border border-[white] rounded-md flex items-center justify-center w-24 h-10">
            <p>Send</p>
          </button>
          <button className="bg-[#034A5A] border border-[white] rounded-md flex items-center justify-center w-24 h-10">
            <p>Sign Now</p>
          </button>
        </div>
      </div>

      <input type="file" accept=".pdf" onChange={handleFileUpload} />

      {pdfFile && (
        <>
          <div className="flex gap-2 justify-center">
            <button
              className="bg-[#034A5A] border border-[white] text-white p-2 rounded-md w-fit h-10"
              onClick={downloadModifiedPdf}
            >
              Download Modified PDF
            </button>
            <button
              className="bg-[#034A5A] border border-[white] text-white p-2 rounded-md w-fit h-10"
              onClick={() => console.log(fields)}
            >
              Console Fields
            </button>
            <button
              className="bg-[#034A5A] border border-[white] text-white p-2 rounded-md w-fit h-10"
              onClick={() => setFields([])}
            >
              Reset Fields
            </button>
            <button
              className="bg-[#034A5A] border border-[white] text-white p-2 rounded-md w-fit h-10"
              onClick={async () => {
                const pages = pdfDoc.getPages();
                const page = pages[currentPage - 1];
                const { height } = page.getSize();

                fields.forEach((field) => {
                  page.drawRectangle({
                    x: field.pdfX,
                    y: field.pdfY,
                    // y: height - field.position.y - field.height,
                    width: field.width,
                    height: field.height,
                    borderColor: rgb(0, 0, 0),
                    borderWidth: 1.5,
                  });
                });

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: "application/pdf" });
                const newFile = new File([blob], "modified.pdf", {
                  type: "application/pdf",
                });
                setPdfFile(newFile);
                setPdfDoc(await PDFDocument.load(await newFile.arrayBuffer()));
              }}
            >
              Write PDF
            </button>
          </div>

          <div className="flex gap-2 mt-2 justify-center">
            <div className="flex flex-col gap-2 mt-10">
              {/* <input
                className="border border-gray-300 rounded-md p-2"
                type="text"
                value={fieldText}
                onChange={(e) => setFieldText(e.target.value)}
                placeholder="Enter field text"
              />
              <input
                className="border border-gray-300 rounded-md p-2"
                type="number"
                value={fieldSize}
                onChange={(e) => setFieldSize(Number(e.target.value))}
                placeholder="Enter font size"
              /> */}
              {/* <button
                className="bg-blue-500 text-white p-2 rounded-md"
                onClick={addTextField}
              >
                Add Text Field
              </button> */}
              <button
                className={`bg-blue-500 text-white p-2 rounded-md ${
                  showField && fieldText === "Signature" ? "bg-blue-700" : ""
                }`}
                onClick={() => {
                  setFieldText("Signature");
                  setShowField(!showField);
                  setTextPosition({ x: 50, y: 50 });
                }}
              >
                Signature
              </button>
              <button
                className={`bg-blue-500 text-white p-2 rounded-md ${
                  showField && fieldText === "Email" ? "bg-blue-700" : ""
                }`}
                onClick={() => {
                  setFieldText("Email");
                  setShowField(!showField);
                  setTextPosition({ x: 50, y: 50 });
                }}
              >
                Email
              </button>
            </div>
            <div className="text-center">
              <div className="flex gap-2 items-center justify-center ">
                <button
                  className={`bg-[#034A5A] border border-[white] text-white p-2 rounded-md ${
                    currentPage <= 1 ? "bg-gray-500" : ""
                  }`}
                  onClick={goToPreviousPage}
                  disabled={currentPage <= 1}
                >
                  Previous Page
                </button>
                <span>
                  Page {currentPage} of {numPages}
                </span>
                <button
                  className={`bg-[#034A5A] border border-[white] text-white p-2 rounded-md ${
                    currentPage >= numPages ? "bg-gray-500" : ""
                  }`}
                  onClick={goToNextPage}
                  disabled={currentPage >= numPages}
                >
                  Next Page
                </button>
              </div>
              <div
                ref={pdfContainerRef}
                style={{
                  position: "relative",
                  border: "1px solid #ccc",
                  width: `${pdfDimensions.width + 2}px`,
                  height: `${pdfDimensions.height + 2}px`,
                  overflow: "hidden",
                  padding: "1px",
                  marginBottom: "10px",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <Document
                  file={pdfFile}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                >
                  <Page
                    pageNumber={currentPage}
                    onLoadSuccess={onPageLoadSuccess}
                    width={pdfDimensions.width}
                  />
                </Document>
                {showField && (
                  <div
                    style={{
                      position: "absolute",
                      left: textPosition.x,
                      top: textPosition.y,
                      cursor: "move",
                      userSelect: "none",
                      backgroundColor: "#ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      // fontSize: `${fieldSize}px`,
                      width: fieldSize,
                      height: fieldSize,
                      zIndex: 1002,
                    }}
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      {fieldText}
                      <button
                        className="text-black text-3xl absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center"
                        onClick={addTextField}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                {fields.map((field, index) => (
                  <Resizable
                    key={index}
                    size={{ width: field.width, height: field.height }}
                    onResizeStop={(e, direction, ref, d) => {
                      handleFieldResize(index, {
                        width: field.width + d.width,
                        height: field.height + d.height,
                      });
                    }}
                    style={{
                      position: "absolute",
                      left: field.position.x,
                      top: field.position.y,
                      zIndex: 1001,
                      visibility:
                        field.page !== currentPage ? "hidden" : "visible",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        cursor: "move",
                        userSelect: "none",
                        backgroundColor: "rgba(255, 255, 0, 0.3)",
                        // fontSize: `${fieldSize}px`,
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseDown={(e) => handleFieldMouseDown(e, index)}
                    >
                      {field.text}
                    </div>
                  </Resizable>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
