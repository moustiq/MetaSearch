const VariationBadge = ({ label, variation }: { 
    label: string; 
    variation: { percent: number; points: number } 
  }) => (
    <div className="variation-badge">
      <div className="variation-label">{label}</div>
      <div className="variation-values">
        <span className={`percent ${variation.percent >= 0 ? 'positive' : 'negative'}`}>
          {variation.percent.toFixed(2)}%
        </span>
        <span className={`points ${variation.points >= 0 ? 'positive' : 'negative'}`}>
          {variation.points.toFixed(2)} pts
        </span>
      </div>
    </div>
  );
export default VariationBadge;  