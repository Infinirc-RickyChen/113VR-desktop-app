// 渲染進程腳本

// 等待DOM加載完成
document.addEventListener('DOMContentLoaded', () => {
    // 初始化視窗控制按鈕
    initWindowControls();
    
    // 設置檔案上傳按鈕
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', handleFileUpload);
    }
    
    // 學生選擇器監聽
    const studentSelector = document.getElementById('student-selector');
    if (studentSelector) {
      studentSelector.addEventListener('change', handleStudentSelect);
    }
  });
  
  // 視窗控制按鈕初始化
  function initWindowControls() {
    document.getElementById('btn-minimize').addEventListener('click', () => {
      window.electronAPI.windowControls.minimize();
    });
    
    document.getElementById('btn-maximize').addEventListener('click', () => {
      window.electronAPI.windowControls.maximize();
    });
    
    document.getElementById('btn-close').addEventListener('click', () => {
      window.electronAPI.windowControls.close();
    });
  }
  
  // 處理檔案上傳
  async function handleFileUpload() {
    try {
      // 使用Electron API上傳檔案
      const files = await window.electronAPI.uploadFiles();
      if (files && files.length > 0) {
        // 更新上傳信息
        document.getElementById('upload-info').textContent = `已上傳 ${files.length} 個檔案`;
        
        // 讀取CSV參考數據
        const csvContent = await window.electronAPI.readCSV('data/v3.csv');
        if (!csvContent) {
          throw new Error('無法讀取參考CSV數據');
        }
        
        // 處理上傳的數據
        const results = await processUploadedData(files, csvContent);
        
        // 更新側邊欄統計數據
        updateSidebarStats(results.results);
        
        // 顯示結果
        displayResults(results);
      }
    } catch (error) {
      console.error('檔案上傳錯誤:', error);
      document.getElementById('upload-info').textContent = `錯誤: ${error.message}`;
    }
  }
  
  // 更新側邊欄統計數據
  function updateSidebarStats(results) {
    // 學生人數 - 計算唯一學生數量
    const uniqueStudents = [...new Set(results.map(r => r.學生))];
    document.getElementById('student-count').textContent = uniqueStudents.length;
    
    // 平均完成度
    const avgCompletion = results.reduce((sum, row) => sum + parseFloat(row.完成度), 0) / results.length;
    document.getElementById('avg-completion').textContent = avgCompletion.toFixed(2) + '%';
    
    // 平均學習時間
    const avgTime = results.reduce((sum, row) => sum + parseFloat(row.使用時間), 0) / results.length;
    document.getElementById('avg-time').textContent = avgTime.toFixed(2) + ' 分鐘';
  }
  
  // 處理上傳的數據
  async function processUploadedData(files, csvContent) {
    // 解析CSV數據
    const csvData = parseCSV(csvContent);
    
    // 處理學生文件
    const results = [];
    const studentDetails = {};
    
    for (const file of files) {
      // 解析學生文件內容
      const txtData = parseTXT(file.content, file.fileName);
      
      // 找出最小和最大時間戳記
      const timestamps = txtData.map(row => new Date(row.timestamp).getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const totalTime = (maxTime - minTime) / (1000 * 60); // 轉換為分鐘
      
      // 合併學生數據與參考CSV
      const combinedData = combineData(txtData, csvData);
      studentDetails[file.fileName] = combinedData;
      
      // 首先找出學生實際操作的historyIds
      const studentHistoryIds = new Set(txtData.map(row => row.historyId));
      
      // 找出這些historyIds對應的場景
      const studentHistoryArray = [...studentHistoryIds];
      const relevantCsvRows = csvData.filter(row => studentHistoryArray.includes(row.historyId));
      
      // 找出學生實際操作過的場景
      const activeSceneNames = new Set();
      relevantCsvRows.forEach(row => {
        if (row.Scene_Name) {
          activeSceneNames.add(row.Scene_Name);
        }
      });
      
      // 如果找到學生活動的場景
      if (activeSceneNames.size > 0) {
        // 使用找到的第一個場景
        const sceneName = [...activeSceneNames][0];
        
        // 過濾出當前場景的CSV數據
        const csvSceneData = csvData.filter(row => row.Scene_Name === sceneName);
        
        // 獲取在此場景中CSV參考數據中的所有唯一historyId
        const historyIdsInCsvScene = new Set(csvSceneData.map(row => row.historyId));
        
        // 獲取學生在此場景中實際完成的historyId（與CSV對應的行）
        const completedRows = relevantCsvRows.filter(row => row.Scene_Name === sceneName);
        const completedHistoryIds = completedRows.map(row => row.historyId);
        
        // 計算此場景的完成率
        const completionRate = historyIdsInCsvScene.size > 0 ? 
          (completedHistoryIds.length / historyIdsInCsvScene.size) * 100 : 0;
        
        // 只添加學生活動的場景記錄
        results.push({
          學生: file.fileName,
          單元: sceneName,
          總元素: historyIdsInCsvScene.size,
          完成元素: completedHistoryIds.length,
          完成度: completionRate.toFixed(2),
          使用時間: totalTime.toFixed(2)
        });
      } else {
        // 如果未找到活動場景，則添加一個默認記錄
        results.push({
          學生: file.fileName,
          單元: "未分類",
          總元素: 0,
          完成元素: 0,
          完成度: "0.00",
          使用時間: totalTime.toFixed(2)
        });
      }
    }
    
    return { results, studentDetails };
  }
  
  // 解析CSV數據
  function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      
      return row;
    });
  }
  
  // 解析TXT數據
  function parseTXT(txtContent, fileName) {
    const lines = txtContent.trim().split('\n');
    
    return lines.map(line => {
      const [historyId, timestamp, value1, value2] = line.split(',');
      return {
        historyId: historyId.trim(),
        timestamp: timestamp.trim(),
        value1: value1?.trim() || '',
        value2: value2?.trim() || '',
        fileName
      };
    });
  }
  
  // 合併數據
  function combineData(txtData, csvData) {
    return txtData.map(txtRow => {
      const csvRow = csvData.find(row => row.historyId === txtRow.historyId) || {};
      return { ...txtRow, ...csvRow };
    });
  }
  
  // 顯示結果
  function displayResults(data) {
    const { results, studentDetails } = data;
    
    // 顯示結果容器
    document.getElementById('results-container').classList.remove('hidden');
    
    // 渲染表格
    renderResultsTable(results);
    
    // 渲染圖表
    renderCharts(results);
    
    // 設置學生選擇器
    populateStudentSelector(results, studentDetails);
    
    // 計算並顯示摘要數據
    displaySummary(results);
  }
  
  // 渲染結果表格
  function renderResultsTable(results) {
    const tableBody = document.getElementById('results-body');
    tableBody.innerHTML = '';
    
    const avgCompletionRate = results.reduce((sum, row) => sum + parseFloat(row.完成度), 0) / results.length;
    const avgTime = results.reduce((sum, row) => sum + parseFloat(row.使用時間), 0) / results.length;
    
    results.forEach(row => {
      const tr = document.createElement('tr');
      
      // 添加單元格
      Object.values(row).forEach((value, index) => {
        const td = document.createElement('td');
        td.textContent = value;
        
        // 高亮低於平均值的單元格
        if (index === 4 && parseFloat(value) < avgCompletionRate) {
          td.classList.add('below-average');
        }
        if (index === 5 && parseFloat(value) < avgTime) {
          td.classList.add('below-average');
        }
        
        tr.appendChild(td);
      });
      
      tableBody.appendChild(tr);
    });
  }
  
  // 渲染圖表
  function renderCharts(results) {
    // 獲取唯一學生列表和他們的完成度
    const students = results.map(r => r.學生);
    const completionRates = results.map(r => parseFloat(r.完成度));
    
    // 計算平均完成度
    const avgCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
    
    // 繪製學生完成度條形圖
    renderBarChart('completion-chart', students, completionRates, '學生完成度 (%)');
    
    // 繪製平均完成度圓餅圖
    renderPieChart('avg-completion-chart', avgCompletionRate);
  }
  
  // 繪製條形圖
  function renderBarChart(canvasId, labels, data, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 確保畫布有適當的尺寸
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;
    
    // 設置畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 設置標題
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 20);
    
    // 計算繪圖區域尺寸
    const margin = {top: 40, right: 20, bottom: 60, left: 40};
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;
    
    // 繪製條形圖
    const barWidth = chartWidth / labels.length;
    const maxData = Math.max(...data, 100);
    const scale = chartHeight / maxData;
    
    // 繪製數據條
    ctx.fillStyle = '#2ecc71';
    for (let i = 0; i < labels.length; i++) {
      const barHeight = data[i] * scale;
      const x = margin.left + i * barWidth;
      const y = canvas.height - margin.bottom - barHeight;
      
      ctx.fillRect(x, y, barWidth - 5, barHeight);
      
      // 添加數值
      ctx.font = '12px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(data[i].toFixed(1) + '%', x + (barWidth - 5) / 2, y - 5);
    }
    
    // 繪製坐標軸
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, canvas.height - margin.bottom);
    ctx.lineTo(canvas.width - margin.right, canvas.height - margin.bottom);
    ctx.stroke();
    
    // 添加標籤 - 改進重疊問題
    ctx.font = '10px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    ctx.save();
    
    for (let i = 0; i < labels.length; i++) {
      const x = margin.left + i * barWidth + barWidth / 2;
      const y = canvas.height - margin.bottom + 5;
      
      // 截斷長檔名顯示並旋轉標籤
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 4); // 旋轉45度
      
      // 截斷長檔名
      const shortenedLabel = labels[i].length > 12 ? 
        labels[i].substring(0, 10) + '...' : 
        labels[i];
        
      ctx.fillText(shortenedLabel, 0, 0);
      ctx.restore();
    }
  }
  
  // 繪製圓餅圖
  function renderPieChart(canvasId, completionRate) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 確保畫布有適當的尺寸
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;
    
    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 設置標題
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('平均完成度', canvas.width / 2, 20);
    
    // 繪製圓餅圖
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 10;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 40;
    
    // 繪製完成部分
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, 0, (Math.PI * 2 * completionRate) / 100);
    ctx.fillStyle = '#2ecc71';
    ctx.fill();
    
    // 繪製未完成部分
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, (Math.PI * 2 * completionRate) / 100, Math.PI * 2);
    ctx.fillStyle = '#ecf0f1';
    ctx.fill();
    
    // 添加完成度文字
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(completionRate.toFixed(1) + '%', centerX, centerY + 10);
    
    // 添加標籤
    ctx.font = '14px Arial';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('已完成', centerX - radius/2, centerY + radius + 20);
    
    ctx.fillStyle = '#999';
    ctx.fillText('未完成', centerX + radius/2, centerY + radius + 20);
  }
  
  // 設置學生選擇器
  function populateStudentSelector(results, studentDetails) {
    const studentSelector = document.getElementById('student-selector');
    if (!studentSelector) return;
    
    // 清空現有選項
    studentSelector.innerHTML = '<option value="">選擇學生</option>';
    
    // 獲取唯一學生列表
    const students = [...new Set(results.map(r => r.學生))];
    
    // 添加學生選項
    students.forEach(student => {
      const option = document.createElement('option');
      option.value = student;
      option.textContent = student;
      studentSelector.appendChild(option);
    });
    
    // 儲存學生詳細資料供後續顯示
    studentSelector.studentDetails = studentDetails;
  }
  
  // 處理學生選擇
  function handleStudentSelect(event) {
    const selectedStudent = event.target.value;
    const studentDetails = event.target.studentDetails;
    
    if (selectedStudent && studentDetails[selectedStudent]) {
      // 清空並填充學生詳細資料表格
      renderStudentDetailTable(studentDetails[selectedStudent]);
    } else {
      // 清空表格
      document.getElementById('detail-body').innerHTML = '';
    }
  }
  
  // 渲染學生詳細資料表格
  function renderStudentDetailTable(details) {
    const tableBody = document.getElementById('detail-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // 限制顯示前100條記錄
    const limitedDetails = details.slice(0, 100);
    
    // 檢查第一個記錄，獲取所有可用欄位
    if (limitedDetails.length > 0) {
      // 取得表頭元素並清空
      const tableHead = document.querySelector('#student-detail-table thead tr');
      tableHead.innerHTML = '';
      
      // 定義我們想要顯示的欄位
      const fieldsToShow = [
        'historyId', 'timestamp', 'value1', 'value2', 'Scene_Name', 
        'step', 'type', 'answer', 'text-自學', 'text-導學', 'speaker', 'correct'
      ];
      
      // 取得第一筆記錄中實際存在的欄位
      const availableFields = fieldsToShow.filter(field => 
        field in limitedDetails[0] || 
        limitedDetails.some(record => field in record)
      );
      
      // 創建表頭
      availableFields.forEach(field => {
        const th = document.createElement('th');
        th.textContent = field;
        tableHead.appendChild(th);
      });
      
      // 填充表格內容
      limitedDetails.forEach(row => {
        const tr = document.createElement('tr');
        
        // 添加每個欄位
        availableFields.forEach(field => {
          const td = document.createElement('td');
          td.textContent = row[field] !== undefined ? row[field] : '';
          tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
      });
    }
    
    // 如果記錄超過100條，顯示提示
    if (details.length > 100) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = document.querySelectorAll('#student-detail-table thead th').length;
      td.textContent = `僅顯示前100條記錄（共${details.length}條）`;
      td.style.textAlign = 'center';
      td.style.fontStyle = 'italic';
      tr.appendChild(td);
      tableBody.appendChild(tr);
    }
  }
  
  // 顯示摘要數據
  function displaySummary(results) {
    // 計算平均完成時間
    const avgTime = results.reduce((sum, row) => sum + parseFloat(row.使用時間), 0) / results.length;
    document.getElementById('avg-time-value').textContent = avgTime.toFixed(2) + ' 分鐘';
    
    // 計算平均完成度
    const avgCompletion = results.reduce((sum, row) => sum + parseFloat(row.完成度), 0) / results.length;
    document.getElementById('avg-completion-value').textContent = avgCompletion.toFixed(2) + '%';
  }