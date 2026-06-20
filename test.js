const text = '**화면 꿀렁거림**과';
const res = text.replace(/(```[\s\S]*?```|`[^`]+`)|(\*\*([^*]+)\*\*(?=[가-힣]))/g, (match, code, boldPattern, boldText) => {
  if (code) return code;
  return '<strong>' + boldText + '</strong>';
});
console.log(res);
