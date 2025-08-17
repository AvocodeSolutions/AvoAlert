-- Add logo_url column to coins table and populate with cryptocurrency SVG logos
-- Using cryptocurrency-icons repository as the primary source for SVG logos

-- Step 1: Add logo_url column to the coins table
ALTER TABLE "public"."coins" ADD COLUMN "logo_url" text;

-- Step 2: Update each coin with its corresponding SVG logo URL
-- Using rawcdn.githack.com for reliable CDN access to GitHub-hosted SVG files

UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/btc.svg' WHERE "symbol" = 'BTCUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' WHERE "symbol" = 'ETHUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg' WHERE "symbol" = 'BNBUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/xrp.svg' WHERE "symbol" = 'XRPUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/ada.svg' WHERE "symbol" = 'ADAUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/doge.svg' WHERE "symbol" = 'DOGEUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg' WHERE "symbol" = 'MATICUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/sol.svg' WHERE "symbol" = 'SOLUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/ltc.svg' WHERE "symbol" = 'LTCUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/avax.svg' WHERE "symbol" = 'AVAXUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/trx.svg' WHERE "symbol" = 'TRXUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/link.svg' WHERE "symbol" = 'LINKUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/atom.svg' WHERE "symbol" = 'ATOMUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/xlm.svg' WHERE "symbol" = 'XLMUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/xmr.svg' WHERE "symbol" = 'XMRUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/etc.svg' WHERE "symbol" = 'ETCUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/fil.svg' WHERE "symbol" = 'FILUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/icp.svg' WHERE "symbol" = 'ICPUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/hbar.svg' WHERE "symbol" = 'HBARUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/apt.svg' WHERE "symbol" = 'APTUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/near.svg' WHERE "symbol" = 'NEARUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/arb.svg' WHERE "symbol" = 'ARBUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/op.svg' WHERE "symbol" = 'OPUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/inj.svg' WHERE "symbol" = 'INJUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/sui.svg' WHERE "symbol" = 'SUIUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/dot.svg' WHERE "symbol" = 'DOTUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/uni.svg' WHERE "symbol" = 'UNIUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/aave.svg' WHERE "symbol" = 'AAVEUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/mkr.svg' WHERE "symbol" = 'MANA' AND "symbol" = 'MANAUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/sand.svg' WHERE "symbol" = 'SANDUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/grt.svg' WHERE "symbol" = 'GRTUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/chz.svg' WHERE "symbol" = 'CHZUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/ftm.svg' WHERE "symbol" = 'FTMUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/algo.svg' WHERE "symbol" = 'ALGOUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/ape.svg' WHERE "symbol" = 'APEUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/crv.svg' WHERE "symbol" = 'CRVUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/vet.svg' WHERE "symbol" = 'VETUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/zil.svg' WHERE "symbol" = 'ZILUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/zec.svg' WHERE "symbol" = 'ZECUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/zen.svg' WHERE "symbol" = 'ZENUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/enjin.svg' WHERE "symbol" = 'ENJUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/1inch.svg' WHERE "symbol" = '1INCHUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/dash.svg' WHERE "symbol" = 'DASHUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/yfi.svg' WHERE "symbol" = 'YFIUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/comp.svg' WHERE "symbol" = 'COMPUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/sushi.svg' WHERE "symbol" = 'SUSHIUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/neo.svg' WHERE "symbol" = 'NEOUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/iost.svg' WHERE "symbol" = 'IOSTUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/ont.svg' WHERE "symbol" = 'ONTUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/qtum.svg' WHERE "symbol" = 'QNTUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/waves.svg' WHERE "symbol" = 'WAVESUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/ksm.svg' WHERE "symbol" = 'KSMUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/omg.svg' WHERE "symbol" = 'OMGUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/skl.svg' WHERE "symbol" = 'SKLUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/band.svg' WHERE "symbol" = 'BANDUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/bal.svg' WHERE "symbol" = 'BALUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/knc.svg' WHERE "symbol" = 'KNCUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/ren.svg' WHERE "symbol" = 'RENUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/rune.svg' WHERE "symbol" = 'RUNEUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/stx.svg' WHERE "symbol" = 'STXUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/kava.svg' WHERE "symbol" = 'KAVAUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/celo.svg' WHERE "symbol" = 'CELOUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/egld.svg' WHERE "symbol" = 'EGLDUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/flow.svg' WHERE "symbol" = 'FLOWUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/ankr.svg' WHERE "symbol" = 'ANKRUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/celr.svg' WHERE "symbol" = 'CELRUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/coti.svg' WHERE "symbol" = 'COTIUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/sxp.svg' WHERE "symbol" = 'SXPUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/ocean.svg' WHERE "symbol" = 'OCEANUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/rose.svg' WHERE "symbol" = 'ROSEUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/dydx.svg' WHERE "symbol" = 'DYDXUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/imx.svg' WHERE "symbol" = 'IMXUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/gmx.svg' WHERE "symbol" = 'GMXUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/fetch.svg' WHERE "symbol" = 'FETUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/mask.svg' WHERE "symbol" = 'MASKUSDT';

-- Update coins that don't have exact matches in the cryptocurrency-icons repository
-- Using alternative CDN sources or generic crypto icon

UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png' WHERE "symbol" = 'AVAXUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/7226.png' WHERE "symbol" = 'WOOUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png' WHERE "symbol" = 'TONUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/5647.png' WHERE "symbol" = 'FLMUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png' WHERE "symbol" = 'ZKUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png' WHERE "symbol" = 'PYTHUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/22861.png' WHERE "symbol" = 'TIAUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28301.png' WHERE "symbol" = 'PIXELUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/29814.png' WHERE "symbol" = 'REZUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png' WHERE "symbol" = 'HOTUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28782.png' WHERE "symbol" = 'JTOUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' WHERE "symbol" = 'ETHUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' WHERE "symbol" = 'BTCUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' WHERE "symbol" = 'BNBUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28850.png' WHERE "symbol" = 'BLURUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/9816.png' WHERE "symbol" = 'IDUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png' WHERE "symbol" = 'NEXOUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png' WHERE "symbol" = 'ARKMUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png' WHERE "symbol" = 'AGIXUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/1831.png' WHERE "symbol" = 'BTTCUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/9542.png' WHERE "symbol" = 'JUPUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/29814.png' WHERE "symbol" = 'PORTALUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28301.png' WHERE "symbol" = 'SEIUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/6719.png' WHERE "symbol" = 'ENAUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28850.png' WHERE "symbol" = 'NOTUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png' WHERE "symbol" = 'STRKUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28301.png' WHERE "symbol" = 'ORDIUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28850.png' WHERE "symbol" = 'ALTUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28301.png' WHERE "symbol" = 'RNDRUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28850.png' WHERE "symbol" = 'RSRUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28301.png' WHERE "symbol" = 'LISTAUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28850.png' WHERE "symbol" = 'OMNIUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28301.png' WHERE "symbol" = 'TNSRUSDT';
UPDATE "public"."coins" SET "logo_url" = 'https://s2.coinmarketcap.com/static/img/coins/64x64/28850.png' WHERE "symbol" = 'SATSUSDT';

-- Fix the MANA update query (there was an error in the original)
UPDATE "public"."coins" SET "logo_url" = 'https://rawcdn.githack.com/spothq/cryptocurrency-icons/master/svg/color/mana.svg' WHERE "symbol" = 'MANAUSDT';

-- Verify the updates
SELECT symbol, logo_url FROM "public"."coins" WHERE logo_url IS NOT NULL ORDER BY symbol;