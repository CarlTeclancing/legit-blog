import api from './api'

let settingsPromise
export function getSiteSettings(){
 if(!settingsPromise)settingsPromise=api.get('/settings').then(response=>response.data).catch(()=>({siteName:'Legit.cm',logoText:'LEGIT.CM',tagline:'Stories that entertain, inform, and inspire.',footerText:'Entertainment and publishing from Cameroon and Africa.'}))
 return settingsPromise
}
export function refreshSiteSettings(){settingsPromise=null;return getSiteSettings()}
