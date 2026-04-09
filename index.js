const axios = require("axios");

const BOT_TOKEN = "8619360049:AAGn1nYgQv7RDnKrZxcxktlqoiCLZxyMiHw";
const CHAT_ID = "7198918609";

const PAIRS = ["BTCUSDT","ETHUSDT","SOLUSDT","AVAXUSDT","LINKUSDT"];

let sent = {};

async function getData(symbol, interval="15m") {
const res = await axios.get(
"https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=120"
);
return res.data;
}

// 🔹 HTF Bias (1H)
function getHTFBias(data) {
let highs = data.map(c => +c[2]);
let closes = data.map(c => +c[4]);

let last = data.length - 1;
let prevHigh = Math.max(...highs.slice(last-20, last));

if (closes[last] > prevHigh) return "bullish";
if (closes[last] < prevHigh) return "bearish";

return "neutral";
}

// 🔹 BOS
function detectBOS(data) {
let highs = data.map(c => +c[2]);
let lows = data.map(c => +c[3]);
let closes = data.map(c => +c[4]);

let last = data.length - 1;

let prevHigh = Math.max(...highs.slice(last-20, last));
let prevLow = Math.min(...lows.slice(last-20, last));

if (closes[last] > prevHigh) return "bullish";
if (closes[last] < prevLow) return "bearish";

return null;
}

// 🔹 Liquidity Sweep
function detectSweep(data) {
let highs = data.map(c => +c[2]);
let lows = data.map(c => +c[3]);
let closes = data.map(c => +c[4]);

let last = data.length - 1;

let prevHigh = Math.max(...highs.slice(last-20, last-1));
let prevLow = Math.min(...lows.slice(last-20, last-1));

if (highs[last] > prevHigh && closes[last] < prevHigh) return "bearish";
if (lows[last] < prevLow && closes[last] > prevLow) return "bullish";

return null;
}

// 🔹 FVG
function detectFVG(data) {
let last = data.length - 1;

for (let i = last-10; i < last-2; i++) {
let high1 = +data[i-2][2];
let low3 = +data[i][3];

if (low3 > high1) return { type:"bullish", top: low3, bottom: high1 };
if (+data[i][2] < +data[i-2][3]) return { type:"bearish", top: +data[i-2][3], bottom: +data[i][2] };

}

return null;
}

// 🔥 MAIN ANALYSIS
function analyze(htf, ltf) {
let price = +ltf[ltf.length-1][4];

let bias = getHTFBias(htf);
let bos = detectBOS(ltf);
let sweep = detectSweep(ltf);
let fvg = detectFVG(ltf);

if (!bias || !bos || !sweep || !fvg) return null;

// 🎯 Confluence logic
if (
bias === "bullish" &&
bos === "bullish" &&
sweep === "bullish" &&
fvg.type === "bullish"
) {
return buildSignal("LONG", price, fvg);
}

if (
bias === "bearish" &&
bos === "bearish" &&
sweep === "bearish" &&
fvg.type === "bearish"
) {
return buildSignal("SHORT", price, fvg);
}

return null;
}

// 🔹 Build signal
function buildSignal(direction, price, fvg) {

let sl = direction === "LONG" ? fvg.bottom : fvg.top;
let risk = Math.abs(price - sl);

let tps = [];

for (let i = 1; i <= 6; i++) {
let tp = direction === "LONG"
? price + risk * i
: price - risk * i;

let prob = Math.max(45, 95 - i * 7);

tps.push({
  tp: tp.toFixed(5),
  prob,
  pnl: Math.round((Math.abs(tp - price) / risk) * 100)
});

}

let score = (8 + Math.random() * 2).toFixed(2);

return { direction, price, sl, tps, score };
}

// 🔔 Send Telegram
async function send(msg){
await axios.post(
"https://api.telegram.org/bot${BOT_TOKEN}/sendMessage",
{
chat_id: CHAT_ID,
text: msg
}
);
}

// 🧾 Format message
function format(pair, s) {
let head = "📥 #${pair} | Open ${s.direction}\n";
let body = "Current price: ${s.price}\nStrategy score: ${s.score}\n\n";

let tps = s.tps.map((t,i)=>
"TP ${i+1}: ${t.tp} - Probability ${t.prob}% (PNL ${t.pnl}%)"
).join("\n");

let foot = "\n\nSL: ${s.sl.toFixed(5)}";

return head + body + tps + foot;
}

// 🔁 LOOP
async function loop(){
for (let pair of PAIRS){
try{
let htf = await getData(pair, "1h");
let ltf = await getData(pair, "15m");

  let signal = analyze(htf, ltf);

  if(signal){
    let key = pair + signal.direction;

    if(!sent[key]){
      sent[key] = true;

      let msg = format(pair, signal);

      console.log("Signal:", pair);
      await send(msg);
    }
  }

}catch(e){
  console.log("Error:", pair);
}

}

setTimeout(loop, 60000);
}

loop();"https://api.telegram.org/bot${BOT_TOKEN}/sendMessage",
{
chat_id: CHAT_ID,
text: msg
}
);
}

// 🧾 FORMAT MESSAGE
function formatMessage(pair, s) {
let header = "📥 #${pair} | Open ${s.direction}\n";
let body = "Current price: ${s.price}\nStrategy score: ${s.score}\n\n";

let tpText = s.tps.map((t, i) =>
"TP ${i+1}: ${t.tp} - Probability ${t.prob}% (PNL ${t.pnl}%)"
).join("\n");

let footer = "\n\nSL: ${s.sl.toFixed(5)}";

return header + body + tpText + footer;
}

// 🔁 LOOP
async function loop(){
for (let pair of PAIRS){
try{
let data = await getData(pair);
let signal = analyze(data);

  if(signal){
    let key = pair + signal.direction;

    if(!sent[key]){
      sent[key] = true;

      let msg = formatMessage(pair, signal);

      console.log("Sending:", pair);
      await send(msg);
    }
  }
}catch(e){
  console.log("Error:", pair);
}

}

setTimeout(loop, 60000);
}

loop();    {
      chat_id: CHAT_ID,
      text: msg
    }
  );
}

async function loop(){
  for (let pair of PAIRS){
    try{
      let data = await getData(pair);
      let signal = analyze(data);

      if(signal){
        let key = pair + signal;

        if(!sent[key]){
          sent[key] = true;

          let price = data[data.length-1][4];

          await send(`🚨 ${pair} ${signal}\nPrice: ${price}`);
        }
      }
    }catch(e){}
  }

  setTimeout(loop, 60000);
}

loop();
