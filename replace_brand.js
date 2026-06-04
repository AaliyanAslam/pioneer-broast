const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        filelist = walkSync(path.join(dir, file), filelist);
      }
    }
    else {
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync(__dirname);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Basic string replacements
  content = content.replace(/Pioneer Broast/g, "Pioneer Broast");
  content = content.replace(/PioneerBroast/g, "PioneerBroast");
  content = content.replace(/pioneer-broast/g, "pioneer-broast");
  content = content.replace(/pioneerbroast/g, "pioneerbroast");
  content = content.replace(/pioneer-cart-storage/g, "pioneer-cart-storage");
  content = content.replace(/PioneerAdmin/g, "PioneerAdmin");
  content = content.replace(/prefix = "PION"/g, 'prefix = "PION"');
  content = content.replace(/Zinger Burger/g, "Zinger Burger");

  // SEO specific
  content = content.replace(/Premium Fast Food & Broast in Karachi/gi, "Premium Fast Food & Broast in Karachi");
  content = content.replace(/fast food Karachi/g, "fast food Karachi");
  content = content.replace(/broast Karachi/g, "broast Karachi");
  content = content.replace(/burgers Karachi/g, "burgers Karachi");
  content = content.replace(/order food online Karachi/g, "order food online Karachi");
  content = content.replace(/wireless burgers Karachi/g, "best broast Karachi");
  content = content.replace(/crispy broast online/g, "crispy broast online");
  content = content.replace(/premium fast food Karachi/g, "premium fast food Karachi");
  
  content = content.replace(/Shop the latest smartwatches, earbuds, and premium tech accessories at Pioneer Broast\. Fast nationwide delivery across Pakistan/g, "Order the best broast, burgers, and fast food at Pioneer Broast. Fast delivery across Karachi");
  content = content.replace(/Shop the latest smartwatches, earbuds, and premium tech accessories at Pioneer Broast\. Fast nationwide delivery across Pakistan/g, "Order the best broast, burgers, and fast food at Pioneer Broast. Fast delivery across Karachi");
  
  content = content.replace(/Order the best and latest (.*?) in Karachi at Pioneer Broast/g, "Order the best and latest $1 in Karachi at Pioneer Broast");
  content = content.replace(/Premium quality fast food in Karachi/g, "Premium quality fast food in Karachi");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
