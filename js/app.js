// Pipe Selector Application Logic

// Allowable stress database (ASME B31.3 Table A-1)
// Key: Temperature in °C, Value: Allowable Stress in psi
const ALLOWABLE_STRESSES = {
    "A106_B": [ // Carbon Steel SMLS
        { temp: -29, stress: 20000 },
        { temp: 38, stress: 20000 },
        { temp: 93, stress: 20000 },
        { temp: 149, stress: 20000 },
        { temp: 204, stress: 20000 },
        { temp: 260, stress: 18900 },
        { temp: 316, stress: 17300 },
        { temp: 343, stress: 17000 },
        { temp: 371, stress: 16500 },
        { temp: 399, stress: 13000 },
        { temp: 427, stress: 10800 }
    ],
    "A333_6": [ // LTCS SMLS
        { temp: -46, stress: 20000 },
        { temp: -29, stress: 20000 },
        { temp: 38, stress: 20000 },
        { temp: 93, stress: 20000 },
        { temp: 149, stress: 20000 },
        { temp: 204, stress: 20000 },
        { temp: 260, stress: 18900 },
        { temp: 316, stress: 17300 },
        { temp: 343, stress: 17000 }
    ],
    "A312_304": [ // Stainless Steel 304 SMLS
        { temp: -196, stress: 20000 },
        { temp: -29, stress: 20000 },
        { temp: 38, stress: 20000 },
        { temp: 93, stress: 20000 },
        { temp: 149, stress: 18900 },
        { temp: 204, stress: 17500 },
        { temp: 260, stress: 16400 },
        { temp: 316, stress: 15500 },
        { temp: 343, stress: 15100 },
        { temp: 371, stress: 14800 },
        { temp: 427, stress: 14100 },
        { temp: 482, stress: 13400 },
        { temp: 538, stress: 12800 },
        { temp: 593, stress: 11800 },
        { temp: 649, stress: 8300 },
        { temp: 704, stress: 5100 },
        { temp: 760, stress: 3200 },
        { temp: 815, stress: 1800 }
    ],
    "A312_316": [ // Stainless Steel 316 SMLS
        { temp: -196, stress: 20000 },
        { temp: -29, stress: 20000 },
        { temp: 38, stress: 20000 },
        { temp: 93, stress: 20000 },
        { temp: 149, stress: 20000 },
        { temp: 204, stress: 19300 },
        { temp: 260, stress: 18000 },
        { temp: 316, stress: 17000 },
        { temp: 343, stress: 16600 },
        { temp: 371, stress: 16300 },
        { temp: 427, stress: 15600 },
        { temp: 482, stress: 15000 },
        { temp: 538, stress: 14300 },
        { temp: 593, stress: 13300 },
        { temp: 649, stress: 10300 },
        { temp: 704, stress: 6700 },
        { temp: 760, stress: 4000 },
        { temp: 815, stress: 2400 }
    ],
    "A335_P22": [ // Alloy Steel P22 SMLS
        { temp: -29, stress: 20000 },
        { temp: 38, stress: 20000 },
        { temp: 93, stress: 20000 },
        { temp: 149, stress: 20000 },
        { temp: 204, stress: 20000 },
        { temp: 260, stress: 19600 },
        { temp: 316, stress: 18800 },
        { temp: 371, stress: 17900 },
        { temp: 427, stress: 16600 },
        { temp: 482, stress: 15000 },
        { temp: 538, stress: 11000 },
        { temp: 593, stress: 6200 },
        { temp: 649, stress: 3000 }
    ]
};

// Material definitions
const MATERIALS = [
    {
        id: "A106_B",
        name: "ASTM A106 Grade B",
        type: "Carbon Steel",
        compatMetalKey: "Cast Steel",
        minTemp: -29,
        maxTemp: 427,
        density: 7850, // kg/m³
        coeffThermal: 11.7, // 10^-6 /K
        allowableStresses: ALLOWABLE_STRESSES.A106_B,
        warningTemp: 343, // Graphitization warning above 343°C (650°F)
        warningMsg: "Carbon Steel has significant strength reduction above 343°C (650°F). Check stress values."
    },
    {
        id: "A333_6",
        name: "ASTM A333 Grade 6",
        type: "Low Temp Carbon Steel",
        compatMetalKey: "Cast Steel",
        minTemp: -46,
        maxTemp: 343,
        density: 7850,
        coeffThermal: 11.7,
        allowableStresses: ALLOWABLE_STRESSES.A333_6
    },
    {
        id: "A312_304",
        name: "ASTM A312 TP304",
        type: "Stainless Steel 304",
        compatMetalKey: "Stainless steel EN-1.4301 (AISI-304)",
        minTemp: -196,
        maxTemp: 815,
        density: 7930,
        coeffThermal: 17.2,
        allowableStresses: ALLOWABLE_STRESSES.A312_304
    },
    {
        id: "A312_316",
        name: "ASTM A312 TP316",
        type: "Stainless Steel 316",
        compatMetalKey: "Stainless steel EN-1.4401 (AISI-316)",
        minTemp: -196,
        maxTemp: 815,
        density: 7980,
        coeffThermal: 15.9,
        allowableStresses: ALLOWABLE_STRESSES.A312_316
    },
    {
        id: "A335_P22",
        name: "ASTM A335 Grade P22",
        type: "Alloy Steel (2.25Cr-1Mo)",
        compatMetalKey: "Cast Steel",
        minTemp: -29,
        maxTemp: 649,
        density: 7850,
        coeffThermal: 12.1,
        allowableStresses: ALLOWABLE_STRESSES.A335_P22
    }
];

