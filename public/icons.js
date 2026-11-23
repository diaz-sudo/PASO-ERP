const paths = {
  grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  shoe:'M3 15c2 0 3-4 4-6l5 5 6 2c2 0 3 1 3 3v1H3z M3 17h18 M10 12l2-2 M13 14l2-2',
  box:'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10 M7 5l9 4',
  cart:'M3 3h2l3 12h10l3-9H6 M9 20h.01 M18 20h.01',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  truck:'M1 3h14v13H1z M15 8h4l3 4v4h-7 M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  bag:'M5 7h14l2 14H3z M8 7V5a4 4 0 0 1 8 0v2',
  wallet:'M3 6a2 2 0 0 1 2-2h13v4 M3 6v12a2 2 0 0 0 2 2h16V8H5a2 2 0 0 1-2-2 M16 12h5v4h-5z',
  chart:'M3 3v18h18 M7 14l4-4 4 3 6-8',
  shield:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
  search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  arrow:'M5 12h14 M13 6l6 6-6 6',
  plus:'M12 5v14 M5 12h14',
  down:'M6 9l6 6 6-6',
  up:'M6 15l6-6 6 6',
  calendar:'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2',
  bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  logout:'M9 21H3V3h6 M9 12h12 M17 8l4 4-4 4',
  close:'M6 6l12 12 M18 6L6 18',
  check:'M5 12l4 4L19 6',
  warning:'M12 3L1 21h22z M12 9v4 M12 17h.01',
  edit:'M15 4l5 5 M3 21l5-1L21 7l-5-5L3 15z',
  receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2z M9 7h6 M9 11h6 M9 15h3',
  download:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  print:'M6 9V3h12v6 M6 18H3V9h18v9h-3 M6 14h12v7H6z M17 12h.01',
  lock:'M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4 M12 14v3',
  eye:'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  menu:'M3 6h18 M3 12h18 M3 18h18',
  minus:'M5 12h14',
  money:'M3 5h18v14H3z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M6 9h.01 M18 15h.01',
  spark:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z',
  help:'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  circle:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};
export const icon = (name,cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.box}"/></svg>`;
export function sneaker(color='sage',large=false) {
  const colors = {sage:['#d5e5cf','#8fae82','#f4f5ee'],black:['#353f3c','#202b27','#dfe3d9'],red:['#e7bcaf','#bc6b55','#f5ede4'],blue:['#b8d2dc','#668d9e','#f1f2e9'],cream:['#e8dfcd','#b5a584','#f7f4e9']};
  const [base,detail,sole] = colors[color] || colors.sage;
  return `<svg class="sneaker ${large?'large':''}" viewBox="0 0 300 180" fill="none" aria-hidden="true"><ellipse cx="153" cy="149" rx="119" ry="13" fill="#163f31" opacity=".08"/><path d="M41 104l14-48c3-10 11-9 16-1l18 24 44-18 34 35 57 14c24 6 42 13 42 28H37c-12-4-11-24 4-34z" fill="${base}" stroke="${detail}" stroke-width="2"/><path d="M37 129c48 8 174 9 229 0v13c-17 12-212 13-229-2z" fill="${sole}" stroke="${detail}" stroke-width="2"/><path d="M42 102l30-8 17-15M133 62l-4 37 43 11M222 110l-5 20" stroke="${detail}" stroke-width="3"/><path d="M95 91l34-15 M105 101l34-15 M116 111l34-15" stroke="${sole}" stroke-width="6" stroke-linecap="round"/><path d="M86 113c28 19 64 13 105-1-31 1-57 1-72-4-19-7-28-5-33 5z" fill="${detail}"/><path d="M50 144v-7 M64 145v-7 M78 146v-7 M92 147v-7 M223 146v-7 M238 145v-7" stroke="${detail}" stroke-width="2"/><path d="M57 56l-7-15" stroke="${detail}" stroke-width="7" stroke-linecap="round"/></svg>`;
}
