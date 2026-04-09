const axios = require("axios");

const BOT_TOKEN = "8619360049:AAGn1nYgQv7RDnKrZxcxktlqoiCLZxyMiHw";
const CHAT_ID = "7198918609";

const PAIRS = ["BTCUSDT","ETHUSDT","SOLUSDT"];

let sent = {};

async function getData(symbol) {
  const res = await axios.get(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=100`
  );
  return res.data;
}

function analyze(data) {
  let closes = data.map(c => +c[4]);
  let highs = data.map(c => +c[2]);
  let lows = data.map(c => +c[3]);

  let last = data.length - 1;

  let price = closes[last];
  let prevHigh = Math.max(...highs.slice(last-20,last));
  let prevLow = Math.min(...lows.slice(last-20,last));

  if (price > prevHigh) return "LONG";
  if (price < prevLow) return "SHORT";

  return null;
}

async function send(msg){
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
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
