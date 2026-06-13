import fs from 'fs';

fetch('https://github.com/CyberPotato0416/Home_map-center/commit/253e4e405c4b56cb629c17077acd47c7f1b18c3e.patch')
  .then(res => res.text())
  .then(text => {
    fs.writeFileSync('patch.txt', text);
    console.log('Downloaded patch');
  })
  .catch(err => console.error(err));
