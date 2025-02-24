import MetaTrader5 as mt5
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def calculate_daily_change(symbol: str) -> float:
    try:
        # Récupère les données des 2 derniers jours
        rates = mt5.copy_rates_from(symbol, mt5.TIMEFRAME_D1, datetime.now(), 2)
        if rates is None or len(rates) < 2:
            return 0.0
            
        previous_close = rates[1]['close']
        current_close = rates[0]['close']
        return ((previous_close - current_close) / previous_close) * 100
    except Exception as e:
        logger.error(f"Error calculating daily change for {symbol}: {str(e)}")
        return 0.0
    

def get_position(symbol: str) -> dict:
    try:
        positions = mt5.positions_get(symbol=symbol)
        
        if not positions or positions is None:
            return None  # Pas de position ouverte
        
        # Agréger les positions multiples
        total_volume = 0.0
        total_profit = 0.0
        weighted_price = 0.0
        
        for pos in positions:
            total_volume += pos.volume
            total_profit += pos.profit
            weighted_price += pos.price_open * pos.volume
            
        if total_volume == 0:
            return None
            
        average_price = weighted_price / total_volume
        
        return {
            "symbol": symbol,
            "volume": total_volume,
            "profit": total_profit,
            "price": average_price,
            "count": len(positions)
        }
        
    except Exception as e:
        logger.error(f"Error getting position for {symbol}: {str(e)}")
        return None


def get_historical_order():
    try:
       # get the number of orders in history
        from_date=datetime(2020,1,1)
        to_date=datetime.now()
        history_orders=mt5.history_orders_total(from_date, to_date)

        if history_orders>0:
            print("Total history orders=",history_orders)
        else:
            print("Orders not found in history")

        return history_orders
    except Exception as e:
        logger.error(f"Error getting historical orders: {str(e)}")
        return None