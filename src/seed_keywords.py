"""Merged keyword seed dictionary from 07_Research_Bot (66+) and PaperReviewBot (25+).

Format: {canonical_form: [variant1, variant2, ...]}
Canonical form is uppercase abbreviation. Variants are lowercase full forms.
"""

SEED_KEYWORDS: dict[str, list[str]] = {
    # ── ML / AI ───────────────────────────────────────────────────────
    "PINN": [
        "physics-informed neural network",
        "physics-informed neural networks",
        "physics informed neural network",
        "physics informed neural networks",
        "physics informed",
    ],
    "ML": ["machine learning"],
    "DL": ["deep learning"],
    "AI": ["artificial intelligence"],
    "NN": ["neural network", "neural networks"],
    "CNN": ["convolutional neural network", "convolutional neural networks"],
    "RNN": ["recurrent neural network", "recurrent neural networks"],
    "LSTM": ["long short-term memory"],
    "GAN": ["generative adversarial network", "generative adversarial networks"],
    "GNN": ["graph neural network", "graph neural networks"],
    "DNN": ["deep neural network"],
    "ANN": ["artificial neural network"],
    "GPR": ["gaussian process regression"],
    "SVR": ["support vector regression"],
    "TL": ["transfer learning"],
    # ── Engineering Methods ───────────────────────────────────────────
    "FEM": ["finite element method", "finite element methods", "finite element"],
    "FEA": ["finite element analysis"],
    "XFEM": ["extended finite element method"],
    "RUL": ["remaining useful life"],
    "ROM": [
        "reduced-order model",
        "reduced order model",
        "reduced-order models",
        "reduced order models",
    ],
    "CFD": ["computational fluid dynamics"],
    "DT": ["digital twin", "digital twins"],
    "IoT": ["internet of things"],
    "AM": ["additive manufacturing"],
    "ICME": ["integrated computational materials engineering"],
    # ── Composite Materials — Fiber-Reinforced Polymers ───────────────
    "FRP": ["fiber reinforced polymer", "fibre reinforced polymer"],
    "CFRP": ["carbon fiber reinforced polymer", "carbon fibre reinforced"],
    "GFRP": ["glass fiber reinforced polymer", "glass fibre reinforced"],
    "AFRP": ["aramid fiber reinforced polymer", "aramid fibre reinforced"],
    "BFRP": ["basalt fiber reinforced polymer", "basalt fibre reinforced"],
    "NFRP": ["natural fiber reinforced polymer", "natural fibre reinforced"],
    # ── Composite Materials — Matrix Classifications ──────────────────
    "PMC": ["polymer matrix composite"],
    "MMC": ["metal matrix composite"],
    "CMC": ["ceramic matrix composite"],
    # ── Composite Materials — Layup / Architecture ────────────────────
    "UD": ["unidirectional"],
    "NCF": ["non-crimp fabric", "non crimp fabric"],
    "QI": ["quasi-isotropic", "quasi isotropic"],
    "CP": ["cross-ply", "cross ply"],
    # ── Composite Materials — Manufacturing ───────────────────────────
    "RTM": ["resin transfer molding", "resin transfer moulding"],
    "VARTM": ["vacuum assisted resin transfer molding", "vacuum assisted resin transfer moulding"],
    "AFP": ["automated fiber placement", "automated fibre placement"],
    "ATL": ["automated tape laying"],
    # ── Composite Materials — Damage Modes ────────────────────────────
    "IFF": ["inter-fibre failure", "inter fibre failure"],
    "CDM": ["continuum damage mechanics"],
    "CZM": ["cohesive zone model", "cohesive zone modeling"],
    "PDM": ["progressive damage model", "progressive damage modeling"],
    "VCCT": ["virtual crack closure technique"],
    "RVE": ["representative volume element"],
    # ── Composite Materials — Test Types ──────────────────────────────
    "CAI": ["compression after impact"],
    "OHT": ["open hole tension", "open-hole tensile"],
    "OHC": ["open hole compression", "open-hole compressive"],
    "ILSS": ["interlaminar shear strength"],
    "GIC": ["mode i interlaminar fracture toughness"],
    "GIIC": ["mode ii interlaminar fracture toughness"],
    # ── NDT / Inspection ──────────────────────────────────────────────
    "NDT": ["non-destructive testing", "nondestructive testing"],
    "NDE": ["non-destructive evaluation", "nondestructive evaluation"],
    "SHM": ["structural health monitoring"],
    "DIC": ["digital image correlation"],
    "AE": ["acoustic emission"],
    "FBG": ["fiber bragg grating", "fibre bragg grating"],
    "CT": ["computed tomography"],
    "SEM": ["scanning electron microscopy"],
    "EBSD": ["electron backscatter diffraction"],
    "X-ray CT": ["x-ray computed tomography"],
    # ── Fatigue — Regime / Loading ────────────────────────────────────
    "SN": ["s-n", "stress-number", "stress number", "stress life"],
    "HCF": ["high cycle fatigue", "high-cycle fatigue"],
    "LCF": ["low cycle fatigue", "low-cycle fatigue"],
    "VHCF": ["very high cycle fatigue", "very-high-cycle fatigue"],
    "CAL": ["constant amplitude loading", "constant amplitude fatigue"],
    "VAL": ["variable amplitude loading", "variable amplitude fatigue"],
    "CLD": ["constant life diagram"],
    # ── Fatigue — Crack Growth / Fracture Mechanics ───────────────────
    "FCG": ["fatigue crack growth"],
    "FCP": ["fatigue crack propagation"],
    "FCGR": ["fatigue crack growth rate"],
    "LEFM": ["linear elastic fracture mechanics"],
    "SIF": ["stress intensity factor"],
    # ── Fatigue — Damage / Life Prediction ────────────────────────────
    "PDA": ["progressive damage analysis"],
    "RFC": ["rainflow counting", "rainflow cycle counting"],
    "PSD": ["power spectral density"],
    # ── Fatigue — Standard Load Spectra ───────────────────────────────
    "WISPER": ["wind spectrum reference", "wind turbine spectrum"],
    "FALSTAFF": ["fighter aircraft loading standard for fatigue"],
}
