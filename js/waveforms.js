export function plethValue(patient, milliseconds) {
    const period = 60000 / Math.max(1, patient.hr);
    const time = (((milliseconds % period) + period) % period) / period;
    if (patient.arrested) return 0.01 * Math.sin(milliseconds * 0.02);
    if (time < 0.20) return Math.sin(time / 0.20 * Math.PI / 2);
    if (time < 0.48) return 1 - (time - 0.20) / 0.28 * 0.60;
    if (time < 0.56) return 0.40 + (time - 0.48) / 0.08 * 0.08;
    return 0.48 - (time - 0.56) / 0.44 * 0.48;
}

export function pressureValue(patient, milliseconds) {
    const period = 60000 / Math.max(1, patient.hr);
    const time = (((milliseconds % period) + period) % period) / period;
    if (patient.arrested) return 0;
    const amplitude = patient.sys - patient.dia;
    let wave = 0;
    if (time < 0.18) {
        wave = Math.sin(time / 0.18 * Math.PI / 2);
    } else if (time < 0.32) {
        wave = 1 - (time - 0.18) / 0.14 * 0.28;
    } else if (time < 0.43) {
        wave = 0.72 + Math.sin((time - 0.32) / 0.11 * Math.PI) * 0.04;
    } else {
        wave = 0.72 * (1 - (time - 0.43) / 0.57);
    }
    return patient.dia + amplitude * wave;
}

export function capnoValue(patient, milliseconds) {
    if (patient.rr <= 0) return 0;
    const period = 60000 / patient.rr;
    const time = (((milliseconds % period) + period) % period) / period;
    if (patient.arrested) return 0;
    if (time < 0.18) return 0;
    if (time < 0.34) return patient.co2 * (time - 0.18) / 0.16;
    if (time < 0.66) return patient.co2 * (0.96 + 0.04 * (time - 0.34) / 0.32);
    if (time < 0.76) return patient.co2 * (1 - (time - 0.66) / 0.10);
    return 0;
}
