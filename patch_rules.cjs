const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const oldValidUser = `    // User Profile Validation
    function isValidUser(data) {
      return data.keys().hasAll(['uid', 'email'])
        && data.uid is string && data.uid.size() <= 128 && data.uid == request.auth.uid
        && data.email is string && data.email.size() <= 255;
    }`;

const newValidUser = `    // User Profile Validation
    function isValidUser(data) {
      return data.keys().hasOnly(['uid', 'email', 'displayName', 'birthYear', 'gender', 'occupation', 'photoURL', 'settings', 'language', 'theme', 'updatedAt'])
        && (!('uid' in data) || (data.uid is string && data.uid.size() <= 128 && data.uid == request.auth.uid))
        && (!('email' in data) || (data.email is string && data.email.size() <= 255))
        && (!('displayName' in data) || (data.displayName is string && data.displayName.size() <= 255))
        && (!('birthYear' in data) || (data.birthYear is string && data.birthYear.size() <= 10))
        && (!('gender' in data) || (data.gender is string && data.gender.size() <= 50))
        && (!('occupation' in data) || (data.occupation is string && data.occupation.size() <= 100))
        && (!('photoURL' in data) || (data.photoURL is string && data.photoURL.size() <= 2000))
        && (!('settings' in data) || data.settings is map)
        && (!('language' in data) || data.language is string)
        && (!('theme' in data) || data.theme is string)
        && (!('updatedAt' in data) || data.updatedAt is string);
    }`;

code = code.replace(oldValidUser, newValidUser);

const oldUpdateRule = `allow update: if isOwner(userId) && isValidId(userId) && isValidUser(incoming()) && incoming().uid == existing().uid;`;
const newUpdateRule = `allow update: if isOwner(userId) && isValidId(userId) && isValidUser(incoming()) && (!('uid' in existing()) || !('uid' in incoming()) || incoming().uid == existing().uid);`;

code = code.replace(oldUpdateRule, newUpdateRule);

fs.writeFileSync('firestore.rules', code);
console.log('Rules patched.');
