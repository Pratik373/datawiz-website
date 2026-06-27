const fs = require('fs');
const path = require('path');

const files = [
  'React/public/CCAT_Mock_Test_Set1.html',
  'React/public/CCAT_Mock_Test_Set2.html',
  'React/public/CCAT_Mock_Test_Set3.html',
  'React/public/CCAT_Mock_Test_Set4.html',
  'React/public/CCAT_Mock_Test_Set5.html',
  'React/public/CCAT_Mock_Test_Set6.html',
  'React/public/CCAT_Mock_Test_Set7.html',
  'React/public/CCAT_Mock_Test_Set8.html',
  'React/public/CCAT_Mock_Test_Set9.html',
  'React/public/CCAT_Mock_Test_Set10.html'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if startExam() exists at the bottom script block and strip it
    let updated = false;
    if (content.includes('updateTimers();\r\nstartExam();\r\n</script>')) {
      content = content.replace('updateTimers();\r\nstartExam();\r\n</script>', 'updateTimers();\r\n</script>');
      updated = true;
    } else if (content.includes('updateTimers();\nstartExam();\n</script>')) {
      content = content.replace('updateTimers();\nstartExam();\n</script>', 'updateTimers();\n</script>');
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Reverted startExam() in ${file}`);
    } else {
      console.log(`No startExam() found or already clean in ${file}`);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
}
