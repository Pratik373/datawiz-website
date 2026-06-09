const fs = require('fs');
const path = require('path');

const files = [
  { name: 'CCATMOCK.html', id: 'free-ccat-mock-test' },
  { name: 'CCAT_Mock_Test_Set1.html', id: 'premium-ccat-set-1' },
  { name: 'CCAT_Mock_Test_Set2.html', id: 'premium-ccat-set-2' },
  { name: 'CCAT_Mock_Test_Set3.html', id: 'premium-ccat-set-3' },
  { name: 'CCAT_Mock_Test_Set4.html', id: 'premium-ccat-set-4' },
  { name: 'CCAT_Mock_Test_Set5.html', id: 'premium-ccat-set-5' }
];

const publicDir = path.join(__dirname, '..', 'public');

files.forEach(({ name, id }) => {
  const filePath = path.join(publicDir, name);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // We want to find:
  // examSubmitted = true;
  // and insert:
  // localStorage.setItem('ccat_test_completed', 'true');
  // localStorage.setItem('ccat_test_completed_id', 'id');
  
  const target = 'examSubmitted = true;';
  const replacement = `examSubmitted = true;\n    localStorage.setItem('ccat_test_completed', 'true');\n    localStorage.setItem('ccat_test_completed_id', '${id}');`;

  if (content.includes(target)) {
    if (content.includes(`ccat_test_completed_id`)) {
      console.log(`Skipping: ${name} (already injected)`);
    } else {
      content = content.replace(target, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully injected: ${name} with ID: ${id}`);
    }
  } else {
    console.log(`Target text not found in: ${name}`);
  }
});

// Also update the root CCATMOCK.html if it exists
const rootMock = path.join(__dirname, '..', '..', 'CCATMOCK.html');
if (fs.existsSync(rootMock)) {
  let content = fs.readFileSync(rootMock, 'utf8');
  const target = 'examSubmitted = true;';
  const replacement = `examSubmitted = true;\n    localStorage.setItem('ccat_test_completed', 'true');\n    localStorage.setItem('ccat_test_completed_id', 'free-ccat-mock-test');`;
  
  if (content.includes(target) && !content.includes(`ccat_test_completed_id`)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(rootMock, content, 'utf8');
    console.log(`Successfully injected root CCATMOCK.html`);
  }
}
