import React, { useState } from 'react';
import AssetGrid from './AssetGrid';

const Tabs = () => {
  const [activeTab, setActiveTab] = useState('marketWatch');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="tabs-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'marketWatch' ? 'active' : ''}`}
          onClick={() => handleTabClick('marketWatch')}
        >
          Market Watch
        </button>
        <button
          className={`tab ${activeTab === 'niftyEconomy' ? 'active' : ''}`}
          onClick={() => handleTabClick('niftyEconomy')}
        >
          Nifty Economy
        </button>
        <button
          className={`tab ${activeTab === 'tradingJournal' ? 'active' : ''}`}
          onClick={() => handleTabClick('tradingJournal')}
        >
          Trading Journal
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'marketWatch' && <AssetGrid onSelectSymbol={setSelectedSymbol} />}
        {activeTab === 'niftyEconomy' && <div>Content for Nifty Economy</div>}
      </div>
    </div>
  );
};

export default Tabs;