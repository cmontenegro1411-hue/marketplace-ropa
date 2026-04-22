import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import os

def preprocess_data(file_path='analytics/data/synthetic_sales.csv'):
    if not os.path.exists(file_path):
        print(f"Error: No se encuentra el archivo {file_path}")
        return None, None

    df = pd.read_csv(file_path)
    df['fecha'] = pd.to_datetime(df['fecha'])
    
    # 1. Ingeniería de Características (Features)
    # Extraer más info de la fecha
    df['dia_mes'] = df['fecha'].dt.day
    df['semana_del_year'] = df['fecha'].dt.isocalendar().week
    
    # Ordenar por fecha para calcular retardos (Lags)
    df = df.sort_values(['categoria', 'segmento', 'fecha'])
    
    # Crear variables de retardo (Lag features) - Ventas previas
    # Esto ayuda al modelo a entender tendencias recientes
    df['revenue_lag_1'] = df.groupby(['categoria', 'segmento'])['revenue'].shift(1)
    df['revenue_lag_7'] = df.groupby(['categoria', 'segmento'])['revenue'].shift(7)
    
    # Medias móviles (Rolling mean)
    df['revenue_roll_mean_7'] = df.groupby(['categoria', 'segmento'])['revenue'].transform(lambda x: x.rolling(window=7).mean())
    
    # Eliminar filas con NaN (las primeras de cada grupo por el shift)
    df = df.dropna()
    
    # 2. Codificación Categórica
    le_cat = LabelEncoder()
    le_seg = LabelEncoder()
    
    df['categoria_id'] = le_cat.fit_transform(df['categoria'])
    df['segmento_id'] = le_seg.fit_transform(df['segmento'])
    
    # 3. Selección de Features y Target
    features = [
        'is_weekend', 'month', 'dia_mes', 'semana_del_year', 
        'promo_active', 'categoria_id', 'segmento_id',
        'revenue_lag_1', 'revenue_lag_7', 'revenue_roll_mean_7'
    ]
    
    X = df[features]
    y = df['revenue']
    
    # Split cronológico (no aleatorio para series temporales)
    # Usamos el último 20% para test
    split_idx = int(len(df) * 0.8)
    
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    print(f"Preprocesamiento completado. Train: {len(X_train)}, Test: {len(X_test)}")
    return X_train, X_test, y_train, y_test, features

if __name__ == "__main__":
    preprocess_data()
