// ===============================
// 🔥 CONFIG
// ===============================
const MASSIVE_KEY = "39fnoGlGuFmGKwIgGfIEUSDdxKeevlEB";
const priceCache = {};
export function getCurrentPrice(symbol){
  return priceCache[symbol] || null;
}
let chartGlobal = null;
let socket = null;
let interval = null;       
let isFetching = false;

let currentCandle = null;
let currentTime = null;
let history = [];
let lastPrice = null;
let targetPrice = null;
let enginePrice = null;
let engineTimer = null;

let currentSymbolGlobal = null;
let candleSeriesGlobal = null;

// ===============================
// 🔥 INIT CHART (v5 API)
// ===============================
export function initChart(){

  const container = document.getElementById("tradingview_chart");
  if(!container){
    console.error("❌ ไม่พบ div tradingview_chart");
    return {};
  }

  const chart = LightweightCharts.createChart(container,{

    width: container.clientWidth,
    height: container.clientHeight || 400,

    layout:{
      background:{color:"transparent"},
      textColor:"#DDD"
    },

    grid:{
      vertLines:{color:"rgba(255,255,255,0.05)"},
      horzLines:{color:"rgba(255,255,255,0.05)"}
    },

    rightPriceScale:{
      borderVisible:false,
      scaleMargins:{        // 🔥 เว้นบนล่างให้หายอึดอัด
        top: 0.2,
        bottom: 0.2
      }
    },

    timeScale:{
      timeVisible:true,
      secondsVisible:true,

      rightOffset: 12,      // 🔥 เว้นขวานิดนึง (เหมือน IQ)
      barSpacing: 12,       // 🔥 ขนาดแท่ง (สำคัญมาก)
      minBarSpacing: 8,

      fixRightEdge:false,
      lockVisibleTimeRangeOnResize:true
    },

    crosshair:{
      mode: 1   // 🔥 crosshair แบบ tradingview
    }
  });

  chartGlobal = chart;

const candleSeries = chart.addSeries(
  LightweightCharts.CandlestickSeries,
  {
    upColor:"#4caf50",
    downColor:"#f44336",
    borderUpColor:"#4caf50",
    borderDownColor:"#f44336",
    wickUpColor:"#4caf50",
    wickDownColor:"#f44336"
  }
);

  // 🔥 resize ให้เต็มตลอด
  window.addEventListener("resize",()=>{
    chart.applyOptions({
      width: container.clientWidth,
      height: container.clientHeight
    });
  });


  new ResizeObserver(entries => {
  for (let entry of entries) {
    const { width, height } = entry.contentRect;
    chart.applyOptions({
      width,
      height
    });
  }
}).observe(container);



  return { chart, candleSeries };
}

// ===============================
// 🔥 LOAD CHART
// ===============================
export function loadChart(symbol, candleSeries){

  console.log("LOAD:", symbol);

  currentSymbolGlobal = symbol;
  candleSeriesGlobal = candleSeries;

  // clear เก่า
  if(socket){ socket.close(); socket = null; }
  if(interval){ clearInterval(interval); interval = null; }
  if(engineTimer){ clearInterval(engineTimer); engineTimer = null; }
enginePrice = null;
targetPrice = null;
isFetching = false;

  currentCandle = null;
  currentTime = null;
  lastPrice = null;

  // load history
  history = JSON.parse(localStorage.getItem("chart_"+symbol)) || [];
  candleSeries.setData(history);

  const isBinance = symbol.startsWith("BINANCE:");

  // ====== FEED ======

  if(isBinance){

    // 🔥 Crypto: realtime (ใช้ Binance เหมือนเดิม)
    const pair = symbol.split(":")[1].toLowerCase();

    socket = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@trade`);

    socket.onmessage = (e)=>{
      const data = JSON.parse(e.data);
      const price = parseFloat(data.p);

      if(price){
        console.log("💰 CRYPTO:", price);
        onRealPrice(price);
      }
    };

  } else {

    // 🔥 STOCK / GOLD → ใช้ REST เท่านั้น (Massive free)

    const pureSymbol = symbol.split(":")[1];
    // 🔥 ยิงครั้งแรกทันที
(async () => {
  try{
    const res = await fetch(
      `https://api.massive.com/v2/aggs/ticker/${pureSymbol}/prev?apiKey=${MASSIVE_KEY}`
    );
    const data = await res.json();
    const price = data?.results?.[0]?.c;
    if(price) onRealPrice(price);
  }catch{}
})();


    interval = setInterval(async () => {

       

  if(isFetching) return; // 🔥 กันยิงซ้อน
  isFetching = true;

  try{

    const res = await fetch(
      `https://api.massive.com/v2/aggs/ticker/${pureSymbol}/prev?apiKey=${MASSIVE_KEY}`
    );

    if(!res.ok){
      console.log("❌ API ERROR:", res.status);
      return;
    }

    const data = await res.json();

    const price = data?.results?.[0]?.c;

    if(price){
      console.log("💰 REST PRICE:", price);
      onRealPrice(price);
    }

  }catch(err){
    console.log("REST ERROR:", err);
  }finally{
    isFetching = false; // 🔥 ปลดล็อก
  }

}, 15000);

  }

