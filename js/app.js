import { patient } from "./state.js";
import { $, log, updateNumbers } from "./ui.js";
import { act } from "./actions.js";
import { resize, animate } from "./monitor.js";
import { tick } from "./simulation.js";
import { changeRhythm, restoreRhythmSelection } from "./rhythm-controller.js";
import { initManualDefibrillator } from "./manual-defibrillator.js";
import { initAutoRhythm } from "./auto-rhythm.js";

function init() {
    resize();
    updateNumbers(patient);
    log("ICU 监护系统初始化完成", "#43f5a0");
    log("ECG / Pleth / NIBP / EtCO₂ 已启动");
    log("等待急救人员进行患者评估");

    document.querySelector(".actions").addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (button) act(patient, button.dataset.action);
    });
    $("rhythmSelect").addEventListener("change", event => {
        const type = event.target.value;
        if (!changeRhythm(patient, type)) restoreRhythmSelection();
    });
    initManualDefibrillator(patient);
    const autoRhythmTick = initAutoRhythm(patient);
    window.addEventListener("resize", resize);
    requestAnimationFrame(timestamp => animate(timestamp, patient));
    setInterval(() => {
        tick(patient);
        autoRhythmTick();
    }, 1000);
}

init();