// Linear interpolation utility
function interpolateStress(materialId, tempC) {
    const curve = ALLOWABLE_STRESSES[materialId];
    if (!curve) return null;
    
    const sorted = [...curve].sort((a, b) => a.temp - b.temp);
    
    if (tempC < sorted[0].temp || tempC > sorted[sorted.length - 1].temp) {
        return null;
    }
    
    const exact = sorted.find(p => p.temp === tempC);
    if (exact) return exact.stress;
    
    for (let i = 0; i < sorted.length - 1; i++) {
        const p1 = sorted[i];
        const p2 = sorted[i + 1];
        if (tempC >= p1.temp && tempC <= p2.temp) {
            const tFactor = (tempC - p1.temp) / (p2.temp - p1.temp);
            return p1.stress + tFactor * (p2.stress - p1.stress);
        }
    }
    return null;
}

// Global application state
let appState = {
    selectedFluid: "",
    operatingPressure: 10, // bar
    operatingTemperature: 20, // °C
    flowRate: 100, // m³/h
    targetVelocity: 2.0, // m/s
    corrosionAllowance: 1.5, // mm
    
    // UI Units
    pressureUnit: "bar",
    temperatureUnit: "C",
    flowRateUnit: "m3h",
    velocityUnit: "ms",
    
    // Calculation Results
    eligibleMaterials: [],
    sizingOptions: [],
    selectedOptionIdx: null,
    
    // Dropdown active index
    activeDropdownIdx: -1
};

// Normalized values in standard metric units
function getNormalizedValues() {
    let P = appState.operatingPressure; // bar
    let T = appState.operatingTemperature; // °C
    let Q = appState.flowRate; // m³/s
    let V = appState.targetVelocity; // m/s
    
    if (appState.pressureUnit === "psi") {
        P = appState.operatingPressure * 0.0689476;
    } else if (appState.pressureUnit === "MPa") {
        P = appState.operatingPressure * 10;
    } else if (appState.pressureUnit === "kgcm2") {
        P = appState.operatingPressure * 0.980665;
    }
    
    if (appState.temperatureUnit === "F") {
        T = (appState.operatingTemperature - 32) / 1.8;
    }
    
    if (appState.flowRateUnit === "gpm") {
        Q = appState.flowRate * 0.0000630901964;
    } else if (appState.flowRateUnit === "m3h") {
        Q = appState.flowRate / 3600;
    } else if (appState.flowRateUnit === "m3s") {
        Q = appState.flowRate;
    } else if (appState.flowRateUnit === "lmin") {
        Q = appState.flowRate / 60000;
    }
    
    if (appState.velocityUnit === "fts") {
        V = appState.targetVelocity * 0.3048;
    }
    
    return { P, T, Q, V };
}