startEngine();
}

function onRealPrice(price){

  if(currentSymbolGlobal){
    priceCache[currentSymbolGlobal] = price;
  }

  targetPrice = price;

  if(enginePrice === null){
  enginePrice = price;
  targetPrice = price;
}

}

function startEngine(){

  if(engineTimer) clearInterval(engineTimer);

  engineTimer = setInterval(()=>{

    if(targetPrice === null || enginePrice === null) return;

    // 🎯 เดินเข้า target
    const diff = targetPrice - enginePrice;
    enginePrice += diff * 0.05;

    // 🔥 noise เล็ก ๆ (เหมือนตลาดจริง)
    enginePrice += (Math.random() - 0.5) * 0.05;

    updateCandle(enginePrice);

  }, 120); // 🔥 120ms = ลื่นมาก

}


// ===============================
// 🔥 CANDLE ENGINE
// ===============================
function updateCandle(price){

  const now = Math.floor(Date.now()/1000);
  const candleTime = Math.floor(now / 30) * 30;

  if(!currentCandle || candleTime !== currentTime){

    if(currentCandle){
      history.push(currentCandle);
      if(history.length > 300) history.shift();

      localStorage.setItem(
        "chart_"+currentSymbolGlobal,
        JSON.stringify(history)
      );
    }

    currentTime = candleTime;

    currentCandle = {
      time: candleTime,
      open: price,
      high: price,
      low: price,
      close: price
    };

  }else{
    currentCandle.high = Math.max(currentCandle.high, price);
    currentCandle.low = Math.min(currentCandle.low, price);
    currentCandle.close = price;
  }

  candleSeriesGlobal.update(currentCandle);
  updateUI(price);

  // =======================
// 🎯 AUTO SCROLL (IQ STYLE)
// =======================
if(chartGlobal){

  const timeScale = chartGlobal.timeScale();

  setTimeout(()=>{
  timeScale.fitContent();   // 🔥 reset view
  timeScale.scrollToPosition(10, false); // 🔥 ดันมาอยู่กลาง
}, 0);
}

// =======================
// 📊 AUTO SCALE PRICE
// =======================
if(chartGlobal){

  chartGlobal.priceScale("right").applyOptions({
    autoScale: true,
    scaleMargins: {
      top: 0.2,
      bottom: 0.2
    }
  });

}

}


export function startBackgroundFeeds(symbols){

  symbols.forEach(symbol => {

    if(symbol.startsWith("BINANCE:")){

      const pair = symbol.split(":")[1].toLowerCase();

      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@trade`);

      ws.onmessage = (e)=>{
        const data = JSON.parse(e.data);
        priceCache[symbol] = parseFloat(data.p);
      };

    }

  });

}

// ===============================
// 🔥 UI
// ===============================
function updateUI(price){

  const priceEl = document.getElementById("livePrice");
  const percentEl = document.getElementById("livePercent");

  if(priceEl){
  priceEl.innerText = price.toFixed(2);

  if(lastPrice !== null){

    // 🔥 ส่ง event ก่อนอัปเดต lastPrice
    window.dispatchEvent(new CustomEvent("priceMove", {
      detail: {
        price: price,
        lastPrice: lastPrice
      }
    }));

    if(price > lastPrice){
      priceEl.classList.add("text-green-400");
      priceEl.classList.remove("text-red-500");
    }else if(price < lastPrice){
      priceEl.classList.add("text-red-500");
      priceEl.classList.remove("text-green-400");
    }
  }

  // 🔥 ค่อยอัปเดตทีหลัง
  lastPrice = price;
}

  if(percentEl && currentCandle){
    let percent = ((price - currentCandle.open) / currentCandle.open) * 100;
    percent = percent.toFixed(2);

    percentEl.innerText = percent + "%";

    percentEl.className =
      percent >= 0
      ? "text-[#acf4a4] bg-[#005315]/40 px-2 py-0.5 rounded text-xs font-bold"
      : "text-[#ff8080] bg-red-900/30 px-2 py-0.5 rounded text-xs font-bold";
  }
}