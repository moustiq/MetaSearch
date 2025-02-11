# ---- ml_trading_system.py ----
import MetaTrader5 as mt5
import pandas as pd
import numpy as np
import pandas_ta as ta
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib

# 1. Connexion à MT5
def connect_mt5():
    if not mt5.initialize():
        print("Erreur d'initialisation MT5")
        quit()

    account = 4000043148
    authorized = mt5.login(account, password="06q6P$9X$",server="liveUK-mt5.darwinex.com")
    if not authorized:
        print("Échec de la connexion")
        mt5.shutdown()  # Fermeture ici si échec
        quit()

    print("Connexion réussie à MT5 ✅")

# 2. Récupération des données
def get_data(symbol, timeframe, n_bars=10000):

    if not mt5.initialize():  # Vérifie si la connexion est active
        connect_mt5()  # Reconnexion si nécessaire

    rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, n_bars)
    if rates is None or len(rates) == 0:
        print("ERREUR : Données non récupérées. Code erreur:", mt5.last_error())
        return pd.DataFrame()  # DataFrame vide


    # Créer un DataFrame avec les bonnes colonnes
    df = pd.DataFrame(rates, columns=[
        'time',
        'open',
        'high',
        'low',
        'close',
        'tick_volume',
        'spread',
        'real_volume'
    ])  # 🚨 Correction ici
    df['time'] = pd.to_datetime(df['time'], unit='s')
    df.set_index('time', inplace=True)
    # Ajoutez ceci après avoir créé le DataFrame
    print("Colonnes disponibles:", df.columns.tolist())


    return df


# 3. Calcul des indicateurs techniques
def calculate_features(df):
    # Dans votre fonction de chargement des données ou en amont :
    print("Données brutes chargées :")
    print("- Nombre de lignes :", len(df))  # Doit être > 1000 pour des indicateurs comme le MACD
    print("- Exemple de dates :", df.index.min(), "à", df.index.max())
    print("- Colonnes disponibles :", df.columns.tolist())

    # 1. Calcul du Pivot Point Hebdomadaire
    # -------------------------------------------------------
    # Création d'un DataFrame resamplé sur les semaines



    df_weekly = df.resample('W').agg({
        'high': 'max',
        'low': 'min',
        'close': lambda x: x.iloc[-1]  # Alternative à 'last' 🚨 Correction ici
    })
    # Renommer la colonne 'close' pour éviter les conflits
    df_weekly = df_weekly.rename(columns={'close': 'close_weekly'})

    # Calcul du PP pour chaque semaine : (High + Low + Close)/3
    df_weekly['PP_weekly'] = (df_weekly['high'] + df_weekly['low'] + df_weekly['close_weekly']) / 3

    # Merge avec le DataFrame original
    df = df.join(df_weekly['PP_weekly'], how='left')
    df['PP_weekly'] = df['PP_weekly'].ffill()

    # 2. Calcul de la distance normalisée
    # -------------------------------------------------------
    df['Dist_PP'] = (df['close'] - df['PP_weekly']) / df['PP_weekly']  # Maintenant ça fonctionne ✅

    # Remplacer les NaN du PP_weekly par la dernière valeur connue
    df['PP_weekly'] = df['PP_weekly'].ffill()


    # EMA
    df['EMA20'] = ta.ema(df['close'], length=20)
    df['EMA50'] = ta.ema(df['close'], length=50)
    
    # RSI
    df['RSI'] = ta.rsi(df['close'], length=14)

    # MACD
    from pandas_ta import macd
    macd_result = macd(df['close'], fast=12, slow=26, signal=9)
    df = pd.concat([df, macd_result], axis=1)
    
    # Pivots Hebdomadaires (calcul simplifié)
    weekly = df.resample('W').agg({'high':'max', 'low':'min', 'close':'last'})
    weekly['PP'] = (weekly['high'] + weekly['low'] + weekly['close']) / 3
    weekly = weekly[['PP']].resample('D').ffill()
    df = df.join(weekly, rsuffix='_weekly')
    
    # Features supplémentaires
    df['EMA20_diff'] = df['close'] - df['EMA20']
    df['EMA_cross'] = np.where(df['EMA20'] > df['EMA50'], 1, 0)
    df['Dist_PP'] = (df['close'] - df['PP_weekly']) / df['PP_weekly']

    # Supprimer uniquement les NaN générés par le MACD (premières 35 périodes)
    min_data_length = 35  # Période maximale des indicateurs
    df = df.iloc[min_data_length:]  # Garde toutes les données à partir de l'index 35

    print("Colonnes après MACD :", df.columns.tolist())  # Doit afficher ['MACD_12_26_9', 'MACDh_12_26_9', ...]
    # Debug : Afficher les NaN avant dropna()
    print("NaN avant suppression :")
    print(df.isna().sum())

    return df #.dropna()

