import React from 'react';

export default function ExecutionBadge({ trace }) {
  if (!trace) return null;

  return (
    <div className="execution-badge">
      <div className="task-highlight">
        <span className="status-dot"></span>
        {trace.task}
      </div>
      <span className="divider">|</span>
      <span><strong>Pipeline:</strong> {trace.selected_pipeline}</span>
      <span className="divider">|</span>
      <span><strong>Inputs:</strong> {trace.modalities_detected?.join(', ')}</span>
      <span className="divider">|</span>
      <span className="crs-tag">{trace.crs_info || 'EPSG:4326'}</span>
    </div>
  );
}