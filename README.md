# 光合之旅學習歷程數據分析平台

## 專案簡介

光合之旅學習歷程數據分析平台是一個專為教育工作者設計的桌面應用程式，用於分析學生在「光合之旅」學習過程中的數據，提供直觀的數據可視化和詳細的學習歷程記錄。


## 主要功能

- **學生資料上傳**: 支援批量上傳學生TXT格式的學習記錄
- **數據可視化**: 提供完成度條形圖和圓餅圖等直觀的數據展示
- **學習表現分析**: 計算學生單元完成度及使用時間數據
- **詳細記錄預覽**: 提供學生操作的詳細記錄查看功能
- **統計摘要**: 自動生成平均完成時間和完成度等統計數據

## 系統需求

### Windows
- Windows 10 或更高版本
- 最少 4GB RAM
- 100MB 可用磁碟空間

### macOS
- macOS 10.13 (High Sierra) 或更高版本
- 支援 Intel 和 Apple Silicon (M1/M2/M3) 處理器
- 最少 4GB RAM
- 100MB 可用磁碟空間

## 安裝指南

### Windows 安裝
1. 下載「光合之旅 Setup 1.0.0.exe」
2. 雙擊執行安裝檔案
3. 依照安裝精靈指示完成安裝

### macOS 安裝
1. 下載對應您處理器類型的DMG文件:
   - Intel Mac: 「光合之旅-1.0.0.dmg」
   - Apple Silicon Mac: 「光合之旅-1.0.0-arm64.dmg」
2. 雙擊開啟DMG文件
3. 將應用程式拖曳至「應用程式」資料夾
4. 首次啟動時，可能需要在「系統偏好設定」>「安全性與隱私」中允許應用程式運行

## 使用方法

1. **啟動應用程式**:
   - 從開始選單(Windows)或應用程式資料夾(macOS)啟動「光合之旅」

2. **上傳學生資料**:
   - 點擊「選擇檔案上傳」按鈕
   - 選擇要分析的TXT檔案(每個檔案代表一位學生)
   - 系統將自動處理資料並生成分析結果

3. **檢視分析結果**:
   - 學生單元完成度統計圖: 顯示各學生在不同單元的完成度
   - 學生完成度與使用時間: 詳細列出每位學生的完成情況
   - 平均完成時間與完成度: 提供整體學習表現摘要

4. **檢視詳細記錄**:
   - 從「選擇學生」下拉選單中選擇學生
   - 查看該學生的詳細操作記錄

## 資料格式說明

### 學生資料格式 (TXT檔案)
historyId,timestamp,value1,value2
401,2024-06-26T13:09:39,0,0
402,2024-06-26T13:09:43,0,0
...


## 開發者資訊

### 技術架構
- Electron框架
- HTML/CSS/JavaScript
- Canvas繪圖API

### 開發環境設置
1. 安裝Node.js和npm
2. 複製專案儲存庫
3. 運行 `npm install` 安裝依賴
4. 運行 `npm start` 啟動開發環境

### 打包應用
- Windows: `npm run dist:win`
- macOS: `npm run dist:mac`
- 全平台: `npm run dist`

## 版本資訊

**版本 1.0.0 (2025年3月)**
- 初始版本發布
- 支援基本的學生數據分析功能
- 支援Windows和macOS平台


## 聯絡資訊

開發者: RickyChen
