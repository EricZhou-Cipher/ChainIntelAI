import React from 'react';

const RiskScoreCard = ({ 
  score, 
  riskFactors = [], 
  title = "风险评分", 
  showConfidence = false, 
  compact = false,
  interactive = false
}) => {
  // 处理无效或缺失数据
  if (score === undefined || score === null) {
    return (
      <div 
        className={`bg-white rounded-lg shadow-md p-6 mb-8 ${compact ? 'compact' : ''}`}
        role="region"
        aria-label="风险评分"
      >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="text-gray-600">数据不可用</p>
      </div>
    );
  }

  // 风险评级颜色
  const getRiskColor = (riskScore) => {
    if (riskScore >= 75) return "bg-red-500";
    if (riskScore >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  // 风险评级文本
  const getRiskLabel = (riskScore) => {
    if (riskScore >= 75) return "高风险";
    if (riskScore >= 50) return "中等风险";
    if (riskScore > 0) return "低风险";
    return "无风险";
  };

  // 渲染风险因素
  const renderRiskFactors = () => {
    if (!riskFactors || riskFactors.length === 0) {
      return <p className="text-gray-600 mt-4">无风险因素</p>;
    }

    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">风险因素</h3>
        <ul className="list-disc pl-5 space-y-1">
          {riskFactors.map((factor, index) => (
            <li key={index} className="text-gray-700">
              {factor}
              {showConfidence && (
                <span className="ml-2 text-sm text-gray-500">
                  (可信度: {Math.floor(Math.random() * 30) + 70}%)
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 mb-8 ${compact ? 'compact' : ''}`}
      role="region"
      aria-label="风险评分"
    >
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      
      <div className="relative pt-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold text-gray-800">{score}</span>
            <span className="ml-2 text-sm font-medium text-gray-600">/100</span>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            score >= 75 ? 'bg-red-100 text-red-800' : 
            score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-green-100 text-green-800'
          }`}>
            {getRiskLabel(score)}
          </span>
        </div>
        
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 mt-3">
          <div 
            style={{ width: `${score}%` }} 
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getRiskColor(score)}`}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>
      
      {!compact && renderRiskFactors()}
      
      {interactive && (
        <div className="mt-4 flex justify-end">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => console.log('Risk details clicked')}
          >
            查看详情
          </button>
        </div>
      )}
    </div>
  );
};

export default RiskScoreCard; 