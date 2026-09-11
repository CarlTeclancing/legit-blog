import api from './api'

let settingsPromise
export function getSiteSettings(){
 if(!settingsPromise)settingsPromise=api.get('/settings').then(response=>response.data).catch(()=>({siteName:'Legit.cm',logoText:'LEGIT.CM',tagline:'Stories that entertain, inform, and inspire.',footerText:'Entertainment and publishing from Cameroon and Africa.'}))
 return settingsPromise
}
export async function refreshSiteSettings(){settingsPromise=null;const site=await getSiteSettings();window.dispatchEvent(new CustomEvent('site-settings-updated',{detail:site}));return site}
