const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, '..', 'CCAT_Mock_Test.docx.txt');
const text = fs.readFileSync(txtPath, 'utf8');
const lines = text.split('\n');

const questions = [];
let currentQuestion = null;

let currentSection = "A";

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  if (line.includes("SECTION A")) {
    currentSection = "A";
    continue;
  }
  if (line.includes("SECTION B")) {
    currentSection = "B";
    continue;
  }

  // Match Q1. or Q10. etc.
  const qMatch = line.match(/^Q(\d+)\.\s*(.*)$/);
  if (qMatch) {
    const id = parseInt(qMatch[1]);
    let qText = qMatch[2].trim();

    // Determine topic based on ID
    let topic = "";
    if (id >= 1 && id <= 13) topic = "English";
    else if (id >= 14 && id <= 29) topic = "Quantitative Aptitude";
    else if (id >= 30 && id <= 40) topic = "Logical Reasoning";
    else if (id >= 41 && id <= 50) topic = "Computer Fundamentals";
    else if (id >= 51 && id <= 64) topic = "C Programming";
    else if (id >= 65 && id <= 72) topic = "Data Structures";
    else if (id >= 73 && id <= 75) topic = "Operating Systems";
    else if (id >= 76 && id <= 80) topic = "Networking";
    else if (id >= 81 && id <= 90) topic = "OOP using C++";
    else if (id >= 91 && id <= 100) topic = "Basics of Big Data & AI";

    currentQuestion = {
      id,
      section: currentSection,
      topic,
      q: qText,
      o: []
    };
    questions.push(currentQuestion);
    continue;
  }

  if (currentQuestion) {
    const oMatch = line.match(/^([A-D])\)\s*(.*)$/);
    if (oMatch) {
      currentQuestion.o.push(oMatch[2].trim());
      continue;
    }

    const aMatch = line.match(/^✔\s*Answer:\s*([A-D])/i);
    if (aMatch) {
      const ansLetter = aMatch[1].toUpperCase();
      currentQuestion.a = ansLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      continue;
    }
  }
}

// Special formatting for code blocks in C programming and OOP using C++ questions
questions.forEach(q => {
  if (q.topic === "C Programming") {
    // Check if question contains inline code blocks that should be formatted as code field
    if (q.q.includes("int x = 5;") || q.q.includes("int i;")) {
      const parts = q.q.split("?");
      if (parts.length > 1) {
        q.q = parts[0].trim() + "?";
        q.code = parts.slice(1).join("?").trim().replace(/;/g, ";\n").replace(/{/g, "{\n").replace(/}/g, "}\n");
      }
    }
  } else if (q.topic === "OOP using C++" && q.q.includes("class A")) {
    const parts = q.q.split("?");
    if (parts.length > 1) {
      q.q = parts[0].trim() + "?";
      q.code = parts.slice(1).join("?").trim()
        .replace(/class A{/g, "class A {\n")
        .replace(/public:/g, "public:\n    ")
        .replace(/A\(\)\{/g, "A() {\n        ")
        .replace(/cout<<\"Constructor\";/g, 'cout << "Constructor";\n    ')
        .replace(/\};/g, "};\n")
        .replace(/int main\(\)\{/g, "int main() {\n    ")
        .replace(/A obj;/g, "A obj;\n    ")
        .replace(/return 0;/g, "return 0;\n")
        .replace(/\}/g, "\n}");
    }
  }
});

// Output the array as stringified JS
const output = JSON.stringify(questions, null, 2);
fs.writeFileSync(path.join(__dirname, 'questions_output.json'), output, 'utf8');
console.log(`Successfully parsed ${questions.length} questions.`);