// Perform pipeline sizing and wall thickness calculations
function calculateSpecifications() {
    const { P, T, Q, V } = getNormalizedValues();
    
    const fluidInfo = FLUID_COMPATIBILITY[appState.selectedFluid];
    appState.eligibleMaterials = MATERIALS.map(mat => {
        let compRating = "E";
        let ratingText = "No compatibility data";
        
        if (fluidInfo) {
            const metalRatings = fluidInfo.metals || {};
            const key = mat.compatMetalKey;
            compRating = metalRatings[key] || "E";
            
            if (compRating === "A") ratingText = "Excellent (Compatible)";
            else if (compRating === "B") ratingText = "Good (Compatible)";
            else if (compRating === "C") ratingText = "Fair (Limited Use)";
            else if (compRating === "D") ratingText = "Not Recommended";
        }
        
        const isWithinTemp = T >= mat.minTemp && T <= mat.maxTemp;
        const allowableStress = interpolateStress(mat.id, T);
        
        let isEligible = (compRating === "A" || compRating === "B" || compRating === "E") && isWithinTemp && allowableStress !== null;
        let rejectReason = [];
        if (!isWithinTemp) rejectReason.push(`Temp limit exceeded (${mat.minTemp}°C to ${mat.maxTemp}°C)`);
        if (compRating === "D") rejectReason.push("Chemical incompatibility");
        if (allowableStress === null) rejectReason.push("No allowable stress data");
        
        let warning = "";
        if (mat.warningTemp && T >= mat.warningTemp) {
            warning = mat.warningMsg;
        }
        if (compRating === "C") {
            warning = "Material has Fair compatibility. Proceed with caution.";
            isEligible = true;
        }
        
        return {
            ...mat,
            compatibilityRating: compRating,
            compatibilityText: ratingText,
            allowableStress: allowableStress,
            isEligible,
            rejectReason: rejectReason.join(", "),
            warning
        };
    });
    
    const areaReq = Q / V;
    const dReq = Math.sqrt((4 * areaReq) / Math.PI) * 1000;
    
    const options = [];
    
    PIPE_DIMENSIONS.forEach(pipe => {
        const od = pipe.od;
        Object.entries(pipe.schedules).forEach(([schedName, thickness]) => {
            const id = od - 2 * thickness;
            if (id <= 0) return;
            
            appState.eligibleMaterials.forEach(mat => {
                if (!mat.isEligible) return;
                
                const pPsi = P * 14.5038;
                const dInches = od / 25.4;
                const sPsi = mat.allowableStress;
                const E = 1.0;
                const Y = 0.4;
                
                const tDesignInches = (pPsi * dInches) / (2 * (sPsi * E + pPsi * Y));
                const tDesignMm = tDesignInches * 25.4;
                
                const tMinMm = tDesignMm + appState.corrosionAllowance;
                const tNomReqMm = tMinMm / 0.875;
                
                const isAdequate = thickness >= tNomReqMm;
                const vActual = Q / (Math.PI * Math.pow(id / 1000, 2) / 4);
                
                const tAvailable = thickness - appState.corrosionAllowance;
                let mawpBar = 0;
                if (tAvailable > 0) {
                    const mawpPsi = (2 * sPsi * E * (tAvailable / 25.4)) / (dInches - 2 * Y * (tAvailable / 25.4));
                    mawpBar = mawpPsi * 0.0689476;
                }
                
                const weight = Math.PI * (Math.pow(od/1000, 2) - Math.pow(id/1000, 2)) / 4 * mat.density;
                
                options.push({
                    nps: pipe.nps,
                    od: od,
                    schedule: schedName,
                    thickness: thickness,
                    id: id,
                    materialId: mat.id,
                    materialName: mat.name,
                    tDesign: tDesignMm,
                    tMin: tMinMm,
                    tNomReq: tNomReqMm,
                    isThicknessAdequate: isAdequate,
                    isSizeAdequate: id >= dReq,
                    vActual: vActual,
                    mawp: mawpBar,
                    weight: weight,
                    score: (isAdequate ? 0 : 10) + (id >= dReq ? 0 : 5) + Math.abs(id - dReq) * 0.1
                });
            });
        });
    });
    
    options.sort((a, b) => {
        const aOk = a.isThicknessAdequate && a.isSizeAdequate;
        const bOk = b.isThicknessAdequate && b.isSizeAdequate;
        if (aOk && !bOk) return -1;
        if (!aOk && bOk) return 1;
        return a.score - b.score;
    });
    
    appState.sizingOptions = options;
    
    if (options.length > 0) {
        appState.selectedOptionIdx = 0;
    } else {
        appState.selectedOptionIdx = null;
    }
}

// Render dynamic elements to UI
function updateUI() {
    const { P, T, Q, V } = getNormalizedValues();
    
    const noFluidView = document.getElementById("no-fluid-state");
    const activeDashboard = document.getElementById("active-dashboard");
    
    if (!appState.selectedFluid) {
        noFluidView.style.display = "flex";
        activeDashboard.style.display = "none";
        return;
    }
    
    noFluidView.style.display = "none";
    activeDashboard.style.display = "grid";
    
    calculateSpecifications();
    
    const bestOpt = appState.sizingOptions.find(o => o.isThicknessAdequate && o.isSizeAdequate) || appState.sizingOptions[0];
    
    const matCard = document.getElementById("stat-mat");
    const sizeCard = document.getElementById("stat-size");
    const thickCard = document.getElementById("stat-thick");
    const velCard = document.getElementById("stat-vel");
    
    if (bestOpt) {
        matCard.innerHTML = `<span class="stat-value" style="font-size: 1.15rem">${bestOpt.materialName}</span><span class="stat-sub">Fluid Compatibility: ${getBadgeHTML(getCompatRating(bestOpt.materialId))}</span>`;
        sizeCard.innerHTML = `<span class="stat-value">NPS ${bestOpt.nps}</span><span class="stat-sub">OD: ${bestOpt.od} mm</span>`;
        thickCard.innerHTML = `<span class="stat-value">Sch ${bestOpt.schedule}</span><span class="stat-sub">Thk: ${bestOpt.thickness.toFixed(2)} mm (Req: ${bestOpt.tNomReq.toFixed(2)} mm)</span>`;
        velCard.innerHTML = `<span class="stat-value">${bestOpt.vActual.toFixed(2)} <span style="font-size: 0.8rem">m/s</span></span><span class="stat-sub">Target: ${appState.targetVelocity.toFixed(1)} ${appState.velocityUnit === "fts" ? "ft/s" : "m/s"}</span>`;
        
        document.getElementById("card-mat-wrapper").className = "stat-card success";
        document.getElementById("card-size-wrapper").className = "stat-card info";
        document.getElementById("card-thick-wrapper").className = "stat-card success";
        
        const velDiff = Math.abs(bestOpt.vActual - V);
        document.getElementById("card-vel-wrapper").className = `stat-card ${velDiff > 1.0 ? "warning" : "success"}`;
    } else {
        matCard.innerHTML = `<span class="stat-value">—</span><span class="stat-sub">No viable material</span>`;
        sizeCard.innerHTML = `<span class="stat-value">—</span><span class="stat-sub">—</span>`;
        thickCard.innerHTML = `<span class="stat-value">—</span><span class="stat-sub">—</span>`;
        velCard.innerHTML = `<span class="stat-value">—</span><span class="stat-sub">—</span>`;
    }
    
    renderCompatibilityTab();
    renderSizingTab();
    renderDetailedReportTab();
    renderSVG();
}

