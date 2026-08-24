const fs = require('fs');

let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

const oldBirthYear = `<select
              value={profileData.birthYear}
              onChange={(e) => setProfileData({...profileData, birthYear: e.target.value})}
              className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none appearance-none"
            >
              <option value="">--</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>`;

const newBirthYear = `<Select
              value={profileData.birthYear}
              onChange={(value) => setProfileData({...profileData, birthYear: String(value)})}
              options={[
                { value: "", label: "--" },
                ...years.map(y => ({ value: y.toString(), label: y.toString() }))
              ]}
              className="w-full"
            />`;

const oldGender = `<select
              value={profileData.gender}
              onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
              className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none appearance-none"
            >
              <option value="">--</option>
              <option value="Male">{t('profile.male') || 'Male'}</option>
              <option value="Female">{t('profile.female') || 'Female'}</option>
              <option value="Non-binary">{t('profile.nonBinary') || 'Non-binary'}</option>
              <option value="Other">{t('profile.other') || 'Other'}</option>
              <option value="Prefer not to say">{t('profile.preferNotToSay') || 'Prefer not to say'}</option>
            </select>`;

const newGender = `<Select
              value={profileData.gender}
              onChange={(value) => setProfileData({...profileData, gender: String(value)})}
              options={[
                { value: "", label: "--" },
                { value: "Male", label: t('profile.male') || 'Male' },
                { value: "Female", label: t('profile.female') || 'Female' },
                { value: "Non-binary", label: t('profile.nonBinary') || 'Non-binary' },
                { value: "Other", label: t('profile.other') || 'Other' },
                { value: "Prefer not to say", label: t('profile.preferNotToSay') || 'Prefer not to say' }
              ]}
              className="w-full"
            />`;

if (code.includes(oldBirthYear)) {
  code = code.replace(oldBirthYear, newBirthYear);
  console.log('Replaced Birth Year');
} else {
  console.log('Birth Year block not found');
}

if (code.includes(oldGender)) {
  code = code.replace(oldGender, newGender);
  console.log('Replaced Gender');
} else {
  console.log('Gender block not found');
}

fs.writeFileSync('src/components/ProfileSection.tsx', code);
