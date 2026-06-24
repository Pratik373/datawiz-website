const fs = require('fs');
const path = require('path');

const parsedQuestions = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'questions_output.json'), 'utf8')
);

// Format questions as clean inline JS objects
const formattedQuestions = parsedQuestions.map(q => {
  const codeStr = q.code ? `,code:${JSON.stringify(q.code)}` : '';
  return `  {id:${q.id},section:${JSON.stringify(q.section)},topic:${JSON.stringify(q.topic)},q:${JSON.stringify(q.q)},o:${JSON.stringify(q.o)},a:${q.a}${codeStr}}`;
}).join(',\n');

const questionsJs = `const questions = [\n${formattedQuestions}\n];`;

const filesToUpdate = [
  path.join(__dirname, '..', 'CCATMOCK.html'),
  path.join(__dirname, '..', 'React', 'public', 'CCATMOCK.html')
];

filesToUpdate.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find start and end of the questions array
  const startKeyword = 'const questions = [';
  const startIdx = content.indexOf(startKeyword);
  if (startIdx === -1) {
    console.log(`Could not find start index of questions array in ${filePath}`);
    return;
  }
  
  // Find the closing ]; of the questions array
  // In both files, the questions array ends with ]; followed by let currentSection = "A"; or similar.
  // We can search for the first "];" after the start index, but to be safe, let's search for "];\n\nlet currentSection" or "];\nlet currentSection"
  let endIdx = -1;
  const endings = [
    '];\n\nlet currentSection',
    '];\nlet currentSection',
    '];\r\n\r\nlet currentSection',
    '];\r\nlet currentSection'
  ];

  for (const ending of endings) {
    const idx = content.indexOf(ending, startIdx);
    if (idx !== -1) {
      endIdx = idx + 2; // Keep the ];
      break;
    }
  }

  if (endIdx === -1) {
    // Fallback: search for first ]; and verify it has let currentSection following it soon
    const idx = content.indexOf('];', startIdx);
    if (idx !== -1) {
      endIdx = idx + 2;
    } else {
      console.log(`Could not find ending of questions array in ${filePath}`);
      return;
    }
  }

  const newContent = content.substring(0, startIdx) + questionsJs + content.substring(endIdx);
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Successfully replaced questions array in ${path.basename(filePath)}`);
});
