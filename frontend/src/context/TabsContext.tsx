import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('marketWatch');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, selectedSymbol, setSelectedSymbol }}>
      {children}
    </TabsContext.Provider>
  );
};

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  return context;
};