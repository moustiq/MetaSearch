import MetaTrader5 as mt5
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
from datetime import datetime, timedelta

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MT5 Connector API")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MT5Connection(BaseModel):
    server: str
    login: int
    password: str

def calculate_daily_change(symbol: str) -> float:
    try:
        # Récupère les données des 2 derniers jours
        rates = mt5.copy_rates_from(symbol, mt5.TIMEFRAME_D1, datetime.now(), 2)
        if rates is None or len(rates) < 2:
            return 0.0
            
        previous_close = rates[1]['close']
        current_close = rates[0]['close']
        return ((current_close - previous_close) / previous_close) * 100
    except Exception as e:
        logger.error(f"Error calculating daily change for {symbol}: {str(e)}")
        return 0.0

@app.on_event("startup")
async def initialize_mt5():
    """Initialisation de la connexion MT5 au démarrage"""
    try:
        if not mt5.initialize():
            logger.error(f"Échec de l'initialisation MT5 : {mt5.last_error()}")
            raise RuntimeError(mt5.last_error())
        logger.info("Connexion MT5 établie avec succès")
    except Exception as e:
        logger.error(f"Erreur critique lors de l'initialisation : {str(e)}")

@app.on_event("shutdown")
async def shutdown_mt5():
    """Fermeture propre de la connexion MT5"""
    mt5.shutdown()
    logger.info("Connexion MT5 fermée")

@app.get("/status")
async def get_connection_status():
    try:
        terminal_info = mt5.terminal_info()
        return {
            "connected": terminal_info is not None,
            "version": mt5.__version__,
            "terminal_info": terminal_info._asdict() if terminal_info else None,
            "error": mt5.last_error() if not terminal_info else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/assets")
async def get_asset_prices():
    """Récupère tous les actifs du Market Watch MT5 avec leurs prix"""
    try:
        assets = []
        symbols = mt5.symbols_get()
        
        for symbol in symbols:
            try:
                # Vérifie si le symbole est activé dans le Market Watch
                symbol_info = mt5.symbol_info(symbol.name)
                if not symbol_info.visible:
                    continue

                # Récupère les informations de prix
                tick = mt5.symbol_info_tick(symbol.name)
                if tick is None:
                    continue

                assets.append({
                    "symbol": symbol.name,
                    "price": tick.ask,
                    "daily_change": calculate_daily_change(symbol.name),
                    "spread": round(tick.ask - tick.bid, 5),
                    "digits": symbol.digits,
                    "trade_allowed": symbol.trade_mode == mt5.SYMBOL_TRADE_MODE_FULL
                })
                
            except Exception as e:
                logger.error(f"Error processing symbol {symbol.name}: {str(e)}")
                continue

        return {"assets": assets}
    except Exception as e:
        logger.error(f"Error getting assets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/historical-data/{symbol}")
async def get_historical_data(symbol: str, timeframe: str = "H1", count: int = 100):
    tf_mapping = {
        "M1": mt5.TIMEFRAME_M1,
        "M5": mt5.TIMEFRAME_M5,
        "H1": mt5.TIMEFRAME_H1,
        "D1": mt5.TIMEFRAME_D1,
        "W1": mt5.TIMEFRAME_W1
    }
    try:
        rates = mt5.copy_rates_from_pos(symbol, tf_mapping[timeframe], 0, count)
        if rates is None:
            raise HTTPException(status_code=404, detail="No data available")
        return {"data": rates.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/connect")
async def connect_mt5(connection: MT5Connection):
    try:
        if not mt5.initialize(login=connection.login, password=connection.password, server=connection.server):
            error = mt5.last_error()
            logger.error(f"Échec de la connexion MT5 : {error}")
            raise HTTPException(status_code=400, detail=error)
        
        mt5.symbols_total()  # Force la mise à jour du Market Watch
        
        account_info = mt5.account_info()._asdict()
        return {
            "message": "Connecté avec succès",
            "account_info": account_info
        }
    except Exception as e:
        logger.error(f"Erreur de connexion : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
