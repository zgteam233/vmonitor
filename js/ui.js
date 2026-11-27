export const $ = id => document.getElementById(id);

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function map(patient) {
    return Math.round((patient.sys + 2 * patient.dia) / 3);
}

function displayInt(value) {
    return Math.round(value).toString();
}

export function log(message, color="#b9cadb") {
    const list = $("log");
    const item = document.createElement("div");
    item.style.color = color;
    item.textContent = new Date().toLocaleTimeString() + " | " + message;
    list.prepend(item);
}

export function addScore(patient, points) {
    patient.score += points;
    $("score").textContent = patient.score;
}

export function updateNumbers(patient) {
    $("hr").textContent = displayInt(patient.hr);
    $("spo2").textContent = displayInt(patient.spo2);
    $("bp").textContent = displayInt(patient.sys) + "/" + displayInt(patient.dia);
    $("map").textContent = map(patient);
    $("co2").textContent = displayInt(patient.co2);
    $("rr").textContent = displayInt(patient.rr) + " /min";
    $("fio2").textContent = displayInt(patient.fio2) + "%";
    $("co2b").textContent = displayInt(patient.co2) + " mmHg";
    $("ecgLabel").textContent = "HR " + displayInt(patient.hr) + " BPM";
    $("plethLabel").textContent = "SpO₂ " + displayInt(patient.spo2) + "%";
    $("nibpLabel").textContent = displayInt(patient.sys) + "/" +
        displayInt(patient.dia) + " (" + map(patient) + ")";
    $("co2Label").textContent = "EtCO₂ " + displayInt(patient.co2) + " mmHg";
    $("conscious").textContent = patient.arrested ? "无反应" :
        patient.sys < 70 ? "意识障碍" : "意识模糊";
    $("condition").textContent = patient.arrested ? "心搏骤停" :
        patient.spo2 < 90 || patient.sys < 70 ? "危重" :
            patient.spo2 < 95 ? "不稳定" : "改善中";
    $("resp").textContent = patient.rr === 0 ? "呼吸停止" :
        patient.co2 < 20 ? "通气异常" : "监测中";
    $("status").textContent = patient.arrested ? "● CARDIAC ARREST" :
        patient.sys < 70 ? "● CRITICAL" : "● MONITORING";
    $("status").className = patient.arrested || patient.sys < 70 ? "red" : "green";
}