# 4. Préparation de la target
def prepare_target(df, lookahead_bars=4, threshold=0.005):
    df['future_close'] = df['close'].shift(-lookahead_bars)
    df['target'] = np.where(
        (df['future_close'] / df['close'] - 1) > threshold, 
        1,  # Acheter
        np.where(
            (df['close'] / df['future_close'] - 1) > threshold,
            -1, # Vendre
            0    # Neutre
        )
    )
    print("NaN après MACD:\n", df.isna().sum())
    return df.dropna()

# 5. Pipeline ML
def build_model():
    return Pipeline([
        ('scaler', StandardScaler()),
        ('model', XGBClassifier(
            n_estimators=500,
            max_depth=7,
            learning_rate=0.01,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric='logloss'
        ))
    ])

# 6. Entraînement complet
def train_model(symbol='NQ_H', timeframe=mt5.TIMEFRAME_H4):

    # Récupération données
    connect_mt5()
    df = get_data(symbol, timeframe)  # Chargement initial
    df = calculate_features(df)

    # Vérifications critiques
    print("=" * 50)
    print("ÉCHANTILLON FINAL AVENT TRAIN/TEST SPLIT :")
    print("- Lignes restantes :", len(df))
    print("- NaN restants :", df.isna().sum().sum())
    print("- Exemple de données :\n", df[['close', 'MACD_12_26_9', 'PP_weekly']].tail(3))

    if len(df) == 0:
        raise ValueError("Le DataFrame est vide après le prétraitement. Vérifiez les logs ci-dessus.")
    
    # Feature Engineering
    df = calculate_features(df)
    df = prepare_target(df)
    
    # Split des données
    features = df[[
        'EMA20_diff', 'EMA_cross', 'RSI', 
        'MACD_12_26_9', 'MACDh_12_26_9', 
        'Dist_PP', 'EMA50'
    ]]
    target = df['target']
    
    X_train, X_test, y_train, y_test = train_test_split(
        features, target, 
        test_size=0.2, 
        shuffle=False  # Crucial pour le trading!
    )
    
    # Entraînement
    model = build_model()
    model.fit(X_train, y_train)
    
    # Évaluation
    print(classification_report(y_test, model.predict(X_test)))
    
    # Sauvegarde du modèle
    joblib.dump(model, f'{symbol}_trading_model.pkl')
    return model

# 7. Prédiction en temps réel
class TradingPredictor:
    def __init__(self, model_path):
        self.model = joblib.load(model_path)
        self.scaler = StandardScaler()
        
    def get_live_data(self, symbol, timeframe, n_bars=50):
        df = get_data(symbol, timeframe, n_bars)
        return calculate_features(df)
    
    def predict(self, symbol='NQ_H', timeframe=mt5.TIMEFRAME_H4):
        live_data = self.get_live_data(symbol, timeframe)
        latest_features = live_data.iloc[-1:][[
            'EMA20_diff', 'EMA_cross', 'RSI',
            'MACD_12_26_9', 'MACDh_12_26_9',
            'Dist_PP', 'EMA50'
        ]]
        return self.model.predict(latest_features)[0]

# --- Utilisation ---
if __name__ == "__main__":
    try:
        connect_mt5()  # Connexion initiale
        model = train_model()
        predictor = TradingPredictor('NQ_trading_model.pkl')
        signal = predictor.predict()
        print(f"Signal actuel : {signal}")

    finally:
        mt5.shutdown()  # Fermeture sécurisée à la toute fin ✅
        print("Connexion MT5 fermée")
