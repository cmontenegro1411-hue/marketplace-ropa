import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from preprocessing import preprocess_data
import joblib
import os

def train_models():
    # 1. Cargar y preprocesar datos
    X_train, X_test, y_train, y_test, feature_names = preprocess_data()
    
    if X_train is None:
        return

    models = {
        "Regresion Lineal": LinearRegression(),
        "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
        "XGBoost": XGBRegressor(n_estimators=100, learning_rate=0.1, random_state=42)
    }

    results = []

    print("\n--- Entrenando Modelos ---")
    for name, model in models.items():
        model.fit(X_train, y_train)
        predictions = model.predict(X_test)
        
        mae = mean_absolute_error(y_test, predictions)
        rmse = np.sqrt(mean_squared_error(y_test, predictions))
        r2 = r2_score(y_test, predictions)
        
        results.append({
            "Modelo": name,
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2
        })
        print(f"{name} - R2: {r2:.4f}")

    results_df = pd.DataFrame(results)
    print("\nResultados Comparativos:")
    print(results_df)

    # 2. Guardar el mejor modelo (XGBoost suele ser el mejor en estos casos)
    best_model = models["XGBoost"]
    joblib.dump(best_model, 'analytics/models/ventas_model.joblib')
    print("\nMejor modelo (XGBoost) guardado en analytics/models/ventas_model.joblib")

    # 3. Visualización de Importancia de Variables
    plt.figure(figsize=(10, 6))
    importances = best_model.feature_importances_
    feat_importances = pd.Series(importances, index=feature_names)
    feat_importances.nlargest(10).plot(kind='barh', color='teal')
    plt.title('Top 10 Factores que Impulsan las Ventas')
    plt.tight_layout()
    
    if not os.path.exists('analytics/plots'):
        os.makedirs('analytics/plots')
    plt.savefig('analytics/plots/feature_importance.png')
    print("Gráfico de importancia guardado en analytics/plots/feature_importance.png")

if __name__ == "__main__":
    if not os.path.exists('analytics/models'):
        os.makedirs('analytics/models')
    train_models()
