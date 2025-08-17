-- UT Bot Template'ini güncelleyerek price bilgisini webhook'a ekle
-- Bu script'i Supabase SQL Editor'da çalıştır

UPDATE indicators 
SET pine_template = $template$//@version=5
indicator("UT Bot Alerts with Price", shorttitle="UT Bot", overlay=true)

// Input parametreleri
indicatorKey = "{{INDICATOR_KEY}}"
keyvalue = {{KEY_VALUE}}
atrperiod = {{ATR_PERIOD}}

// UT Bot hesaplamaları
xATR = ta.atr(atrperiod)
nLoss = keyvalue * xATR

src = {{SRC}}
xATRTrailingStop = 0.0
iff_1 = src > nz(xATRTrailingStop[1], 0) ? src - nLoss : src + nLoss
iff_2 = src < nz(xATRTrailingStop[1], 0) and src[1] < nz(xATRTrailingStop[1], 0) ? math.min(nz(xATRTrailingStop[1]), src + nLoss) : iff_1
xATRTrailingStop := src > nz(xATRTrailingStop[1], 0) and src[1] > nz(xATRTrailingStop[1], 0) ? math.max(nz(xATRTrailingStop[1]), src - nLoss) : iff_2

pos = 0
iff_3 = src[1] > nz(xATRTrailingStop[1], 0) and src <= nz(xATRTrailingStop[1], 0) ? -1 : nz(pos[1], 0)
pos := src[1] < nz(xATRTrailingStop[1], 0) and src >= nz(xATRTrailingStop[1], 0) ? 1 : iff_3

xcolor = pos == -1 ? color.red: pos == 1 ? color.green : color.blue 

ema = {{EMA}}
ema1 = ta.ema(src, ema)
ema2 = ta.ema(src, ema)

above = ta.crossover(ema1, xATRTrailingStop)
below = ta.crossover(xATRTrailingStop, ema1)

buy  = src > xATRTrailingStop and above 
sell = src < xATRTrailingStop and below

plotshape(buy,  title = "Buy",  text = 'Buy',  style = shape.labelup,   location = location.belowbar, color= color.new(color.green,0), textcolor = color.white, size = size.tiny)
plotshape(sell, title = "Sell", text = 'Sell', style = shape.labeldown, location = location.abovebar, color= color.new(color.red,0),   textcolor = color.white, size = size.tiny)

// Classic alertcondition (UI) and webhook alert()
alertcondition(buy,  "UT Long",  "UT Long")
alertcondition(sell, "UT Short", "UT Short")

make_msg(action) =>
    ts   = str.tostring(time)
    sym  = syminfo.ticker
    tfp  = timeframe.period
    price = str.tostring(close, "#.####")
    sec = "{{SECRET}}"
    base = "{\"indicator\":\"" + indicatorKey + "\",\"symbol\":\"" + sym + "\",\"timeframe\":\"" + tfp + "\",\"action\":\"" + action + "\",\"price\":" + price + ",\"presetId\":\"" + "{{PRESET_ID}}" + "\",\"presetVersion\":" + str.tostring({{PRESET_VERSION}}) + ",\"ts\":\"" + ts + "\""
    sec != "" ? base + ",\"secret\":\"" + sec + "\"}" : base + "}"

if (buy)
    alert(make_msg("buy"), alert.freq_once_per_bar)
if (sell)
    alert(make_msg("sell"), alert.freq_once_per_bar)$template$
WHERE key = 'ut_bot';

-- Template güncellendiğini doğrula
SELECT key, name, 
       LEFT(pine_template, 100) as template_preview,
       LENGTH(pine_template) as template_length
FROM indicators 
WHERE key = 'ut_bot';