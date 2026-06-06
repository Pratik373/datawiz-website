const fs = require('fs');
const path = require('path');

const files = [
  'React/public/CCAT_Mock_Test_Set1.html',
  'React/public/CCAT_Mock_Test_Set2.html',
  'React/public/CCAT_Mock_Test_Set3.html',
  'React/public/CCAT_Mock_Test_Set4.html',
  'React/public/CCAT_Mock_Test_Set5.html'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('updateTimers();\r\n</script>') && !content.includes('startExam();\r\n</script>')) {
      content = content.replace('updateTimers();\r\n</script>', 'updateTimers();\r\nstartExam();\r\n</script>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file} (CRLF)`);
    } else if (content.includes('updateTimers();\n</script>') && !content.includes('startExam();\n</script>')) {
      content = content.replace('updateTimers();\n</script>', 'updateTimers();\nstartExam();\n</script>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file} (LF)`);
    } else {
      console.log(`Skipped/Already updated: ${file}`);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
}
