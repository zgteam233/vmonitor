import { $, log, updateNumbers } from "./ui.js";
import { changeRhythm } from "./rhythm-controller.js";

const rhythmEvents = [
    "tachy", "af", "svt", "afl", "rbbb", "lbbb",
    "vt", "vf", "av1", "av2_1", "av2_2", "av3"
];

export function initAutoRhythm(patient) {
    const checkbox = $("autoRhythm");
    const eventRate = $("eventRate");
    const currentEvent = $("autoEvent");
    let enabled = false;
    let nextEvent = 0;
    let eventCount = 0;

    function scheduleEvent() {
        const ranges = {
            slow:[90, 150],
            normal:[45, 100],
            high:[15, 50]
        };
        const [min, max] = ranges[eventRate.value] || ranges.normal;
        nextEvent = Date.now() + (min + Math.random() * (max - min)) * 1000;
    }

    function tick() {
        if (!enabled || patient.ended || Date.now() < nextEvent) return;
        eventCount++;

        if (patient.arrested) {
            currentEvent.textContent = "心搏骤停持续";
            scheduleEvent();
            return;
        }

        const event = Math.random();
        if (event < 0.35) {
            const type = rhythmEvents[Math.floor(Math.random() * rhythmEvents.length)];
            changeRhythm(patient, type);
            log("自动事件：新发心律异常 #" + eventCount, "#ffd166");
            currentEvent.textContent = "新发心律异常：" +
                $("rhythmSelect").selectedOptions[0].textContent;
        } else if (event < 0.65) {
            patient.sys = Math.max(40, patient.sys - 15);
            patient.spo2 = Math.max(65, patient.spo2 - 5);
            patient.co2 = Math.max(5, patient.co2 - 3);
            log("自动事件：循环及呼吸状态恶化", "#ff5967");
            currentEvent.textContent = "循环及呼吸恶化";
        } else {
            const type = Math.random() < 0.5 ? "vf" : "vt";
            changeRhythm(patient, type);
            patient.arrested = true;
            patient.pulseless = true;
            patient.hr = 0;
            patient.sys = 0;
            patient.dia = 0;
            patient.rr = 0;
            log("紧急事件：患者发生模拟心搏骤停", "#ff5967");
            currentEvent.textContent = "心搏骤停";
        }

        updateNumbers(patient);
        scheduleEvent();
    }

    checkbox.addEventListener("change", () => {
        enabled = checkbox.checked;
        if (enabled) {
            scheduleEvent();
            log("自动节律模式已启用", "#43f5a0");
            currentEvent.textContent = "等待事件";
        } else {
            log("自动节律模式已关闭");
            currentEvent.textContent = "手动模式";
        }
    });
    eventRate.addEventListener("change", () => {
        if (enabled) scheduleEvent();
    });

    return tick;
}
