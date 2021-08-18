const longPropertyName = 'a'
let foo = {[longPropertyName]:1};
foo[longPropertyName]++;
const d = true;
if(d)console.log("X");
console.log(foo[longPropertyName]);