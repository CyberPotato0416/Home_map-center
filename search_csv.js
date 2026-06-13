import fs from "fs";
import Papa from "papaparse";

const csvContent = fs.readFileSync("public/rentals_import.csv", "utf8");
Papa.parse(csvContent, {
  header: true,
  complete: (results) => {
    const rows = results.data;
    console.log(`Total rows in CSV: ${rows.length}`);
    const matches = [];
    rows.forEach((row, i) => {
      const title = row.title || row["名稱"] || row["標題"] || row["物件"] || "";
      const text = JSON.stringify(row);
      if (text.includes("大小") || text.includes("鄉野") || text.includes("獨立洗") || text.includes("洗機") || text.includes("21371970")) {
        matches.push({ index: i, title: title || row.title || Object.values(row)[1], row });
      }
    });

    console.log(`Found ${matches.length} matches:`);
    matches.forEach((m) => {
      console.log(`\nIndex: ${m.index}`);
      console.log(`Title: ${m.title}`);
      console.log(`ID/original_591_id: ${m.row.id} / ${m.row.original_591_id}`);
      console.log(`Keys: ${Object.keys(m.row).join(", ")}`);
      console.log(`Values: ${Object.values(m.row).slice(0, 10).join(" | ")}`);
    });
  }
});
