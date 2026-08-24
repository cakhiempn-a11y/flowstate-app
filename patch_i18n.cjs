const fs = require('fs');
let code = fs.readFileSync('src/i18n/translations.ts', 'utf8');

code = code.replace(/"uploadFailed": "Upload Failed",/g, '"uploadFailed": "Upload Failed",\n        "saveFailed": "Save failed. Please try again.",');
code = code.replace(/"uploadFailed": "Tải lên thất bại",/g, '"uploadFailed": "Tải lên thất bại",\n        "saveFailed": "Lưu thất bại. Vui lòng thử lại.",');
code = code.replace(/"uploadFailed": "上传失败",/g, '"uploadFailed": "上传失败",\n        "saveFailed": "保存失败。请重试。",');
code = code.replace(/"uploadFailed": "업로드 실패",/g, '"uploadFailed": "업로드 실패",\n        "saveFailed": "저장 실패. 다시 시도해주세요.",');

fs.writeFileSync('src/i18n/translations.ts', code);
