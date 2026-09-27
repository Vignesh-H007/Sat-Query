import React, { useState } from 'react';

const CLASS_TO_STYLE = {
  'water body': 'bbox-water',
  'structure': 'bbox-structure',
  'vessel': 'bbox-vessel',
  'vegetation': 'bbox-vegetation',
  'landmass': 'bbox-landmass',
  'change area': 'bbox-change'
};

export default function ImageAnnotator({ imageSrc, boxes = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!imageSrc) return null;

  return (
    <div className="annotator-container">
      <img src={imageSrc} alt="Satellite Source" className="annotator-image" />
      {boxes.map((box, idx) => {
        const [ymin, xmin, ymax, xmax] = box.box_2d;
        const style = {
          top: `${(ymin / 1000) * 100}%`,
          left: `${(xmin / 1000) * 100}%`,
          height: `${((ymax - ymin) / 1000) * 100}%`,
          width: `${((xmax - xmin) / 1000) * 100}%`,
        };
        const colorClass = CLASS_TO_STYLE[box.label.toLowerCase()] || 'bbox-default';
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={idx}
            style={style}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`bbox-rect ${colorClass} ${isHovered ? 'is-hovered' : ''}`}
          >
            <span className="bbox-label">
              {box.label} ({Math.round(box.confidence * 100)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}