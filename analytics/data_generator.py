import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_sales_data(start_date='2023-01-01', end_date='2024-12-31'):
    np.random.seed(42)
    
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    categories = ['Mujer', 'Hombre', 'Niños', 'Accesorios', 'Calzado']
    segments = ['Mujer', 'Hombre', 'Niños', 'Unisex']
    
    data = []
    
    for date in dates:
        # Factores base por día
        is_weekend = 1 if date.weekday() >= 5 else 0
        month = date.month
        
        # Simular estacionalidad mensual (Ventas altas en Dic, Nov, y mitad de año)
        seasonal_factor = 1.0
        if month == 12: seasonal_factor = 2.5
        elif month == 11: seasonal_factor = 1.8
        elif month == 7: seasonal_factor = 1.4
        
        # Simular efecto fin de semana
        weekend_multiplier = 1.5 if is_weekend else 1.0
        
        for cat in categories:
            for seg in segments:
                # Filtrado lógico: No queremos 'Vestidos' para 'Hombre' en la simulación base
                # Pero en ropa de segunda a veces ocurre. Mantendremos simplificado:
                base_sales = np.random.randint(5, 50)
                
                # Ajuste por categoría
                cat_multiplier = 1.2 if cat == 'Mujer' else 1.0
                cat_multiplier = 1.1 if cat == 'Calzado' else cat_multiplier
                
                # Probabilidad de promoción (10% de los días)
                promo_active = 1 if np.random.random() < 0.10 else 0
                promo_multiplier = 1.4 if promo_active else 1.0
                
                total_sales = base_sales * seasonal_factor * weekend_multiplier * cat_multiplier * promo_multiplier
                total_sales += np.random.normal(0, 5) # Ruido
                
                units_sold = max(0, int(total_sales / 20) + np.random.randint(0, 3))
                revenue = units_sold * np.random.uniform(15, 60)
                
                data.append({
                    'fecha': date,
                    'categoria': cat,
                    'segmento': seg,
                    'is_weekend': is_weekend,
                    'month': month,
                    'promo_active': promo_active,
                    'units_sold': units_sold,
                    'revenue': round(revenue, 2)
                })
                
    df = pd.DataFrame(data)
    
    # Crear carpeta si no existe
    if not os.path.exists('analytics/data'):
        os.makedirs('analytics/data')
        
    df.to_csv('analytics/data/synthetic_sales.csv', index=False)
    print(f"Dataset generado con {len(df)} filas en analytics/data/synthetic_sales.csv")

if __name__ == "__main__":
    generate_sales_data()
