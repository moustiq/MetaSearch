import { useState } from 'react';
import Tabs from '../components/Tabs';
import { TabsProvider } from '../context/TabsContext';

const HomePage = () => {
  return (
    <div className="home-page p-6 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
       <TabsProvider>
          <Tabs />
        </TabsProvider>
    </div>
  );
}

export default HomePage;

