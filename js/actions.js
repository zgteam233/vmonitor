import { clamp, log, addScore, updateNumbers } from "./ui.js";

export function act(patient, name) {
    if (patient.ended) return;

    const once = {
        assessment:"assessment", call:"team", oxygen:"oxygen",
        airway:"airway", monitor:"monitor", iv:"iv"
    };
    if (once[name] && patient[once[name]]) {
        log("该操作已经执行");
        return;
    }

    switch (name) {
        case "assessment":
            patient.assessment = true;
            addScore(patient, 10);
            log("完成初步评估：循环、呼吸、意识状态异常");
            break;
        case "call":
            patient.team = true;
            addScore(patient, 15);
            log("已启动急救团队");
            break;
        case "oxygen":
            patient.oxygen = true;
            patient.fio2 = 60;
            patient.spo2 = clamp(patient.spo2 + 8, 0, 99);
            addScore(patient, 10);
            log("模拟氧疗支持已启动");
            break;
        case "airway":
            patient.airway = true;
            patient.rr = 20;
            addScore(patient, 10);
            log("气道评估完成，已进行模拟气道管理");
            break;
        case "monitor":
            patient.monitor = true;
            addScore(patient, 10);
            log("四通道监护系统已连接");
            break;
        case "iv":
            patient.iv = true;
            addScore(patient, 10);
            log("已建立模拟静脉通路");
            break;
        case "cpr":
            if (!patient.arrested) {
                log("当前未发生心搏骤停，不应盲目实施 CPR", "#ffd166");
                return;
            }
            patient.cpr = true;
            addScore(patient, 15);
            log("模拟 CPR 已启动，持续监测并遵循专业复苏流程", "#43f5a0");
            break;
        case "reassess":
            addScore(patient, 5);
            log("重新评估 HR=" + patient.hr +
                " BP=" + patient.sys + "/" + patient.dia +
                " SpO₂=" + patient.spo2 +
                " EtCO₂=" + patient.co2);
            break;
    }
    updateNumbers(patient);
}
