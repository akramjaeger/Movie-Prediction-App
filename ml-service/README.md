# ML Service — Movie Success Prediction

Python / scikit-learn / FastAPI service described in the *cahier des charges*
(Movie Success Prediction, v1.0). It trains a binary classifier that estimates
whether a film will be a commercial success, and exposes it via `POST /predict`.

## Folder layout (per the specification)

```
ml-service/
|-- data/
|   |-- generate_dataset.py   # reproducible, license-free synthetic dataset
|   `-- movies.csv            # generated training dataset
|-- src/
|   |-- preprocessing.py      # feature engineering (no target leakage)
|   |-- train.py              # trains + compares LR / RF / GB, saves best
|   |-- evaluate.py           # Accuracy, Precision, Recall, F1, ROC-AUC
|   `-- predict.py            # single-movie inference
|-- artifacts/                # trained model + preprocessor + metadata
|-- main.py                   # FastAPI app (POST /predict, GET /health)
|-- schemas.py                # Pydantic input/output schemas
`-- requirements.txt
```

## Success definition (per the document)

A film is a **success** when its ROI exceeds a threshold:

```
ROI = (Revenue - Budget) / Budget
success = 1 if ROI > 1.0   (i.e. revenue > 2 x budget)
```

Revenues are used **only** to build the target during training. They are never
provided to the model at prediction time (no data leakage).

## Algorithms compared

* Logistic Regression (reference, interpretable)
* Random Forest (non-linear relationships)
* Gradient Boosting (tabular data)

The best model by ROC-AUC is selected and saved to `artifacts/`.

## Metrics

Accuracy, Precision, Recall, F1-score, ROC-AUC, plus a majority-class
reference model.

## Setup & run

```bash
# 1. Create a virtual environment (recommended)
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Generate the dataset
python data/generate_dataset.py

# 4. Train, evaluate and save the best model
python src/train.py

# 5. Start the FastAPI service
uvicorn main:app --reload --port 8000
```

The API is then available at `http://localhost:8000`:
* `GET /health`
* `POST /predict` with a JSON body matching `MovieFeatures`

## Integration with the Next.js frontend

Per the architecture, the Next.js backend (`/api/predictions`) forwards the
validated movie characteristics to `POST /predict` on this service, saves the
result (and model version) to PostgreSQL, and returns it to the UI.

> Note: this service is optional for running the frontend. The Next.js app
> also includes a self-contained TypeScript port of the model
> (`src/lib/prediction.ts`) so predictions work without a separate Python
> service.