function getCompatRating(materialId) {
    const mat = MATERIALS.find(m => m.id === materialId);
    const fluidInfo = FLUID_COMPATIBILITY[appState.selectedFluid];
    if (fluidInfo && mat) {
        return (fluidInfo.metals || {})[mat.compatMetalKey] || "E";
    }
    return "E";
}

function getBadgeHTML(rating) {
    return `<span class="badge badge-${rating.toLowerCase()}">${rating}</span>`;
}

function renderCompatibilityTab() {
    const listContainer = document.getElementById("compat-list-body");
    listContainer.innerHTML = "";
    
    appState.eligibleMaterials.forEach(mat => {
        const tr = document.createElement("tr");
        const badge = getBadgeHTML(mat.compatibilityRating);
        const allowableText = mat.allowableStress ? `${mat.allowableStress.toLocaleString()} psi` : "N/A";
        const suitability = mat.isEligible 
            ? `<span style="color: var(--success); font-weight: 500;">✓ Eligible</span>` 
            : `<span style="color: var(--danger); font-weight: 500; font-size: 0.8rem;">✗ Rejected: ${mat.rejectReason}</span>`;
            
        tr.innerHTML = `
            <td><strong>${mat.name}</strong><div style="font-size:0.75rem; color:var(--text-secondary)">${mat.type}</div></td>
            <td>${badge}</td>
            <td>${allowableText}</td>
            <td>${suitability}</td>
        `;
        listContainer.appendChild(tr);
    });
    
    const elasticContainer = document.getElementById("elastic-list-body");
    elasticContainer.innerHTML = "";
    const fluidInfo = FLUID_COMPATIBILITY[appState.selectedFluid];
    if (fluidInfo && fluidInfo.elastics) {
        Object.entries(fluidInfo.elastics).forEach(([elasticName, rating]) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${elasticName}</strong></td>
                <td>${getBadgeHTML(rating)}</td>
                <td>${getElasticDescription(rating)}</td>
            `;
            elasticContainer.appendChild(tr);
        });
    } else {
        elasticContainer.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted)">No elastic compatibility data available.</td></tr>`;
    }
}

function getElasticDescription(rating) {
    if (rating === "A") return "Excellent (Perfect Gasket choice)";
    if (rating === "B") return "Good (Acceptable)";
    if (rating === "C") return "Fair (Limited life)";
    if (rating === "D") return "Not Recommended (Leaking risk)";
    return "No Data";
}

function renderSizingTab() {
    const tbody = document.getElementById("sizing-list-body");
    tbody.innerHTML = "";
    
    if (appState.sizingOptions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary)">No options available for design conditions.</td></tr>`;
        return;
    }
    
    const listToDisplay = appState.sizingOptions.slice(0, 15);
    
    listToDisplay.forEach((opt, index) => {
        const tr = document.createElement("tr");
        if (appState.selectedOptionIdx === index) {
            tr.className = "selected";
        }
        
        tr.style.cursor = "pointer";
        tr.onclick = () => {
            appState.selectedOptionIdx = index;
            const rows = tbody.querySelectorAll("tr");
            rows.forEach(r => r.classList.remove("selected"));
            tr.classList.add("selected");
            renderDetailedReportTab();
            renderSVG();
        };
        
        const sizeOk = opt.isSizeAdequate 
            ? `<span style="color: var(--success)">NPS ${opt.nps}</span>` 
            : `<span style="color: var(--warning)">NPS ${opt.nps} (Small)</span>`;
            
        const thickOk = opt.isThicknessAdequate 
            ? `<span style="color: var(--success)">Sch ${opt.schedule}</span>` 
            : `<span style="color: var(--danger)">Sch ${opt.schedule} (Thin)</span>`;
            
        tr.innerHTML = `
            <td>${sizeOk}</td>
            <td><strong>${opt.thickness.toFixed(2)} mm</strong></td>
            <td>${opt.id.toFixed(1)} mm</td>
            <td><span style="font-size:0.8rem">${opt.materialName}</span></td>
            <td><strong>${opt.vActual.toFixed(2)} m/s</strong></td>
            <td>${opt.mawp ? `${opt.mawp.toFixed(1)} bar` : "N/A"}</td>
            <td>${thickOk}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderDetailedReportTab() {
    const detailsContainer = document.getElementById("details-content");
    detailsContainer.innerHTML = "";
    
    if (appState.selectedOptionIdx === null || appState.sizingOptions.length === 0) {
        detailsContainer.innerHTML = `<div style="color: var(--text-muted); text-align: center">Select a pipe row from the sizing tab.</div>`;
        return;
    }
    
    const opt = appState.sizingOptions[appState.selectedOptionIdx];
    const mat = MATERIALS.find(m => m.id === opt.materialId);
    
    let warningHTML = "";
    const fluidInfo = FLUID_COMPATIBILITY[appState.selectedFluid];
    const matRating = fluidInfo ? (fluidInfo.metals || {})[mat.compatMetalKey] || "E" : "E";
    
    if (matRating === "C") {
        warningHTML += `
            <div class="alert-box warning">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                <div><strong>Warning:</strong> Material ${mat.name} has only 'Fair' compatibility with ${appState.selectedFluid}. Accelerated corrosion is likely.</div>
            </div>
        `;
    }
    
    const { P, T } = getNormalizedValues();
    if (mat.warningTemp && T >= mat.warningTemp) {
        warningHTML += `
            <div class="alert-box warning">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                <div><strong>High Temperature Warning:</strong> ${mat.warningMsg}</div>
            </div>
        `;
    }
    
    if (!opt.isThicknessAdequate) {
        warningHTML += `
            <div class="alert-box danger">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                <div><strong>Critical:</strong> Pipe wall thickness (${opt.thickness.toFixed(2)} mm) is INSUFFICIENT for the design pressure. Required nominal thickness: ${opt.tNomReq.toFixed(2)} mm. Select a heavier schedule.</div>
            </div>
        `;
    }
    
    detailsContainer.innerHTML = `
        ${warningHTML}
        
        <div class="card" style="margin-bottom: 1.5rem">
            <h3 class="card-title">Piping Specification sheet</h3>
            <div class="details-grid">
                <div class="detail-label">Fluid Service</div><div class="detail-val">${appState.selectedFluid}</div>
                <div class="detail-label">Design Temperature</div><div class="detail-val">${appState.operatingTemperature} °${appState.temperatureUnit} (${T.toFixed(1)} °C)</div>
                <div class="detail-label">Design Pressure</div><div class="detail-val">${appState.operatingPressure} ${appState.pressureUnit} (${P.toFixed(2)} bar)</div>
                <div class="detail-label">Material Spec</div><div class="detail-val" style="color:var(--accent)">${opt.materialName}</div>
                <div class="detail-label">Nominal Pipe Size</div><div class="detail-val">NPS ${opt.nps}</div>
                <div class="detail-label">Pipe Schedule</div><div class="detail-val">Schedule ${opt.schedule}</div>
                <div class="detail-label">Manufacturing Code</div><div class="detail-val">ASME B31.3 / B36.10</div>
            </div>
        </div>

        <div class="card">
            <h3 class="card-title">ASME B31.3 Stress & Sizing Calculations</h3>
            <div class="details-grid">
                <div class="detail-label">Allowable Stress (S)</div><div class="detail-val">${(mat.allowableStresses.find(p => p.temp === T) || {stress: opt.tDesign ? (mat.allowableStress || 20000) : 20000}).stress.toLocaleString()} psi</div>
                <div class="detail-label">Design Thickness (t_design)</div><div class="detail-val">${opt.tDesign.toFixed(3)} mm</div>
                <div class="detail-label">Corrosion Allowance (c)</div><div class="detail-val">${appState.corrosionAllowance.toFixed(2)} mm</div>
                <div class="detail-label">Min Wall Thickness (t_min)</div><div class="detail-val">${opt.tMin.toFixed(3)} mm</div>
                <div class="detail-label">Mill Tolerance Allowance</div><div class="detail-val">-12.5 %</div>
                <div class="detail-label">Req. Nominal Thickness</div><div class="detail-val" style="color:var(--warning)">${opt.tNomReq.toFixed(3)} mm</div>
                <div class="detail-label">Actual Nominal Thickness</div><div class="detail-val" style="color:var(--success)">${opt.thickness.toFixed(2)} mm</div>
                <div class="detail-label">Calculated MAWP</div><div class="detail-val" style="color:var(--info)">${opt.mawp.toFixed(2)} bar (${(opt.mawp * 14.5038).toFixed(1)} psi)</div>
                <div class="detail-label">Actual Inner Diameter</div><div class="detail-val">${opt.id.toFixed(1)} mm</div>
                <div class="detail-label">Actual Flow Velocity</div><div class="detail-val" style="color:var(--success)">${opt.vActual.toFixed(2)} m/s</div>
                <div class="detail-label">Estimated Pipe Weight</div><div class="detail-val">${opt.weight.toFixed(1)} kg/m</div>
            </div>
            
            <div style="margin-top: 1.5rem; text-align: right">
                <button class="btn-primary" onclick="window.print()">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Print Spec Sheet
                </button>
            </div>
        </div>
    `;
}

// Render pipe cross-section SVG
function renderSVG() {
    const svgContainer = document.getElementById("svg-draw-area");
    svgContainer.innerHTML = "";
    
    if (appState.selectedOptionIdx === null || appState.sizingOptions.length === 0) {
        svgContainer.innerHTML = `
            <circle cx="150" cy="150" r="100" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="8" />
            <text x="150" y="150" text-anchor="middle" dominant-baseline="middle" fill="var(--text-muted)" font-size="14">No Pipe Selected</text>
        `;
        return;
    }
    
    const opt = appState.sizingOptions[appState.selectedOptionIdx];
    const od = opt.od;
    const thk = opt.thickness;
    const ca = appState.corrosionAllowance;
    const id = opt.id;
    
    const cx = 150;
    const cy = 150;
    const maxRadius = 100;
    
    const scale = maxRadius / (od / 2);
    
    const rOuter = od / 2 * scale;
    const rInner = id / 2 * scale;
    const rCorrosion = (id / 2 + ca) * scale;
    
    const svgNS = "http://www.w3.org/2000/svg";
    
    const outerCircle = document.createElementNS(svgNS, "circle");
    outerCircle.setAttribute("cx", cx);
    outerCircle.setAttribute("cy", cy);
    outerCircle.setAttribute("r", rOuter);
    outerCircle.setAttribute("fill", "rgba(59, 130, 246, 0.15)");
    outerCircle.setAttribute("stroke", "var(--accent)");
    outerCircle.setAttribute("stroke-width", "3");
    
    const innerCircle = document.createElementNS(svgNS, "circle");
    innerCircle.setAttribute("cx", cx);
    innerCircle.setAttribute("cy", cy);
    innerCircle.setAttribute("r", rInner);
    innerCircle.setAttribute("fill", "#090d16");
    innerCircle.setAttribute("stroke", "var(--info)");
    innerCircle.setAttribute("stroke-width", "2");
    
    const wallGroup = document.createElementNS(svgNS, "g");
    const donutPath = document.createElementNS(svgNS, "path");
    const pathString = `
        M ${cx} ${cy - rOuter} 
        A ${rOuter} ${rOuter} 0 1 0 ${cx} ${cy + rOuter} 
        A ${rOuter} ${rOuter} 0 1 0 ${cx} ${cy - rOuter} Z 
        M ${cx} ${cy - rInner} 
        A ${rInner} ${rInner} 0 1 1 ${cx} ${cy + rInner} 
        A ${rInner} ${rInner} 0 1 1 ${cx} ${cy - rInner} Z
    `;
    donutPath.setAttribute("d", pathString);
    donutPath.setAttribute("fill", "url(#metalGradient)");
    wallGroup.appendChild(donutPath);
    
    let corrosionLine = null;
    if (ca > 0 && rCorrosion < rOuter) {
        corrosionLine = document.createElementNS(svgNS, "circle");
        corrosionLine.setAttribute("cx", cx);
        corrosionLine.setAttribute("cy", cy);
        corrosionLine.setAttribute("r", rCorrosion);
        corrosionLine.setAttribute("fill", "none");
        corrosionLine.setAttribute("stroke", "var(--danger)");
        corrosionLine.setAttribute("stroke-dasharray", "4,4");
        corrosionLine.setAttribute("stroke-width", "1");
    }
    
    const defs = document.createElementNS(svgNS, "defs");
    const metalGradient = document.createElementNS(svgNS, "radialGradient");
    metalGradient.setAttribute("id", "metalGradient");
    metalGradient.setAttribute("cx", "50%");
    metalGradient.setAttribute("cy", "50%");
    metalGradient.setAttribute("r", "50%");
    metalGradient.setAttribute("fx", "30%");
    metalGradient.setAttribute("fy", "30%");
    
    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "rgba(59, 130, 246, 0.45)");
    
    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "70%");
    stop2.setAttribute("stop-color", "rgba(26, 37, 58, 0.85)");
    
    const stop3 = document.createElementNS(svgNS, "stop");
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", "rgba(11, 15, 25, 0.95)");
    
    metalGradient.appendChild(stop1);
    metalGradient.appendChild(stop2);
    metalGradient.appendChild(stop3);
    defs.appendChild(metalGradient);
    
    svgContainer.appendChild(defs);
    svgContainer.appendChild(outerCircle);
    svgContainer.appendChild(wallGroup);
    svgContainer.appendChild(innerCircle);
    if (corrosionLine) svgContainer.appendChild(corrosionLine);
    
    const odLine = document.createElementNS(svgNS, "line");
    odLine.setAttribute("x1", cx - rOuter);
    odLine.setAttribute("y1", cy + rOuter + 15);
    odLine.setAttribute("x2", cx + rOuter);
    odLine.setAttribute("y2", cy + rOuter + 15);
    odLine.setAttribute("stroke", "var(--accent)");
    odLine.setAttribute("stroke-width", "1");
    
    const odText = document.createElementNS(svgNS, "text");
    odText.setAttribute("x", cx);
    odText.setAttribute("y", cy + rOuter + 30);
    odText.setAttribute("text-anchor", "middle");
    odText.setAttribute("fill", "var(--accent)");
    odText.setAttribute("font-size", "11");
    odText.textContent = `OD: ${od.toFixed(1)} mm`;
    
    svgContainer.appendChild(odLine);
    svgContainer.appendChild(odText);
    
    const thkText = document.createElementNS(svgNS, "text");
    thkText.setAttribute("x", cx + (rInner + rOuter) / 2);
    thkText.setAttribute("y", cy - 5);
    thkText.setAttribute("text-anchor", "middle");
    thkText.setAttribute("fill", "var(--warning)");
    thkText.setAttribute("font-size", "11");
    thkText.textContent = `${thk.toFixed(2)} mm`;
    svgContainer.appendChild(thkText);
}

// Autocomplete and Searchable Combobox logic
function setupFluidSearch() {
    const input = document.getElementById("fluid-search");
    const dropdown = document.getElementById("fluid-dropdown");
    const arrow = document.getElementById("dropdown-arrow");
    
    const fluidsList = Object.keys(FLUID_COMPATIBILITY).sort();
    
    function renderDropdownList(list) {
        dropdown.innerHTML = "";
        appState.activeDropdownIdx = -1;
        
        if (list.length === 0) {
            dropdown.style.display = "none";
            return;
        }
        
        list.forEach((fluid, idx) => {
            const div = document.createElement("div");
            div.className = "autocomplete-item";
            div.textContent = fluid;
            div.setAttribute("data-index", idx);
            
            div.onclick = function() {
                selectFluid(fluid);
            };
            dropdown.appendChild(div);
        });
        dropdown.style.display = "block";
    }
    
    function selectFluid(fluid) {
        input.value = fluid;
        appState.selectedFluid = fluid;
        dropdown.style.display = "none";
        updateUI();
    }
    
    // Toggle full list on input click or arrow click
    function toggleFullList(e) {
        e.stopPropagation();
        const val = input.value.trim().toLowerCase();
        
        if (dropdown.style.display === "block" && !val) {
            dropdown.style.display = "none";
            return;
        }
        
        if (!val) {
            renderDropdownList(fluidsList);
        } else {
            const filtered = fluidsList.filter(f => f.toLowerCase().includes(val));
            renderDropdownList(filtered);
        }
        input.focus();
    }
    
    input.addEventListener("click", toggleFullList);
    arrow.addEventListener("click", toggleFullList);
    
    input.addEventListener("input", function() {
        const val = this.value.trim().toLowerCase();
        
        if (!val) {
            renderDropdownList(fluidsList);
            return;
        }
        
        const filtered = fluidsList.filter(f => f.toLowerCase().includes(val));
        renderDropdownList(filtered);
    });
    
    // Keyboard navigation in dropdown list
    input.addEventListener("keydown", function(e) {
        const items = dropdown.querySelectorAll(".autocomplete-item");
        if (dropdown.style.display !== "block" || items.length === 0) return;
        
        if (e.key === "ArrowDown") {
            e.preventDefault();
            appState.activeDropdownIdx = (appState.activeDropdownIdx + 1) % items.length;
            highlightItem(items);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            appState.activeDropdownIdx = (appState.activeDropdownIdx - 1 + items.length) % items.length;
            highlightItem(items);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (appState.activeDropdownIdx >= 0 && appState.activeDropdownIdx < items.length) {
                items[appState.activeDropdownIdx].click();
            }
        } else if (e.key === "Escape") {
            dropdown.style.display = "none";
        }
    });
    
    function highlightItem(items) {
        items.forEach(item => item.classList.remove("active"));
        if (appState.activeDropdownIdx >= 0) {
            const activeItem = items[appState.activeDropdownIdx];
            activeItem.classList.add("active");
            activeItem.scrollIntoView({ block: "nearest" });
        }
    }
    
    // Close dropdown on click outside
    document.addEventListener("click", function(e) {
        if (e.target !== input && e.target !== dropdown && e.target !== arrow && !arrow.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });
}

// Full compatibility spreadsheet modal builder
function initCompatibilitySheet() {
    const sheetTheadRow = document.getElementById("sheet-thead-row");
    const sheetTbody = document.getElementById("sheet-tbody");
    
    // 1. Gather component headers
    // Since all fluids have the same columns, take the first fluid's components
    const firstFluidKey = Object.keys(FLUID_COMPATIBILITY)[0];
    const firstFluid = FLUID_COMPATIBILITY[firstFluidKey];
    
    const metalHeaders = Object.keys(firstFluid.metals || {}).sort();
    const elasticHeaders = Object.keys(firstFluid.elastics || {}).sort();
    
    // Build Header Columns
    let headerHTML = `
        <th style="left:0; z-index:10; background:#0f172a">Fluid Name</th>
    `;
    
    metalHeaders.forEach(m => {
        headerHTML += `<th style="border-bottom: 2px solid var(--accent)">${m}</th>`;
    });
    elasticHeaders.forEach(e => {
        headerHTML += `<th style="border-bottom: 2px solid var(--info)">${e}</th>`;
    });
    
    sheetTheadRow.innerHTML = headerHTML;
    
    // 2. Render all fluid rows
    const fluidsList = Object.keys(FLUID_COMPATIBILITY).sort();
    
    function renderRows(filterVal = "") {
        sheetTbody.innerHTML = "";
        const query = filterVal.trim().toLowerCase();
        
        fluidsList.forEach(fluidName => {
            if (query && !fluidName.toLowerCase().includes(query)) return;
            
            const info = FLUID_COMPATIBILITY[fluidName];
            const tr = document.createElement("tr");
            
            // Highlight when clicked: close modal and load fluid in selector!
            tr.style.cursor = "pointer";
            tr.onclick = () => {
                document.getElementById("fluid-search").value = fluidName;
                appState.selectedFluid = fluidName;
                document.getElementById("compatibility-sheet-view").style.display = "none";
                updateUI();
            };
            
            let rowHTML = `
                <td><strong>${fluidName}</strong></td>
            `;
            
            // Add metal ratings
            metalHeaders.forEach(m => {
                const rating = (info.metals || {})[m] || "E";
                rowHTML += `<td class="cell-${rating.toLowerCase()}">${rating}</td>`;
            });
            
            // Add elastic ratings
            elasticHeaders.forEach(e => {
                const rating = (info.elastics || {})[e] || "E";
                rowHTML += `<td class="cell-${rating.toLowerCase()}">${rating}</td>`;
            });
            
            tr.innerHTML = rowHTML;
            sheetTbody.appendChild(tr);
        });
    }
    
    renderRows();
    
    // Bind search bar inside the sheet overlay
    document.getElementById("sheet-search-input").addEventListener("input", function() {
        renderRows(this.value);
    });
    
    // Bind open/close buttons for the overlay
    document.getElementById("open-sheet-btn").onclick = () => {
        document.getElementById("compatibility-sheet-view").style.display = "flex";
        // Reset search
        document.getElementById("sheet-search-input").value = "";
        renderRows();
    };
    
    document.getElementById("close-sheet-btn").onclick = () => {
        document.getElementById("compatibility-sheet-view").style.display = "none";
    };
}

// Bind standard event handlers
function setupFormListeners() {
    document.getElementById("pressure-input").addEventListener("input", function() {
        appState.operatingPressure = parseFloat(this.value) || 0;
        updateUI();
    });
    document.getElementById("pressure-unit").addEventListener("change", function() {
        appState.pressureUnit = this.value;
        updateUI();
    });
    
    document.getElementById("temp-input").addEventListener("input", function() {
        appState.operatingTemperature = parseFloat(this.value) || 0;
        updateUI();
    });
    document.getElementById("temp-unit").addEventListener("change", function() {
        appState.temperatureUnit = this.value;
        updateUI();
    });
    
    document.getElementById("flow-input").addEventListener("input", function() {
        appState.flowRate = parseFloat(this.value) || 0;
        updateUI();
    });
    document.getElementById("flow-unit").addEventListener("change", function() {
        appState.flowRateUnit = this.value;
        updateUI();
    });
    
    document.getElementById("velocity-input").addEventListener("input", function() {
        appState.targetVelocity = parseFloat(this.value) || 0.1;
        updateUI();
    });
    document.getElementById("velocity-unit").addEventListener("change", function() {
        appState.velocityUnit = this.value;
        updateUI();
    });
    
    document.getElementById("corrosion-input").addEventListener("input", function() {
        appState.corrosionAllowance = parseFloat(this.value) || 0;
        updateUI();
    });
    
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn => {
        btn.onclick = function() {
            tabButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            
            const tabId = this.getAttribute("data-tab");
            const tabContents = document.querySelectorAll(".tab-content");
            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === tabId) {
                    content.classList.add("active");
                }
            });
        };
    });
}

// Initialization on load
document.addEventListener("DOMContentLoaded", () => {
    setupFluidSearch();
    setupFormListeners();
    initCompatibilitySheet();
    updateUI();
});
