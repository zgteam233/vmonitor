const rhythmVitals = {
    sinus:  { hr:80, sys:120, dia:80, co2:35, spo2:98, rr:16 },
    tachy:  { hr:145, sys:110, dia:70, co2:35, spo2:96, rr:22 },
    af:     { hr:130, sys:100, dia:65, co2:32, spo2:95, rr:22 },
    svt:    { hr:180, sys:100, dia:65, co2:32, spo2:96, rr:24 },
    afl:    { hr:150, sys:100, dia:65, co2:32, spo2:95, rr:22 },
    vt:     { hr:180, sys:65, dia:40, co2:20, spo2:85, rr:25 },
    vf:     { hr:0, sys:0, dia:0, co2:5, spo2:70, rr:0, arrested:true, pulseless:true },
    asystole:{ hr:0, sys:0, dia:0, co2:5, spo2:70, rr:0, arrested:true, pulseless:true },
    rbbb:   { hr:80, sys:120, dia:80, co2:35, spo2:98, rr:16 },
    lbbb:   { hr:80, sys:120, dia:80, co2:35, spo2:98, rr:16 },
    av1:    { hr:80, sys:115, dia:75 },
    av2_1:  { hr:60, sys:105, dia:70 },
    av2_2:  { hr:45, sys:90, dia:60 },
    av3:    { hr:35, sys:75, dia:45 }
};

export function applyRhythmVitals(patient, type) {
    const vitals = rhythmVitals[type];
    if (!vitals) return false;

    Object.assign(patient, vitals, {
        arrested: type === "vf" || type === "asystole",
        pulseless: type === "vf" || type === "asystole",
        shocked:false,
        cpr:false
    });
    return true;
}
