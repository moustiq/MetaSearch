import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

interface Trade {
    id: number;
    date: string;
    symbol: string;
    type: string;
    quantity: number;
    price: number;
}

const TradingJournal: React.FC = () => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                const {data} = await apiClient.get('/trade-history');
                if (data?.trades) {
                    const enrichedTradeData = data.trades.map((trade: any) => ({
                        ...trade, date: new Date(trade.date).toLocaleString()
                    }));
                    setTrades(enrichedTradeData);
                }
                
                setError(null);
            } catch (err) {
                setError('Failed to fetch trade history');
            } finally {
                setLoading(false);
            }
        };

        fetchTrades();
    }, []);

    if (loading) {
        return <div className="text-center mt-4">Loading...</div>;
    }

    if (error) {
        return <div className="text-center mt-4 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Trading Journal</h1>
            <table className="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Date</th>
                        <th className="py-2 px-4 border-b">Symbol</th>
                        <th className="py-2 px-4 border-b">Type</th>
                        <th className="py-2 px-4 border-b">Quantity</th>
                        <th className="py-2 px-4 border-b">Price</th>
                    </tr>
                </thead>
                
            </table>
        </div>
    );
};

export default TradingJournal;