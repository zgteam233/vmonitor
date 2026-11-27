import { $, clamp, updateNumbers } from "./ui.js";

export function tick(patient) {
    if (patient.ended) return;

    patient.time++;
    if (!patient.arrested && !patient.shocked) {
        if (!patient.oxygen) {
            patient.spo2 = clamp(patient.spo2 - 0.15, 65, 99);
        }
        patient.co2 = clamp(patient.co2 + (Math.random() - 0.55) * 0.6, 10, 65);
        patient.sys = clamp(patient.sys - 0.08, 40, 130);
    }

    if (patient.arrested && patient.cpr) {
        patient.co2 = clamp(patient.co2 + 0.4, 10, 45);
        patient.spo2 = clamp(patient.spo2 + 0.1, 65, 90);
    }

    if (patient.shocked) {
        patient.hr = 85;
        patient.spo2 = clamp(patient.spo2 + 0.1, 90, 98);
        patient.co2 = clamp(patient.co2, 25, 40);
    }

    const hours = Math.floor(patient.time / 3600);
    const minutes = Math.floor((patient.time % 3600) / 60);
    const seconds = patient.time % 60;
    $("timer").textContent =
        (hours > 0 ? String(hours).padStart(2, "0") + ":" : "") +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
    $("timebar").style.width = "100%";
    updateNumbers(patient);
}
