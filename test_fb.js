class User {
  get providerData() { return [{ providerId: 'google.com' }]; }
  get displayName() { return 'Test'; }
}
const u = new User();
const copy = { ...u };
console.log(copy.providerData);
