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

interface AssetGridProps {
    onSelectSymbol: (symbol: string) => void;
}

const AssetGrid = ({ onSelectSymbol }: AssetGridProps) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

    const handleExpand = (symbol: string) => {
        setExpandedAsset(prev => prev === symbol ? null : symbol);
    };

    // Simulation de données pour le graphique
    const generateChartData = (basePrice: number) => {
        return Array.from({ length: 24 }, (_, i) => ({
            time: i,
            value: basePrice * (1 + (Math.random() - 0.5) * 0.02)
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
                }
            } catch (err) {
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
        setSelectedAssets(prev => [...new Set([...prev, symbol])]);
    };

    const filteredAssets = assets.filter(asset =>
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedAssets.includes(asset.symbol)
    );

    if (loading) return <div className="loading">Chargement des actifs...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="asset-grid-container">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Rechercher un actif..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {searchQuery && (
                <div className="search-results">
                    {filteredAssets.map(asset => (
                        <div 
                            key={asset.symbol}
                            className="search-result-item"
                            onClick={() => handleAddAsset(asset.symbol)}
                        >
                            <span>{asset.symbol}</span>
                            <span className={`change ${asset.daily_change >= 0 ? 'positive' : 'negative'}`}>
                                {asset.daily_change.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="selected-assets-grid">
                {selectedAssets.map(symbol => {
                    const asset = assets.find(a => a.symbol === symbol);
                    return asset ? (
                        <div 
                            key={symbol} 
                            className={`asset-card ${expandedAsset === symbol ? 'expanded' : ''}`}
                        >
                            <div className="asset-header">
                                <h3 className="asset-symbol">{asset.symbol}</h3>
                                <div className="asset-actions">
                                    <button 
                                        className="expand-btn"
                                        onClick={() => handleExpand(asset.symbol)}
                                    >
                                        {expandedAsset === asset.symbol ? '−' : '+'}
                                    </button>
                                    <button 
                                        className="remove-btn"
                                        onClick={() => setSelectedAssets(prev => prev.filter(s => s !== symbol))}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="price-info">
                                <div className="price-main">
                                    {asset.price.toFixed(asset.digits)}
                                </div>
                                <div className="price-variations">
                                    <span className={`change ${asset.daily_change >= 0 ? 'positive' : 'negative'}`}>
                                        {asset.daily_change.toFixed(2)}%
                                    </span>
                                    <span className={`change ${asset.points_change >= 0 ? 'positive' : 'negative'}`}>
                                        {asset.points_change.toFixed(asset.digits)} pts
                                    </span>
                                </div>
                            </div>

                            <div className="asset-chart">
                                <TradingChart 
                                    data={asset.chartData} 
                                    height={300} // or any appropriate value
                                    digits={asset.digits}
                                    symbol={asset.symbol}
                                    isExpanded={expandedAsset === asset.symbol}
                                />
                            </div>

                            {expandedAsset === asset.symbol && (
                                <div className="detailed-view">
                                    <button 
                                        className="fullscreen-btn"
                                        onClick={() => onSelectSymbol(symbol)}
                                    >
                                        Ouvrir en plein écran
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
