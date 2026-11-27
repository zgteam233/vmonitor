export const rhythm = {
    type:"sinus",
    atrialRate:120,
    ventricularRate:120,
    afBeats:[0]
};

function gaussian(time, center, width, amplitude) {
    return amplitude * Math.exp(-0.5 * Math.pow((time - center) / width, 2));
}

function phaseAt(time, period) {
    return ((time % period) + period) % period;
}

function qrsValue(time) {
    return gaussian(time, 0, 10, -0.16)
        + gaussian(time, 22, 9, 1.0)
        + gaussian(time, 48, 12, -0.25)
        + gaussian(time, 170, 55, 0.30);
}

function wavePQRST(time, period, pr=160) {
    const phase = phaseAt(time, period);
    const qrsPhase = period * 0.25;
    return gaussian(phase, qrsPhase - pr, 24, 0.12)
        + qrsValue(phase - qrsPhase);
}

function prepareAF(until) {
    while (rhythm.afBeats[rhythm.afBeats.length - 1] < until + 1000) {
        const index = rhythm.afBeats.length;
        const seeded = Math.sin(index * 127.1 + 311.7) * 43758.5453;
        const random = seeded - Math.floor(seeded);
        const interval = 450 + random * 550;
        rhythm.afBeats.push(rhythm.afBeats[rhythm.afBeats.length - 1] + interval);
    }
}

function latestBeat(beats, time) {
    let left = 0;
    let right = beats.length - 1;
    while (left < right) {
        const middle = Math.ceil((left + right) / 2);
        if (beats[middle] <= time) left = middle;
        else right = middle - 1;
    }
    return beats[left];
}

const rhythmSettings = {
    sinus:  { atrialRate:80, ventricularRate:80 },
    tachy:  { atrialRate:145, ventricularRate:145 },
    af:     { atrialRate:350, ventricularRate:130 },
    svt:    { atrialRate:180, ventricularRate:180 },
    afl:    { atrialRate:300, ventricularRate:150 },
    vt:     { atrialRate:120, ventricularRate:180 },
    vf:     { atrialRate:300, ventricularRate:0 },
    rbbb:   { atrialRate:80, ventricularRate:80 },
    lbbb:   { atrialRate:80, ventricularRate:80 },
    av1:    { atrialRate:80, ventricularRate:80 },
    av2_1:  { atrialRate:90, ventricularRate:60 },
    av2_2:  { atrialRate:90, ventricularRate:45 },
    av3:    { atrialRate:90, ventricularRate:35 },
    asystole:{ atrialRate:0, ventricularRate:0 }
};

export function ecgValue(milliseconds) {
    if (rhythm.type === "asystole") {
        return 0.015 * Math.sin(milliseconds * 0.018);
    }

    const time = milliseconds;
    switch (rhythm.type) {
        case "sinus":
        case "tachy": {
            const period = 60000 / Math.max(1, rhythm.ventricularRate);
            return wavePQRST(time, period);
        }
        case "af": {
            prepareAF(time);
            const beat = latestBeat(rhythm.afBeats, time);
            const beatTime = time - beat;
            const fibrillation = Math.sin(time * 0.035) * 0.025
                + Math.sin(time * 0.071) * 0.018
                + Math.sin(time * 0.113) * 0.012;
            return fibrillation
                + gaussian(beatTime, 0, 10, -0.12)
                + gaussian(beatTime, 22, 9, 1.0)
                + gaussian(beatTime, 48, 12, -0.24)
                + gaussian(beatTime, 170, 55, 0.28);
        }
        case "svt": {
            const period = 60000 / rhythm.ventricularRate;
            const phase = phaseAt(time, period);
            return gaussian(phase, period * 0.24, 10, -0.12)
                + gaussian(phase, period * 0.26, 9, 1)
                + gaussian(phase, period * 0.29, 11, -0.2)
                + gaussian(phase, period * 0.65, 35, 0.2);
        }
        case "afl": {
            const atrialPeriod = 60000 / rhythm.atrialRate;
            const ventricularPeriod = 60000 / rhythm.ventricularRate;
            const atrialPhase = phaseAt(time, atrialPeriod);
            const ventricularPhase = phaseAt(time, ventricularPeriod);
            const flutter = 0.12 * (2 * atrialPhase / atrialPeriod - 1);
            const qrs = gaussian(ventricularPhase, ventricularPeriod * 0.25, 10, -0.15)
                + gaussian(ventricularPhase, ventricularPeriod * 0.27, 9, 1)
                + gaussian(ventricularPhase, ventricularPeriod * 0.30, 12, -0.2);
            return flutter + qrs;
        }
        case "vt": {
            const period = 60000 / Math.max(1, rhythm.ventricularRate);
            const phase = phaseAt(time, period);
            return gaussian(phase, period * 0.24, 42, 0.95)
                - gaussian(phase, period * 0.42, 32, 0.48)
                + gaussian(phase, period * 0.70, 75, -0.22);
        }
        case "vf":
            return Math.sin(time * 0.035) * 0.22
                + Math.sin(time * 0.057) * 0.17
                + Math.sin(time * 0.091) * 0.12
                + Math.sin(time * 0.013) * 0.10;
        case "rbbb":
        case "lbbb":
            return bundleBranchValue(time, rhythm.type);
        case "av1":
        case "av2_1":
        case "av2_2":
        case "av3":
            return avBlockValue(time, rhythm.type);
        default:
            return 0;
    }
}

function bundleBranchValue(time, type) {
    const period = 60000 / rhythm.ventricularRate;
    const phase = phaseAt(time, period);
    if (type === "rbbb") {
        return gaussian(phase, period * 0.20, 13, -0.15)
            + gaussian(phase, period * 0.25, 19, 0.85)
            + gaussian(phase, period * 0.34, 17, -0.35)
            + gaussian(phase, period * 0.41, 17, 0.55)
            + gaussian(phase, period * 0.67, 48, -0.25);
    }
    return gaussian(phase, period * 0.25, 29, 0.9)
        + gaussian(phase, period * 0.38, 25, 0.35)
        + gaussian(phase, period * 0.68, 65, -0.3);
}

function avBlockValue(time, type) {
    const atrialPeriod = 60000 / Math.max(1, rhythm.atrialRate);
    const ventricularPeriod = 60000 / Math.max(1, rhythm.ventricularRate);
    const atrialPhase = phaseAt(time, atrialPeriod);
    let value = gaussian(atrialPhase, 0, 25, 0.12);

    if (type === "av1") {
        const ventricularPhase = phaseAt(time - 260, ventricularPeriod);
        value += qrsValue(ventricularPhase);
    } else if (type === "av2_1") {
        const atrialIndex = Math.floor(time / atrialPeriod);
        const conduction = atrialIndex % 4;
        if (conduction !== 3) {
            const pr = 130 + conduction * 65;
            value += qrsValue(atrialPhase - pr);
        }
    } else if (type === "av2_2") {
        const atrialIndex = Math.floor(time / atrialPeriod);
        if (atrialIndex % 3 !== 2) {
            value += qrsValue(atrialPhase - 180);
        }
    } else {
        value += qrsValue(phaseAt(time, ventricularPeriod));
    }

    return value;
}

export function setRhythm(type, ventricularRate) {
    const settings = rhythmSettings[type];
    if (!settings) return false;

    rhythm.type = type;
    rhythm.atrialRate = settings.atrialRate;
    rhythm.ventricularRate = ventricularRate ?? settings.ventricularRate;
    rhythm.afBeats = [0];
    return true;
}
