# 烽火王座：線上對戰伺服器

這個資料夾是線上連機用的伺服器。整場戰局在伺服器上計算，玩家的瀏覽器只負責顯示畫面和送出指令，所以每位玩家看到的戰況都一樣。

- 最多 6 人，兩隊各 3 個位置。同隊就是合作，分隊就是對戰，空位由 AI 補上。
- 不需要安裝任何套件，只要 Node.js 18 以上的版本。
- 遊戲本體（上傳到 itch.io 的 `index.html`）和這裡的 `game_built.js` 必須是同一版。版本不同時，遊戲會直接提示，不會開局。

## 檔案

| 檔案 | 用途 |
|---|---|
| `server.js` | 連線、房間、大廳 |
| `sim.js` | 在伺服器上執行戰局 |
| `game_built.js` | 遊戲邏輯（每次更新遊戲都要一起換掉） |
| `package.json` | 告訴主機用 `node server.js` 啟動 |

## 方法一：用自己的電腦開伺服器（最快，適合先和朋友試玩）

1. 到 https://nodejs.org 下載並安裝 LTS 版本。
2. 解壓縮 `fhwz-server.zip`，在資料夾裡開啟命令列（Windows：在資料夾網址列輸入 `cmd` 再按 Enter）。
3. 輸入 `node server.js`。看到 `listening on :8080` 就代表伺服器已經啟動。
4. itch.io 的網頁是 https，所以伺服器也需要加密的網址。最簡單的方式是 Cloudflare 的免費通道：
   - 下載 `cloudflared`：https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
   - 另開一個命令列，輸入 `cloudflared tunnel --url http://localhost:8080`
   - 它會印出一個 `https://xxxx.trycloudflare.com` 網址。
5. 在遊戲的「線上對戰」畫面，伺服器網址填 `wss://xxxx.trycloudflare.com`（把 https 換成 wss）。

這個做法要一直開著電腦和兩個命令列視窗。另外，通道網址每次重開都會變，要重新告訴朋友。

## 方法二：放到 Render（長期使用）

1. 註冊 GitHub，建立一個新的 repository，把這個資料夾裡的 4 個檔案上傳上去。
2. 註冊 https://render.com ，選 **New → Web Service**，連結剛才的 repository。
3. 設定：
   - Runtime：**Node**
   - Build Command：留空，或填 `npm install`
   - Start Command：`node server.js`
   - Instance Type：**Free**
4. 部署完成後會得到 `https://你的名字.onrender.com`。遊戲裡的伺服器網址填 `wss://你的名字.onrender.com`。
5. 用瀏覽器打開 `https://你的名字.onrender.com`，看到「烽火王座伺服器 … 運作中」就代表成功。

免費方案的伺服器超過 15 分鐘沒有任何連線就會休眠，下一次連線要等大約 1 分鐘才會醒來。第一次按「建立房間」連不上時，等一下再按一次就好。

**更新遊戲時**：把新的 `game_built.js` 上傳到同一個 GitHub repository，取代舊檔，Render 會自動重新部署。

## 怎麼玩

1. 開啟遊戲，點「線上對戰」，填伺服器網址和你的名字（網址只要填一次）。
2. 房主按「建立房間」，把畫面上的 5 碼房號告訴朋友，朋友按「加入房間」。
3. 點兩隊的空位換到想要的位置，再選指揮官（同隊不能重複）。
4. 房主按「開始對戰」。整軍期 30 秒，全員選好兵種就會提前開戰。

紅方玩家看到的地圖會旋轉 180 度，自己的主堡一樣在左下角，畫面上也會把自己這一方顯示成藍色，所以兩邊的操作習慣完全相同。

## 線上模式和單人模式的差別

- 遊戲不會暫停：開選單、軍械庫或傭兵選單的時候，戰局照常進行。「戰術部署」只會拉遠鏡頭，不會放慢時間。
- AI 隊友會回應「支援」請求，也會主動幫附近的真人隊友。真人隊友不會聽從支援請求，分路也由他自己決定。
- 斷線、重新整理頁面或退出時，你的指揮官會交給 AI 代管。回到「線上對戰」畫面按「重回進行中的對戰」，就能接回原本的位置。
- 所有真人都離線超過 2 分鐘，伺服器就會結束那一場。

## 流量與效能

- 每位玩家每秒大約收到 20 KB 的資料（已經壓縮）。6 人打 15 分鐘，伺服器總共送出大約 100 MB。
- 一場對戰在一般電腦上大約佔用一個 CPU 核心的 5%。
- Render 免費方案只有 0.1 顆 CPU，大約只夠同時跑一場。想同時開好幾場，或覺得畫面延遲，可以改用自己的電腦（方法一），或把 Render 的 Instance Type 換成付費等級。
