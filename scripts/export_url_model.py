"""Export the supplied sklearn 1.5.1 forest to inert browser-readable data.

Usage: python scripts/export_url_model.py /path/to/mlp02
Only supported sklearn/numpy types are allowed when reading these local artifacts.
The output contains tree structure, not the KNN imputer's training rows.
"""
import argparse
import hashlib
import importlib
import json
import pickle
from pathlib import Path

import numpy as np
import sklearn

ALLOWED = {
    ("sklearn.ensemble._forest", "RandomForestClassifier"),
    ("sklearn.tree._classes", "DecisionTreeClassifier"),
    ("sklearn.tree._tree", "Tree"),
    ("sklearn.pipeline", "Pipeline"),
    ("sklearn.impute._knn", "KNNImputer"),
    ("numpy._core.multiarray", "_reconstruct"),
    ("numpy._core.multiarray", "scalar"),
    ("numpy", "ndarray"),
    ("numpy", "dtype"),
}


class ArtifactReader(pickle.Unpickler):
    def find_class(self, module, name):
        if (module, name) not in ALLOWED:
            raise ValueError(f"Unsupported artifact type: {module}.{name}")
        return getattr(importlib.import_module(module), name)


def read_artifact(path):
    with path.open("rb") as stream:
        return ArtifactReader(stream).load()


def export(source, output, fixtures):
    if sklearn.__version__ != "1.5.1":
        raise ValueError("Use scikit-learn==1.5.1, matching the supplied artifacts")
    model = read_artifact(source / "final_model/model.pkl")
    processor = read_artifact(source / "final_model/preprocessor.pkl")
    if type(model).__name__ != "RandomForestClassifier" or list(model.classes_) != [0, 1]:
        raise ValueError("Expected a binary RandomForestClassifier with classes [0, 1]")
    if [name for name, _ in processor.steps] != ["imputer"]:
        raise ValueError("Only a KNN imputer preprocessing step is supported")
    columns = processor.feature_names_in_.tolist()
    if len(columns) != 30 or model.n_features_in_ != 30:
        raise ValueError("Expected the 30-feature phishing dataset schema")
    # All model inputs are finite. The original KNN imputer must leave them unchanged.
    rng = np.random.default_rng(42)
    inputs = rng.choice([-1, 0, 1], size=(128, 30)).astype(float)
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        transformed = processor.transform(inputs)
    if not np.array_equal(transformed, inputs):
        raise ValueError("Preprocessing changes complete inputs; export is not supported")
    trees = []
    for estimator in model.estimators_:
        tree = estimator.tree_
        nodes = []
        for index in range(tree.node_count):
            values = tree.value[index][0]
            probability = float(values[0] / values.sum())
            nodes.append([
                int(tree.children_left[index]), int(tree.children_right[index]),
                int(tree.feature[index]), float(tree.threshold[index]), probability,
            ])
        trees.append(nodes)
    payload = {
        "format": "focusguard-random-forest-v1",
        "source": "mlp02/final_model/model.pkl",
        "sourceSha256": hashlib.sha256((source / "final_model/model.pkl").read_bytes()).hexdigest(),
        "sklearnVersion": sklearn.__version__,
        "features": columns, "classes": [0, 1], "phishingClass": 0,
        "trees": trees,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, separators=(",", ":"), allow_nan=False))
    fixtures.parent.mkdir(parents=True, exist_ok=True)
    fixtures.write_text(json.dumps({
        "sourceSha256": payload["sourceSha256"],
        "inputs": inputs.tolist(),
        "phishingScores": model.predict_proba(transformed)[:, 0].tolist(),
    }, separators=(",", ":"), allow_nan=False))
    print(f"Exported {len(trees)} trees; verified imputer identity on 128 complete vectors")
    print(f"Model size: {output.stat().st_size:,} bytes")


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("source", type=Path)
    cli.add_argument("--output", type=Path, default=Path("extension/models/url-forest.json"))
    cli.add_argument("--fixtures", type=Path, default=Path("extension/tests/fixtures/forest-parity.json"))
    args = cli.parse_args()
    export(args.source.resolve(), args.output, args.fixtures)
