import { rhythm, setRhythm } from "./rhythm.js";
import { applyRhythmVitals } from "./patient-state.js";
import { $, log, updateNumbers } from "./ui.js";

export function changeRhythm(patient, type) {
    if (patient.ended || !setRhythm(type)) return false;
    if (!applyRhythmVitals(patient, type)) return false;

    $("rhythmSelect").value = type;
    log("心律切换：" + $("rhythmSelect").selectedOptions[0].textContent, "#43f5a0");
    updateNumbers(patient);
    return true;
}

export function restoreRhythmSelection() {
    $("rhythmSelect").value = rhythm.type;
}
