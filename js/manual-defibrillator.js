import { $, addScore, log, updateNumbers } from "./ui.js";
import { changeRhythm } from "./rhythm-controller.js";
import { rhythm } from "./rhythm.js";

const defibrillator = {
    energy:0,
    charged:false,
    charging:false,
    sync:false,
    chargeProgress:0,
    timer:null
};

function updateSyncDisplay() {
    $("syncButton").textContent = defibrillator.sync ? "SYNC ON" : "SYNC OFF";
    $("syncStatus").textContent = "SYNC: " + (defibrillator.sync ? "ON" : "OFF");
}

function charge(patient) {
    if (patient.ended || defibrillator.charging || defibrillator.charged) return;

    defibrillator.energy = Number($("energySelect").value);
    defibrillator.charging = true;
    defibrillator.chargeProgress = 0;
    $("defibState").textContent = "CHARGING";
    $("energyDisplay").textContent = defibrillator.energy;
    $("chargeBar").style.width = "0%";
    $("shockStatus").textContent = "正在充电...";
    log("手动除颤仪开始模拟充电");

    defibrillator.timer = setInterval(() => {
        defibrillator.chargeProgress += 10;
        $("chargeBar").style.width = defibrillator.chargeProgress + "%";

        if (defibrillator.chargeProgress >= 100) {
            clearInterval(defibrillator.timer);
            defibrillator.timer = null;
            defibrillator.charging = false;
            defibrillator.charged = true;
            $("defibState").textContent = "CHARGED";
            $("shockStatus").textContent = "充电完成，等待操作者判断";
            log("模拟除颤仪充电完成", "#43f5a0");
        }
    }, 150);
}

function toggleSync(patient) {
    if (patient.ended) return;
    defibrillator.sync = !defibrillator.sync;
    updateSyncDisplay();
    log("同步模式：" + (defibrillator.sync ? "开启" : "关闭"));
}

function canDeliverShock(patient) {
    const shockable = !defibrillator.sync
        && patient.arrested
        && (rhythm.type === "vf" || (rhythm.type === "vt" && patient.pulseless));
    const synchronized = defibrillator.sync
        && !patient.arrested
        && rhythm.type === "vt"
        && !patient.pulseless;
    return shockable || synchronized;
}

function consumeCharge() {
    if (defibrillator.timer !== null) clearInterval(defibrillator.timer);
    defibrillator.timer = null;
    defibrillator.charging = false;
    defibrillator.charged = false;
    defibrillator.chargeProgress = 0;
    $("chargeBar").style.width = "0%";
    $("defibState").textContent = "DISCHARGED";
}

function calculateShockOutcome(patient) {
    let success = 0.35;
    let worsen = 0.10;

    if (rhythm.type === "vf") {
        success = 0.55;
        worsen = 0.08;
    } else if (rhythm.type === "vt" && patient.pulseless) {
        success = 0.45;
        worsen = 0.12;
    } else if (rhythm.type === "vt") {
        success = 0.40;
        worsen = 0.15;
    }

    const energyFactor = Math.max(0.65, Math.min(1.25, defibrillator.energy / 200));
    success = Math.min(0.80, success * energyFactor);
    const roll = Math.random();

    if (roll < success) return "success";
    if (roll < success + worsen) return "worsen";
    return "unchanged";
}

function applyShockOutcome(patient, outcome) {
    switch (outcome) {
        case "success":
            changeRhythm(patient, "sinus");
            patient.pulseless = false;
            patient.arrested = false;
            patient.shocked = true;
            patient.sys = Math.max(90, patient.sys);
            patient.dia = Math.max(60, patient.dia);
            patient.spo2 = Math.max(90, patient.spo2);
            log("电击后出现有组织心律，等待重新评估脉搏和循环。");
            addScore(patient, 10);
            break;
        case "unchanged":
            log("电击后心律未发生明显改变。");
            break;
        case "worsen":
            if (rhythm.type === "vt") {
                changeRhythm(patient, "vf");
            } else {
                patient.sys = Math.max(0, patient.sys - 20);
                patient.dia = Math.max(0, patient.dia - 10);
                patient.spo2 = Math.max(0, patient.spo2 - 5);
            }
            log("电击后患者状态恶化！");
            break;
    }
}

function shock(patient) {
    if (!defibrillator.charged) {
        log("模拟放电失败：除颤仪尚未充电", "#ff5967");
        return;
    }
    if (patient.ended) return;
    if (!canDeliverShock(patient)) {
        log("模拟放电条件不满足：当前心律与模式不匹配", "#ff5967");
        return;
    }

    consumeCharge();
    const outcome = calculateShockOutcome(patient);
    const mode = defibrillator.sync ? "同步电复律" : "非同步除颤";

    log("执行模拟" + mode + "：" + defibrillator.energy + " J", "#43f5a0");
    applyShockOutcome(patient, outcome);
    defibrillator.energy = 0;
    $("energyDisplay").textContent = "0";
    $("shockResult").textContent = {
        success:"心律改善",
        unchanged:"心律未改变",
        worsen:"患者状态恶化"
    }[outcome];
    $("shockStatus").textContent = "放电完成，重新评估心律、脉搏及生命体征";
    log("电击后请重新评估心律、脉搏及生命体征。");
    updateNumbers(patient);
}

function cancel() {
    if (defibrillator.timer !== null) clearInterval(defibrillator.timer);
    defibrillator.timer = null;
    defibrillator.charging = false;
    defibrillator.charged = false;
    defibrillator.chargeProgress = 0;
    $("chargeBar").style.width = "0%";
    $("energyDisplay").textContent = "0";
    $("defibState").textContent = "READY";
    $("shockStatus").textContent = "已取消";
    log("模拟除颤仪操作已取消");
}

export function initManualDefibrillator(patient) {
    updateSyncDisplay();
    $("defibActions").addEventListener("click", event => {
        const button = event.target.closest("[data-defib-action]");
        if (!button) return;

        switch (button.dataset.defibAction) {
            case "charge":
                charge(patient);
                break;
            case "sync":
                toggleSync(patient);
                break;
            case "shock":
                shock(patient);
                break;
            case "cancel":
                cancel();
                break;
        }
    });
}
