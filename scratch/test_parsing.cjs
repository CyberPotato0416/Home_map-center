const fs = require('fs');
const Papa = require('papaparse');

const csvData = fs.readFileSync('public/rentals_import.csv', 'utf8');

Papa.parse(csvData, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    const rows = results.data;
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    
    let id = '';
    let lat = 0;
    let lng = 0;
    let price = 0;
    let title = '';
    let link = '';
    let images = [];
    
    keys.forEach(k => {
      const lowerK = k.toLowerCase();
      const val = String(firstRow[k] || '');
      
      if (['id'].includes(lowerK) && val) {
        id = val;
      } else if (['lat', 'latitude', '緯度'].some(kw => lowerK.includes(kw))) {
        lat = parseFloat(val);
      } else if (['lng', 'longitude', 'long', '經度'].some(kw => lowerK.includes(kw))) {
        lng = parseFloat(val);
      } else if (['price', 'rent', '租金', '價格'].some(kw => lowerK.includes(kw))) {
        price = parseInt(val.replace(/[^0-9]/g, ''), 10);
      } else if (['title', 'name', '名稱', '標題', '租屋'].some(kw => lowerK.includes(kw))) {
        title = val;
      } else if (['link', 'url', '網址', '連結'].some(kw => lowerK.includes(kw)) && !['image', 'photo', 'img'].some(kw => lowerK.includes(kw))) {
        link = val;
      } else if (['image', 'photo', '照片', '圖片'].some(kw => lowerK.includes(kw))) {
        if (val) {
          images = val.split(/[;,]/).map(s => s.trim()).filter(Boolean);
        }
      }
    });
    
    console.log("Parsed Link:", link);
    console.log("Parsed Images First Item:", images[0]);
  }
});
