[English](./README.md) | [中文](./README_CN.md)

## Introduction
一個個人網站模擬了一些 VS Code 功能，並以 .json 文件內容呈現。

## Features
- 選擇不同的 JSON 檔案
- 移動檔案名，並切換位置
- 關閉文件和顯示 VS Code 空白頁面
- 開啟 .json 文件，並讀取顯示內容
- 顯示程式碼的縮圖

## Usage
Fork or download and upload to your repository. Update inside the json folder content and setting the Profile: 

```javascript
const profile = new Profile({
  files: {
    "about_me": "https://cool-void-zero.github.io/json/about_me.json", 
    "portfolio": "https://cool-void-zero.github.io/json/portfolio.json", 
    "working_experience": "https://cool-void-zero.github.io/json/working_experience.json", 
    "contact": "https://cool-void-zero.github.io/json/contact.json", 
  }, 
  active_index: 0, 
  typing_mode: false, 
  design_mode: false, 
});
```

- files: properties 為文件名, values 則是要載入的 JSON 文件 URL
- active_index: 頁面載入後，默認顯示哪個 JSON 文件內容
- typing_mode: 預覽內容時是否有打字效果
- design_mode: "document.designMode" 是否設置啟動

最後，啟用 GitHub Page 進行 hosting 上線：

在該 repository > **Setting** > **Pages** 區塊 > **Branch** 選擇 **"main"**