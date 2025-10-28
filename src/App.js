import React, { useState, useRef, useMemo } from "react";
import html2canvas from "html2canvas";
import Draggable from "react-draggable";

// Simple replacements for Button/Card components
const Button = ({ children, onClick, className }) => (
  <button
    onClick={onClick}
    className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${className || ""}`}
  >
    {children}
  </button>
);

const Card = ({ children, className }) => (
  <div className={`border rounded shadow p-4 bg-white ${className || ""}`}>{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="font-bold text-lg mb-2">{children}</div>
);

const CardContent = ({ children }) => <div>{children}</div>;

const CardTitle = ({ children }) => <div className="text-xl font-semibold">{children}</div>;

// Helper to format labels
const formatLabel = (key) => {
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1) + " (ft)";
};

export default function PlotDiagramApp() {
  const [inputs, setInputs] = useState({
    plotWidth: 30,
    plotLength: 60,
    roadWidth: 30,
    parkingWidth: 18,
    parkingLength: 18,
    setbackFront: 10,
    setbackBack: 5,
    setbackLeft: 5,
    setbackRight: 5,
    floors: 5,
  });

  const [elements, setElements] = useState({
    parking: true,
    staircase: false,
  });

  const diagramRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: Math.max(0, parseFloat(value) || 0) });
  };

  const handleToggle = (name) => {
    setElements({ ...elements, [name]: !elements[name] });
  };

  const calculations = useMemo(() => {
    const {
      plotWidth,
      plotLength,
      setbackLeft,
      setbackRight,
      setbackFront,
      setbackBack,
      floors,
    } = inputs;

    const plotArea = plotWidth * plotLength;
    const buildableWidth = plotWidth - setbackLeft - setbackRight;
    const buildableLength = plotLength - setbackFront - setbackBack;
    const validBuildableWidth = Math.max(0, buildableWidth);
    const validBuildableLength = Math.max(0, buildableLength);

    const groundFloorArea = validBuildableWidth * validBuildableLength;
    const totalBUA = groundFloorArea * floors;
    const groundCoverage = plotArea > 0 ? (groundFloorArea / plotArea) * 100 : 0;
    const far = plotArea > 0 ? totalBUA / plotArea : 0;

    return {
      plotArea,
      totalBUA,
      groundCoverage,
      far,
      buildableWidth: validBuildableWidth,
      buildableLength: validBuildableLength,
    };
  }, [inputs]);

  const handleExport = async () => {
    if (!diagramRef.current) return;
    const canvas = await html2canvas(diagramRef.current, { backgroundColor: null, logging: false });
    const link = document.createElement("a");
    link.download = "plot-diagram.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col lg:flex-row gap-6 font-sans">
      <Card className="lg:w-1/3">
        <CardHeader>
          <CardTitle>Property Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(inputs).map((key) => (
            <div key={key} className="flex justify-between items-center text-sm">
              <label className="text-gray-600">{formatLabel(key)}</label>
              <input
                type="number"
                name={key}
                value={inputs[key]}
                onChange={handleChange}
                min="0"
                className="border p-1.5 w-28 text-right rounded-md shadow-sm"
              />
            </div>
          ))}

          <div className="space-y-2 border-t mt-4 pt-4">
            <h3 className="text-lg font-semibold mb-2">Calculated Metrics</h3>
            <div className="flex justify-between text-sm">
              <span>Plot Area:</span>
              <strong>{calculations.plotArea.toFixed(2)} sq.ft</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ground Coverage:</span>
              <strong>{calculations.groundCoverage.toFixed(2)} %</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Built-Up Area (BUA):</span>
              <strong>{calculations.totalBUA.toFixed(2)} sq.ft</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span>Floor Area Ratio (FAR):</span>
              <strong>{calculations.far.toFixed(2)}</strong>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => handleToggle("parking")}>
              {elements.parking ? "Remove Parking" : "Add Parking"}
            </Button>
            <Button onClick={() => handleToggle("staircase")}>
              {elements.staircase ? "Remove Staircase" : "Add Staircase"}
            </Button>
          </div>

          <Button onClick={handleExport} className="w-full mt-4">
            Export as PNG
          </Button>
        </CardContent>
      </Card>

      <Card className="flex-1 flex justify-center items-center p-4">
        <div ref={diagramRef} className="p-4 bg-white">
          <PlotDiagramSVG inputs={inputs} buildable={calculations} elements={elements} />
        </div>
      </Card>
    </div>
  );
}

// ================= PlotDiagramSVG =================
const PlotDiagramSVG = ({ inputs, buildable, elements }) => {
  const {
    plotWidth,
    plotLength,
    roadWidth,
    setbackFront,
    setbackBack,
    setbackLeft,
    setbackRight,
    parkingWidth,
    parkingLength,
  } = inputs;

  const PADDING = 20;
  const MAX_SIZE = 500;
  const totalWidthFt = plotWidth;
  const totalHeightFt = plotLength + roadWidth;
  if (totalWidthFt <= 0 || totalHeightFt <= 0) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100">Enter valid dimensions</div>;
  }

  const scale = Math.min(MAX_SIZE / totalWidthFt, MAX_SIZE / totalHeightFt);
  const svgWidth = totalWidthFt * scale + PADDING * 2;
  const svgHeight = totalHeightFt * scale + PADDING * 2;

  const pW = plotWidth * scale;
  const pL = plotLength * scale;
  const rW = roadWidth * scale;

  const sF = setbackFront * scale;
  const sB = setbackBack * scale;
  const sL = setbackLeft * scale;
  const sR = setbackRight * scale;

  const bW = buildable.buildableWidth * scale;
  const bL = buildable.buildableLength * scale;

  const parkW = parkingWidth * scale;
  const parkL = parkingLength * scale;
  const parkX = sL + (bW - parkW) / 2;
  const parkY = sB + bL - parkL;

  const stairW = 8 * scale;
  const stairL = 12 * scale;
  const stairX = sL + 10;
  const stairY = sB + 10;

  return (
    <svg width={svgWidth} height={svgHeight} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`.dim-text { font-size: 10px; fill: #333; } .label-text { font-size: 12px; font-weight: bold; fill: #fff; }`}</style>
      </defs>
      <g transform={`translate(${PADDING}, ${PADDING})`}>
        <text x={pW - 10} y="-5" textAnchor="middle" style={{ fontSize: "14px", fontWeight: "bold" }}>N</text>
        <path d={`M ${pW - 10} 0 L ${pW - 10} 15 M ${pW - 10} 0 L ${pW - 13} 5 M ${pW - 10} 0 L ${pW - 7} 5`} stroke="black" strokeWidth="1.5" fill="none" />

        <rect x="0" y="0" width={pW} height={pL} fill="#a7f3d0" stroke="#15803d" strokeWidth="1" />
        <rect x="0" y={pL} width={pW} height={rW} fill="#e5e7eb" stroke="#6b7280" strokeWidth="1" />
        <text x={pW/2} y={pL + rW/2} textAnchor="middle" alignmentBaseline="middle" className="label-text" fill="#374151">
          Road ({roadWidth} ft)
        </text>

        <rect x={sL} y={sB} width={bW} height={bL} fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" />
        <text x={sL + bW/2} y={sB + bL/2} textAnchor="middle" alignmentBaseline="middle" className="label-text" fill="#1e3a8a">
          Buildable Area
        </text>

        {elements.parking && parkingWidth > 0 && parkingLength > 0 && (
          <rect x={parkX} y={parkY} width={parkW} height={parkL} fill="#fef08a" stroke="#ca8a04" strokeDasharray="4" />
        )}

        {elements.staircase && (
          <rect x={stairX} y={stairY} width={stairW} height={stairL} fill="#f87171" stroke="#b91c1c" strokeDasharray="2" />
        )}

        {/* Dimensions */}
        <path d={`M 0 ${pL + 15} L ${pW} ${pL + 15}`} stroke="black" strokeWidth="0.5" />
        <text x={pW/2} y={pL + 25} textAnchor="middle" className="dim-text">{plotWidth} ft</text>

        <path d={`M ${pW + 15} 0 L ${pW + 15} ${pL}`} stroke="black" strokeWidth="0.5" />
        <text x={pW + 25} y={pL/2} textAnchor="middle" className="dim-text" transform={`rotate(-90, ${pW + 25}, ${pL/2})`}>
          {plotLength} ft
        </text>
      </g>
    </svg>
  );
};
