import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import TradingChart from './TradingChart';

interface Asset {
    symbol: string;
    price: number;
    daily_change: number;
    points_change: number;
    spread: number;
    digits: number;
    trade_allowed: boolean;
    chartData: Array<{ time: number; value: number }>;
}

interface AssetTrade {
    entry_price: number;
    gain_percentage: number;
    gain: number;
    count_trade: number;
    volume: number;
}

interface AssetGridProps {
    onSelectSymbol: (symbol: string) => void;
}

const AssetGrid = ({ onSelectSymbol }: AssetGridProps) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [assetsTrade, setAssetsTrade] = useState<{ [symbol: string]: AssetTrade }>({});
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const handleExpand = (symbol: string) => {
        setExpandedAsset(prev => prev === symbol ? null : symbol);
    };

    const generateChartData = (basePrice: number) => {
        return Array.from({ length: 24 }, (_, i) => ({
            time: i,
            value: basePrice
        }));
    };

    useEffect(() => {
        const savedAssets = localStorage.getItem('selectedAssets');
        if (savedAssets) setSelectedAssets(JSON.parse(savedAssets));
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedAssets', JSON.stringify(selectedAssets));
    }, [selectedAssets]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme as 'light' | 'dark');
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const { data } = await apiClient.get('/assets');
                if (data?.assets) {
                    const enrichedAssets = data.assets.map((asset: Asset) => ({
                        ...asset,
                        points_change: asset.price * (asset.daily_change / 100),
                        chartData: generateChartData(asset.price)
                    }));
                    setAssets(enrichedAssets);
                    setError(null);
                    const enrichedAssetsTrade: { [symbol: string]: AssetTrade } = {};
                    for (const symbol in data.asset_trade) {
                        enrichedAssetsTrade[symbol] = {
                            ...data.asset_trade[symbol]
                        };
                    }
                    setAssetsTrade(enrichedAssetsTrade);
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Erreur de chargement des données');
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
        const interval = setInterval(fetchAssets, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAddAsset = (symbol: string) => {
        setSelectedAssets(prev => {
            const newSelectedAssets = [...new Set([...prev, symbol])];
            localStorage.setItem('selectedAssets', JSON.stringify(newSelectedAssets));
            return newSelectedAssets;
        });
    };

    const handleRemoveAsset = (symbol: string) => {
        setSelectedAssets(prev => {
            const newSelectedAssets = prev.filter(s => s !== symbol);
            localStorage.setItem('selectedAssets', JSON.stringify(newSelectedAssets));
            return newSelectedAssets;
        });
    };

    const filteredAssets = assets.filter(asset =>
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedAssets.includes(asset.symbol)
    );

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    if (loading) return <div className="p-4 bg-gray-100 rounded-lg shadow-md text-center">Chargement des actifs...</div>;
    if (error) return <div className="p-4 bg-red-200 text-red-700 rounded-lg shadow-md text-center">{error}</div>;

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="mb-8 flex justify-between items-center">
                <input
                    type="text"
                    placeholder="Rechercher un actif..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-600 rounded-xl 
                        shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                        transition-all duration-200"
                />
            </div>

            {searchQuery && (
                <div className="mt-6 space-y-2">
                    {filteredAssets.map(asset => (
                        <div
                            key={asset.symbol}
                            className="group flex justify-between items-center p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg 
                                cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-50/10 transition-colors duration-200"
                            onClick={() => handleAddAsset(asset.symbol)}
                        >
                            <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                                {asset.symbol}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                asset.daily_change >= 0 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                            }`}>
                                {asset.daily_change.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {selectedAssets.map(symbol => {
                    const asset = assets.find(a => a.symbol === symbol);
                    const trade = assetsTrade[symbol];
                    
                    return asset ? (
                        <div
                            key={symbol}
                            className={`relative p-6 bg-white dark:bg-slate-700 border-2 rounded-xl shadow-sm transition-all duration-300 ${
                                expandedAsset === symbol 
                                    ? 'border-indigo-200 dark:border-indigo-400 min-h-[500px] shadow-lg z-10' 
                                    : 'border-slate-100 dark:border-slate-600 min-h-[200px] hover:border-slate-200 dark:hover:border-slate-500'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{asset.symbol}</h3>
                                <div className="flex gap-2">
                                    <button
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500
                                            text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors duration-200"
                                        onClick={() => handleExpand(asset.symbol)}
                                    >
                                        {expandedAsset === asset.symbol ? '−' : '+'}
                                    </button>
                                    <button
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-600 hover:bg-rose-200 dark:hover:bg-rose-500
                                            text-rose-600 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-100 transition-colors duration-200"
                                        onClick={() => handleRemoveAsset(asset.symbol)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                        {asset.price.toFixed(asset.digits)}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        trade?.gain >= 0 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                                    }`}>
                                        <p>PnL : {trade?.gain.toFixed(asset.digits)}$</p>
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                    <p>Prix d'entrée : {trade?.entry_price.toFixed(asset.digits)}</p>
                                    <p>Trades effectués : {trade?.count_trade.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mb-6">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                    asset.daily_change >= 0 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                                }`}>
                                    {asset.daily_change.toFixed(2)}%
                                </span>
                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                    asset.points_change >= 0 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                                }`}>
                                    {asset.points_change.toFixed(asset.digits)} pts
                                </span>
                            </div>

                            <div className="asset-chart">
                                <TradingChart
                                    data={asset.chartData}
                                    height={expandedAsset === asset.symbol ? 300 : 150}
                                    digits={asset.digits}
                                    symbol={asset.symbol}
                                    isExpanded={expandedAsset === asset.symbol}
                                />
                            </div>

                            {expandedAsset === asset.symbol && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-600">
                                    <button
                                        className="w-full py-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg
                                            font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                        onClick={() => onSelectSymbol(symbol)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-4 9a1 1 0 100 2h1.586l-2.293 2.293a1 1 0 101.414 1.414L15 16.414V15a1 1 0 102 0v4a1 1 0 01-1 1h-4a1 1 0 100 2h4a3 3 0 003-3v-4a1 1 0 10-2 0v1.586l-2.293-2.293a1 1 0 10-1.414 1.414L16.586 17H15a1 1 0 100 2h4a3 3 0 003-3v-4a1 1 0 10-2 0v3z"/>
                                        </svg>
                                        Plein écran
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : null;
                })}
            </div>
        </div>
    );
};

export default AssetGrid;
