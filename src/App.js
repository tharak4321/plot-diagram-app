import React, { useState, useRef, useMemo } from "react";
import html2canvas from "html2canvas";

// Helper to format camelCase keys into readable labels
const formatLabel = (key) => {
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1) + " (ft)";
};

export default function App() {
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
    addParking: true,
    addStaircase: true,
    stairWidth: 6,
    stairLength: 10,
    stairX: 0,
    stairY: 0,
  });

  const diagramRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs({
      ...inputs,
      [name]: type === "checkbox" ? checked : Math.max(0, parseFloat(value) || 0),
    });
  };

  const calculations = useMemo(() => {
    const { plotWidth, plotLength, setbackLeft, setbackRight, setbackFront, setbackBack, floors } = inputs;
    const plotArea = plotWidth * plotLength;
    const buildableWidth = Math.max(0, plotWidth - setbackLeft - setbackRight);
    const buildableLength = Math.max(0, plotLength - setbackFront - setbackBack);
    const groundFloorArea = buildableWidth * buildableLength;
    const totalBUA = groundFloorArea * floors;
    const groundCoverage = plotArea > 0 ? (groundFloorArea / plotArea) * 100 : 0;
    const far = plotArea > 0 ? totalBUA / plotArea : 0;
    return {
      plotArea,
      totalBUA,
      groundCoverage,
      far,
      buildableWidth,
      buildableLength,
    };
  }, [inputs]);

  const handleExport = async () => {
    if (!diagramRef.current) return;
    const canvas = await html2canvas(diagramRef.current, { backgroundColor: null });
    const link = document.createElement("a");
    link.download = "plot-diagram.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col lg:flex-row gap-6 font-sans">
      <div className="lg:w-1/3 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Property Dimensions</h2>
        {Object.keys(inputs).map((key) =>
          key.startsWith("add") || key.startsWith("stair") ? null : (
            <div key={key} className="flex justify-between items-center text-sm mb-2">
              <label>{formatLabel(key)}</label>
              <input
                type="number"
                name={key}
                value={inputs[key]}
                onChange={handleChange}
                min="0"
                className="border p-1.5 w-24 text-right rounded-md"
              />
            </div>
          )
        )}
        {/* Toggle options */}
        <div className="mt-4 border-t pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="addParking" checked={inputs.addParking} onChange={handleChange} />
            Add Parking
          </label>
          <label className="flex items-center gap-2 text-sm mt-1">
            <input type="checkbox" name="addStaircase" checked={inputs.addStaircase} onChange={handleChange} />
            Add Staircase
          </label>
        </div>

        <div className="border-t pt-4 mt-4 space-y-2">
          <h3 className="text-lg font-semibold mb-2">Calculated Metrics</h3>
          <div className="flex justify-between text-sm">
            <span>Plot Area:</span> <strong>{calculations.plotArea.toFixed(2)} sq.ft</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span>Ground Coverage:</span> <strong>{calculations.groundCoverage.toFixed(2)} %</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Built-Up Area (BUA):</span> <strong>{calculations.totalBUA.toFixed(2)} sq.ft</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span>Floor Area Ratio (FAR):</span> <strong>{calculations.far.toFixed(2)}</strong>
          </div>
        </div>
        <button onClick={handleExport} className="w-full mt-4 bg-blue-500 text-white py-2 rounded">
          Export as PNG
        </button>
      </div>

      <div className="flex-1 flex justify-center items-center p-4 bg-white rounded shadow">
        <div ref={diagramRef} className="p-4 bg-gray-100">
          <PlotDiagramSVG inputs={inputs} buildable={calculations} />
        </div>
      </div>
    </div>
  );
}

const PlotDiagramSVG = ({ inputs, buildable }) => {
  const { plotWidth, plotLength, roadWidth, setbackFront, setbackBack, setbackLeft, setbackRight, parkingWidth, parkingLength, addParking, addStaircase, stairWidth, stairLength, stairX, stairY } = inputs;
  const PADDING = 20;
  const MAX_SIZE = 500;
  const totalWidthFt = plotWidth;
  const totalHeightFt = plotLength + roadWidth;
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

  return (
    <svg width={svgWidth} height={svgHeight} xmlns="http://www.w3.org/2000/svg">
      <g transform={`translate(${PADDING}, ${PADDING})`}>
        {/* Plot */}
        <rect x="0" y="0" width={pW} height={pL} fill="#a7f3d0" stroke="#15803d" strokeWidth="1" />
        {/* Road */}
        <rect x="0" y={pL} width={pW} height={rW} fill="#e5e7eb" stroke="#6b7280" strokeWidth="1" />
        <text x={pW / 2} y={pL + rW / 2} textAnchor="middle" alignmentBaseline="middle" style={{ fontSize: 10, fontWeight: "bold" }}>
          Road ({roadWidth} ft)
        </text>
        {/* Buildable */}
        <rect x={sL} y={sB} width={bW} height={bL} fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" />
        <text x={sL + bW / 2} y={sB + bL / 2} textAnchor="middle" alignmentBaseline="middle" style={{ fontSize: 10, fontWeight: "bold", fill: "#1e3a8a" }}>
          Buildable Area
        </text>
        {/* Optional Parking */}
        {addParking && parkingWidth > 0 && parkingLength > 0 && (
          <rect
            x={sL + (bW - parkingWidth * scale) / 2}
            y={sB + bL - parkingLength * scale}
            width={parkingWidth * scale}
            height={parkingLength * scale}
            fill="#fef08a"
            stroke="#ca8a04"
            strokeDasharray="4"
          />
        )}
        {/* Optional Staircase */}
        {addStaircase && stairWidth > 0 && stairLength > 0 && (
          <rect x={stairX * scale} y={stairY * scale} width={stairWidth * scale} height={stairLength * scale} fill="#f87171" stroke="#b91c1c" />
        )}
      </g>
    </svg>
  );
};
