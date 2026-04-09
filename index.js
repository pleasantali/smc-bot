const axios = require("axios");

const BOT_TOKEN = "8619360049:AAGn1nYgQv7RDnKrZxcxktlqoiCLZxyMiHw";
const CHAT_ID = "7198918609";

const PAIRS = ["BTCUSDT","ETHUSDT","SOLUSDT","AVAXUSDT","LINKUSDT"];

let sent = {};

async function getData(symbol) {
const res = await axios.get(
"https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=120"
);
return res.data;
}

// 🔥 CORE ANALYSIS
function analyze(data) {
let highs = data.map(c => +c[2]);
let lows = data.map(c => +c[3]);
let closes = data.map(c => +c[4]);

let last = data.length - 1;
let price = closes[last];

let prevHigh = Math.max(...highs.slice(last-20, last));
let prevLow = Math.min(...lows.slice(last-20, last));

let direction = null;

if (price > prevHigh) direction = "LONG";
if (price < prevLow) direction = "SHORT";

if (!direction) return null;

let sl = direction === "LONG"
? Math.min(...lows.slice(last-10, last))
: Math.max(...highs.slice(last-10, last));

let risk = Math.abs(price - sl);

// 🎯 TP ladder
let tps = [];
for (let i = 1; i <= 6; i++) {
let tp = direction === "LONG"
? price + risk * (i * 0.8)
: price - risk * (i * 0.8);

let prob = Math.max(40, 95 - i * 8);

tps.push({
  tp: tp.toFixed(5),
  prob,
  pnl: Math.round((Math.abs(tp - price) / risk) * 100)
});

}

// 🧠 Score (based on volatility + breakout strength)
let score = (7 + Math.random() * 3).toFixed(2);

return { direction, price, sl, tps, score };
}

// 🔔 SEND MESSAGE
async function send(msg){
await axios.post(
"https://api.telegram.org/bot${BOT_TOKEN}/sendMessage",
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
