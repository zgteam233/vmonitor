import { $ } from "./ui.js";
import { ecgValue } from "./rhythm.js";
import { plethValue, pressureValue, capnoValue } from "./waveforms.js";
import { state } from "./state.js";

const canvases = ["ecg", "pleth", "nibp", "capno"];
const traces = {};

export function resize() {
    canvases.forEach(id => {
        const canvas = $(id);
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        const ctx = canvas.getContext("2d");
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const grid = document.createElement("canvas");
        grid.width = canvas.width;
        grid.height = canvas.height;
        drawGrid(grid.getContext("2d"), grid.width, grid.height);

        traces[id] = { ctx, grid, x:0, previousY:null };
    });
}

function drawGrid(ctx, width, height) {
    ctx.fillStyle = "#050a0b";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = "#153329";
    const step = width / 40;
    for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += height / 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function drawTrace(id, color, fn, range, baseline, dt) {
    const canvas = $(id);
    const trace = traces[id];
    if (!trace) return;
    const { ctx, grid } = trace;
    const width = canvas.width;
    const height = canvas.height;
    const speed = Number($("speed").value);
    const dpr = window.devicePixelRatio || 1;
    const pxPerSecond = 100 * speed * dpr;
    const previousPosition = trace.x;
    trace.x += pxPerSecond * dt;
    const currentPosition = Math.floor(trace.x);

    for (let position = previousPosition === 0 ? 1 : Math.floor(previousPosition) + 1;
        position <= currentPosition;
        position++) {
        const x = position % width;
        if (x === 0 && position > 0) trace.previousY = null;

        const segmentWidth = Math.min(3, width - x);
        ctx.clearRect(x, 0, segmentWidth, height);
        ctx.drawImage(grid, x, 0, segmentWidth, height, x, 0, segmentWidth, height);

        const time = state.time - ((width - x) / pxPerSecond) * 1000;
        const y = baseline * dpr - fn(time) * range * dpr;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * dpr;
        ctx.shadowBlur = 0;

        if (trace.previousY !== null) {
            ctx.beginPath();
            ctx.moveTo(x - 1, trace.previousY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        trace.previousY = y;
    }

    if (trace.x >= width) {
        trace.x %= width;
        trace.previousY = null;
    }
}

export function animate(timestamp, patient) {
    if (!state.last) state.last = timestamp;
    const dt = Math.min((timestamp - state.last) / 1000, 0.05);
    state.last = timestamp;
    state.time += dt * 1000;
    drawTrace("ecg", "#43f5a0", ecgValue, 43, 57, dt);
    drawTrace("pleth", "#45caff", ms => plethValue(patient, ms), 65, 92, dt);
    drawTrace("nibp", "#ffd166",
        ms => (pressureValue(patient, ms) - patient.dia) / Math.max(1, patient.sys - patient.dia),
        65, 110 - patient.dia / 180 * 65, dt);
    drawTrace("capno", "#43f5a0",
        ms => capnoValue(patient, ms) / Math.max(1, patient.co2),
        65, 100, dt);
    requestAnimationFrame(timestamp => animate(timestamp, patient));
}
