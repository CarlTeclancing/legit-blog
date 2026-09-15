export function luminance(color) {
 const c=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
 return c[0]*.2126+c[1]*.7152+c[2]*.0722
}
export function textColor(background,chosen) {
 return /^#[0-9a-f]{6}$/i.test(chosen||'')?chosen:luminance(background)>.179?'#111111':'#ffffff'
}
export function contrastRatio(background,foreground) {
 const values=[luminance(background),luminance(foreground)].sort((a,b)=>b-a)
 return (values[0]+.05)/(values[1]+.05)
}
