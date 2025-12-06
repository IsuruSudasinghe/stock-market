import { useState } from 'react';

const MetricSelector = ({ 
  metrics = [], 
  selectedMetrics = [], 
  onSelectionChange,
  maxSelection = 4
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = (metricKey) => {
    const isSelected = selectedMetrics.includes(metricKey);
    
    if (isSelected) {
      // Don't allow deselecting if only one metric is selected
      if (selectedMetrics.length > 1) {
        onSelectionChange(selectedMetrics.filter(k => k !== metricKey));
      }
    } else {
      // Check max selection limit
      if (selectedMetrics.length < maxSelection) {
        onSelectionChange([...selectedMetrics, metricKey]);
      }
    }
  };

  const visibleMetrics = isExpanded ? metrics : metrics.slice(0, 6);

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
        {visibleMetrics.map((metric) => {
          const isSelected = selectedMetrics.includes(metric.key);
          return (
            <button
              key={metric.key}
              onClick={() => handleToggle(metric.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {metric.name}
            </button>
          );
        })}
        
        {metrics.length > 6 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {isExpanded ? 'Show less' : `+${metrics.length - 6} more`}
          </button>
        )}
      </div>
      
      {selectedMetrics.length >= maxSelection && (
        <p className="text-xs text-amber-600 mt-2">
          Maximum {maxSelection} metrics can be selected at once
        </p>
      )}
    </div>
  );
};

export default MetricSelector;

