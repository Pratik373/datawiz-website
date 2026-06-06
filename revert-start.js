const fs = require('fs');
const path = require('path');

const files = [
  'React/public/CCATMOCK.html',
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
    if (content.includes('updateTimers();\r\nstartExam();\r\n</script>')) {
      content = content.replace('updateTimers();\r\nstartExam();\r\n</script>', 'updateTimers();\r\n</script>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Reverted ${file} (CRLF)`);
    } else if (content.includes('updateTimers();\nstartExam();\n</script>')) {
      content = content.replace('updateTimers();\nstartExam();\n</script>', 'updateTimers();\n</script>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Reverted ${file} (LF)`);
    } else {
      console.log(`No startExam call found in: ${file}`);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
}
