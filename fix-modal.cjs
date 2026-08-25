const fs = require('fs');

let code = fs.readFileSync('src/components/TaskModal.tsx', 'utf8');

// We want to add an initialization ref to TaskModal
const refImportStr = "import React, { useState, useEffect";
const refImportRepl = "import React, { useState, useEffect, useRef";
if (!code.includes("useRef")) {
  code = code.replace(refImportStr, refImportRepl);
}

// Find useEffect(() => {\n    if (existingTask) {
const useEffectMatch = `  useEffect(() => {
    if (existingTask) {`;

const refDecl = `  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (existingTask) {`;

code = code.replace(useEffectMatch, refDecl);

fs.writeFileSync('src/components/TaskModal.tsx', code);
