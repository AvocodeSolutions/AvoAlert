-- Logo 404 hatalarını düzelten SQL script - Sadece güvenilir CORS kaynakları
-- Tarih: 2025-01-18

UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/3641/large/HBAR.png' WHERE symbol = 'HBARUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png' WHERE symbol = 'APTUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/10365/large/near.jpg' WHERE symbol = 'NEARUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg' WHERE symbol = 'ARBUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png' WHERE symbol = 'OPUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png' WHERE symbol = 'INJUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg' WHERE symbol = 'SUIUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png' WHERE symbol = 'FTMUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/2130/large/enjin-coin-logo.png' WHERE symbol = 'ENJUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/6595/large/RUNE.png' WHERE symbol = 'RUNEUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/9761/large/kava.png' WHERE symbol = 'KAVAUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/5567/large/celo_logo.png' WHERE symbol = 'CELOUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/12335/large/egld-token-logo.png' WHERE symbol = 'EGLDUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png' WHERE symbol = 'FLOWUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/4379/large/Celr.png' WHERE symbol = 'CELRUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/8081/large/coti.png' WHERE symbol = 'COTIUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/9368/large/swipe.png' WHERE symbol = 'SXPUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/3687/large/ocean-protocol-logo.jpg' WHERE symbol = 'OCEANUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/13162/large/rose.png' WHERE symbol = 'ROSEUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/17500/large/hjnlSANs.jpg' WHERE symbol = 'DYDXUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/17233/large/immutableX-symbol-BLK-RGB.png' WHERE symbol = 'IMXUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/18323/large/arbit.png' WHERE symbol = 'GMXUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg' WHERE symbol = 'FETUSDT';
UPDATE coins SET logo_url = 'https://assets.coingecko.com/coins/images/14051/large/Mask_Network.jpg' WHERE symbol = 'MASKUSDT';

-- Kontrol et
SELECT symbol, logo_url FROM coins WHERE symbol IN (
  'HBARUSDT', 'APTUSDT', 'NEARUSDT', 'ARBUSDT', 'OPUSDT', 
  'INJUSDT', 'SUIUSDT', 'FTMUSDT', 'ENJUSDT', 'RUNEUSDT',
  'KAVAUSDT', 'CELOUSDT', 'EGLDUSDT', 'FLOWUSDT', 'CELRUSDT',
  'COTIUSDT', 'SXPUSDT', 'OCEANUSDT', 'ROSEUSDT', 'DYDXUSDT',
  'IMXUSDT', 'GMXUSDT', 'FETUSDT', 'MASKUSDT'
);