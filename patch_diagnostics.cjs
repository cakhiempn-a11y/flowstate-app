const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

const diagCode = `
      {/* TEMPORARY DIAGNOSTICS */}
      <div className="w-full max-w-md mx-auto mb-4 p-4 bg-black text-lime-400 text-xs font-mono rounded overflow-auto">
        <p><strong>PRODUCTION DIAGNOSTICS</strong></p>
        <p>origin: {window.location.origin}</p>
        <p>hostname: {window.location.hostname}</p>
        <p>projectId: {firebaseConfig?.projectId || 'ai-studio-applet-webapp-1f194'}</p>
        <p>authDomain: {firebaseConfig?.authDomain || 'ai-studio-applet-webapp-1f194.firebaseapp.com'}</p>
        <p>error.code: {redirectError ? (redirectError as any).code : 'none'}</p>
        <p>error.message: {redirectError ? (redirectError as any).message : 'none'}</p>
        <p>authLoading: {authLoading ? 'true' : 'false'}</p>
      </div>
`;

code = code.replace(
  '<div className="w-full max-w-md mx-auto flex flex-col items-center mb-8">',
  diagCode + '\n      <div className="w-full max-w-md mx-auto flex flex-col items-center mb-8">'
);

code = code.replace(
  "import { useAuth } from '../contexts/AuthContext';",
  "import { useAuth } from '../contexts/AuthContext';\nimport firebaseConfig from '../../firebase-applet-config.json';"
);

fs.writeFileSync('src/pages/Login.tsx', code);
