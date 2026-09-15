export function initialArticle(slug){
 try{
  const data=JSON.parse(document.getElementById('initial-article')?.textContent||'null')
  return data?.slug===slug?data:null
 }catch{return null}
}
