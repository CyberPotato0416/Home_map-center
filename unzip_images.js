const fs = require('fs');
const { execSync } = require('child_process');

if (fs.existsSync('rentals_images.zip')) {
  console.log('Found zip file. Unzipping...');
  execSync('npx -y extract-zip rentals_images.zip ./public/rentals_images/');
  console.log('Unzipped successfully.');
} else {
  console.log('Please drag and drop rentals_images.zip into the root directory first!');
}
