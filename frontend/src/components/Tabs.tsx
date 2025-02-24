import React from 'react';
import AssetGrid from './AssetGrid';
import TradingJournal from './TradingJournal';
import { useTabs } from '../context/TabsContext';

const Tabs = () => {
  const { activeTab, setActiveTab, selectedSymbol, setSelectedSymbol } = useTabs();

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="tabs-container p-4">
      <div className="tabs flex space-x-4 mb-4">
        <button
          className={`tab px-4 py-2 rounded ${activeTab === 'marketWatch' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => handleTabClick('marketWatch')}
        >
          Market Watch
        </button>
        <button
          className={`tab px-4 py-2 rounded ${activeTab === 'niftyEconomy' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => handleTabClick('niftyEconomy')}
        >
          Nifty Economy
        </button>
        <button
          className={`tab px-4 py-2 rounded ${activeTab === 'tradingJournal' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => handleTabClick('tradingJournal')}
        >
          Trading Journal
        </button>
        <button
          className={`tab px-4 py-2 rounded ${activeTab === 'strategies' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => handleTabClick('strategies')}
        >
          Strategies
        </button>
      </div>
      <div className="tab-content p-4 border rounded bg-white shadow">
        {activeTab === 'marketWatch' && <AssetGrid onSelectSymbol={setSelectedSymbol} />}
        {activeTab === 'niftyEconomy' && <div>Content for Nifty Economy</div>}
        {activeTab === 'tradingJournal' && <TradingJournal />}
      </div>
    </div>
  );
};

export default Tabs;