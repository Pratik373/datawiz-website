const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const templatePath = path.join(root, 'React', 'public', 'CCATMOCK.html');

const sets = [
  {
    md: 'CCAT_Mock_Test_Set1.md',
    out: path.join('React', 'public', 'CCAT_Mock_Test_Set1.html'),
    title: 'CDAC C-CAT Mock Test - Set 1',
  },
  {
    md: 'CCAT_SET2_MOCK_Test.md',
    out: path.join('React', 'public', 'CCAT_Mock_Test_Set2.html'),
    title: 'CDAC C-CAT Mock Test - Set 2',
  },
  {
    md: 'CCAT_Mock_Test_Set3.md',
    out: path.join('React', 'public', 'CCAT_Mock_Test_Set3.html'),
    title: 'CDAC C-CAT Mock Test - Set 3',
  },
  {
    md: 'CCAT_SET4_MOCK_Test.md',
    out: path.join('React', 'public', 'CCAT_Mock_Test_Set4.html'),
    title: 'CDAC C-CAT Mock Test - Set 4',
  },
  {
    md: 'CCAT_SET5_MockTest.md',
    out: path.join('React', 'public', 'CCAT_Mock_Test_Set5.html'),
    title: 'CDAC C-CAT Mock Test - Set 5',
  },
];

function stripMarkdown(value) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/&amp;/g, '&')
    .trim();
}

function parseAnswer(answerLine, options) {
  const explicitLetter = answerLine.match(/Answer:\s*([A-D])/i);
  if (explicitLetter) return explicitLetter[1].toUpperCase().charCodeAt(0) - 65;

  const raw = stripMarkdown(answerLine).replace(/^Answer:\s*/i, '');
  const letter = raw.match(/\b([A-D])\b/i);
  if (letter) return letter[1].toUpperCase().charCodeAt(0) - 65;

  const normalized = raw.toLowerCase().replace(/^[a-d][).:-]?\s*/i, '').trim();
  const byText = options.findIndex((option) => option.toLowerCase().trim() === normalized);
  return byText >= 0 ? byText : 0;
}

function parseQuestions(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const questions = [];
  let current = null;
  let activeTopic = '';
  let mode = 'question';
  let inCode = false;
  let codeLines = [];

  function finish() {
    if (!current) return;
    current.q = stripMarkdown(current.questionLines.join(' ').replace(/\s+/g, ' '));
    current.code = codeLines.length ? codeLines.join('\n').trim() : undefined;
    current.o = current.options.map(stripMarkdown);
    current.a = parseAnswer(current.answer || '', current.o);
    current.explanation = stripMarkdown((current.explanationLines || []).join(' '))
      .replace(/^Explanation:\s*/i, '')
      .replace(/\s+C-CAT Mock Test[\s\S]*$/i, '')
      .replace(/\s+Section\s+\|\s+Topic[\s\S]*$/i, '');
    questions.push({
      id: current.id,
      section: current.id <= 50 ? 'A' : 'B',
      topic: current.topic || (current.id <= 13 ? 'English' : current.id <= 43 ? 'Quantitative Aptitude & Reasoning' : current.id <= 50 ? 'Computer Fundamentals' : 'Computer Science'),
      q: current.q,
      ...(current.code ? { code: current.code } : {}),
      o: current.o,
      a: current.a,
      ...(current.explanation ? { explanation: current.explanation } : {}),
    });
  }

  for (const line of lines) {
    const heading = line.match(/^###\s+(?:SECTION\s+\d+:\s*)?(.+?)(?:\s*\(Q\d+.*)?$/i);
    if (heading) {
      activeTopic = stripMarkdown(heading[1]);
      continue;
    }
    const questionMatch = line.match(/^\*\*Q(\d+)\.(?:\s*\[([^\]]+)\])?\*\*\s*(.*)$/);
    if (questionMatch) {
      finish();
      current = {
        id: Number(questionMatch[1]),
        questionLines: [questionMatch[3]],
        options: [],
        explanationLines: [],
        topic: questionMatch[2] ? stripMarkdown(questionMatch[2]) : activeTopic,
      };
      mode = 'question';
      inCode = false;
      codeLines = [];
      continue;
    }
    if (!current) continue;

    if (line.trim().startsWith('```')) {
      inCode = !inCode;
      mode = 'code';
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const optionMatch = line.match(/^- ([A-D])\.\s*(.*)$/);
    if (optionMatch) {
      current.options[optionMatch[1].toUpperCase().charCodeAt(0) - 65] = optionMatch[2];
      mode = 'options';
      continue;
    }

    if (/^\*\*Answer:/i.test(line) || /^Answer:/i.test(line)) {
      current.answer = line;
      mode = 'answer';
      continue;
    }

    if (/^(>\s*)?\*\*Explanation:\*\*/i.test(line) || /^\*\*Explanation:\*\*/i.test(line)) {
      current.explanationLines.push(line.replace(/^>\s*/, ''));
      mode = 'explanation';
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed === '---') continue;
    if (trimmed.startsWith('|')) continue;
    if (/^C-CAT Mock Test/i.test(trimmed)) continue;
    if (/^\*\*Directions/i.test(trimmed)) continue;
    if (/^##|^#/.test(trimmed)) continue;

    if (trimmed.startsWith('>') && (mode === 'answer' || mode === 'explanation')) {
      current.explanationLines.push(trimmed.replace(/^>\s*/, ''));
      mode = 'explanation';
      continue;
    }

    if (mode === 'question') current.questionLines.push(trimmed);
    if (mode === 'explanation') current.explanationLines.push(trimmed.replace(/^>\s*/, ''));
  }
  finish();

  return questions.sort((a, b) => a.id - b.id);
}

function renderQuestionsArray(questions) {
  return `const questions = ${JSON.stringify(questions, null, 2)};`;
}

function buildHtml(template, set) {
  const markdown = fs.readFileSync(path.join(root, set.md), 'utf8');
  const questions = parseQuestions(markdown);
  if (questions.length !== 100) {
    throw new Error(`${set.md}: expected 100 questions, found ${questions.length}`);
  }

  const replacement = renderQuestionsArray(questions);
  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${set.title}</title>`)
    .replace(/<h1>.*?<\/h1>/, `<h1>${set.title} - Full 100 Question Paper</h1>`)
    .replace(/<h2>Actual C-CAT Pattern - Section A \+ Section B<\/h2>/, `<h2>${set.title} - Section A + Section B</h2>`)
    .replace(/const questions = \[[\s\S]*?\];\r?\n\r?\nlet currentSection/, `${replacement}\n\nlet currentSection`);

  html = html.replace(
    'const correctText = `${String.fromCharCode(65+q.a)}) ${q.o[q.a]}`;',
    'const correctText = `${String.fromCharCode(65+q.a)}) ${q.o[q.a]}`;\n            const explanation = q.explanation ? `<div class="answer-review"><strong>Explanation:</strong> ${q.explanation}</div>` : "";'
  );
  html = html.replace(
    /(<div>Correct Answer: <span class="correct-answer">\$\{correctText\}<\/span><\/div>\r?\n\s+<\/div>)/,
    '$1\n                ${explanation}'
  );

  return html;
}

const template = fs.readFileSync(templatePath, 'utf8');
for (const set of sets) {
  const html = buildHtml(template, set);
  const outPath = path.join(root, set.out);
  fs.writeFileSync(outPath, html);
  console.log(`Wrote ${set.out}`);
}
