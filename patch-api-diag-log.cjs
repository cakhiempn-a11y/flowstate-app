const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

const target = `  } catch (err: any) {
    return res.status(500).json({ 
      success: false,
      stage,
      error: err.message,
      name: err.name,
      // stack: err.stack
    });
  }`;

const replacement = `  } catch (err: any) {
    console.error(\`[process-notifications] stage=\${stage} error=\${err.message}\`);
    console.error(err.stack);
    
    return res.status(500).json({ 
      success: false,
      stage,
      error: err.message,
      name: err.name
    });
  }`;

code = code.replace(target, replacement);

fs.writeFileSync('api/process-notifications.ts', code);
console.log("Patched catch block for logging");
