const fs = require('fs');
const path = require('path');

// Path configuration
const synFilePath = path.join(__dirname, '..', 'old_syn_file', 'asl.2001.syn');
const tmLanguageFilePath = path.join(__dirname, '..', 'syntaxes', 'asl.tmLanguage.json');

// Read the SYN file
const synContent = fs.readFileSync(synFilePath, 'utf8');

// Initialize result object
const tmLanguage = {
  scopeName: 'source.asl',
  patterns: []
};

// Helper function to parse keyword sections
function parseKeywordSection(content, sectionName) {
  const regex = new RegExp(`\\[${sectionName}\\]([\\s\\S]*?)(?=\\[|$)`, 'i');
  const match = content.match(regex);
  if (!match) return [];
  
  return match[1].trim().split('\n').filter(Boolean).map(line => line.trim());
}

// Parse keywords
const keywords1 = parseKeywordSection(synContent, 'Keywords 1');
const keywords2 = parseKeywordSection(synContent, 'Keywords 2');
const keywords3 = parseKeywordSection(synContent, 'Keywords 3');
const preprocessorKeywords = parseKeywordSection(synContent, 'Preprocessor keywords');

// Extract syntax information
function extractSyntaxInfo(content) {
  const result = {};
  const syntaxSection = content.match(/\[Syntax\]([\s\S]*?)(?=\[|$)/i);
  
  if (syntaxSection) {
    const lines = syntaxSection[1].trim().split('\n').filter(Boolean);
    lines.forEach(line => {
      const [key, value] = line.split('=').map(part => part.trim());
      result[key] = value;
    });
  }
  
  return result;
}

const syntaxInfo = extractSyntaxInfo(synContent);

// Build TextMate grammar patterns
const patterns = [];

// Single line comments
patterns.push({
  name: 'comment.line.asl',
  match: "'.*$"
});

// Block comments
patterns.push({
  name: 'comment.block.asl',
  begin: "define\\s+text",
  end: "end\\s+define"
});

// Strings with < > delimiters
patterns.push({
  name: 'string.quoted.angle.asl',
  begin: "<",
  end: ">"
});

// Standard strings with quotes
patterns.push({
  name: 'string.quoted.double.asl',
  match: "\"([^\"]*)\""
});

// Preprocessor keywords
if (preprocessorKeywords.length > 0) {
  patterns.push({
    name: 'meta.preprocessor.asl',
    match: `\\b(${preprocessorKeywords.join('|')})\\b`
  });
}

// Keywords 1 (define, game, room, etc.)
if (keywords1.length > 0) {
  patterns.push({
    name: 'keyword.declaration.asl',
    match: `\\b(${keywords1.join('|')})\\b`
  });
}

// Keywords 2 (attributes and properties)
if (keywords2.length > 0) {
  patterns.push({
    name: 'keyword.other.asl',
    match: `\\b(${keywords2.join('|')})\\b`
  });
}

// Keywords 3 (control flow and commands)
if (keywords3.length > 0) {
  patterns.push({
    name: 'keyword.control.asl',
    match: `\\b(${keywords3.join('|')})\\b`
  });
}

// Operators
if (syntaxInfo.OperatorChars) {
  const chars = syntaxInfo.OperatorChars.split('').map(c => {
    if ('+-*^'.includes(c)) return '\\' + c;
    return c;
  }).join('');
  
  patterns.push({
    name: 'keyword.operator.asl',
    match: `[${chars}]`
  });
}

// Numbers
patterns.push({
  name: 'constant.numeric.asl',
  match: "\\b[0-9]+\\b"
});

// Variables (any other word)
patterns.push({
  name: 'variable.other.asl',
  match: "\\b([a-zA-Z_][a-zA-Z0-9_]*)\\b"
});

// Create final TextMate grammar
tmLanguage.patterns = patterns;

// Write to file
fs.writeFileSync(
  tmLanguageFilePath, 
  JSON.stringify(tmLanguage, null, 2), 
  'utf8'
);

console.log('Conversion complete! TextMate grammar written to:', tmLanguageFilePath);