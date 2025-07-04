// Rastgele renk üret (pastel tonlar)
export function generateRandomColor() {
  const colors = [
    '#FFB300', '#803E75', '#FF6800', '#A6BDD7', '#C10020', '#CEA262',
    '#817066', '#007D34', '#F6768E', '#00538A', '#FF7A5C', '#53377A',
    '#FF8E00', '#B32851', '#F4C800', '#7F180D', '#93AA00', '#593315',
    '#F13A13', '#232C16'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function generateRandomString(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
