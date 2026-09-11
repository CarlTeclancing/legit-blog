export const adminRoles=['SUPER_ADMIN','ADMIN']
export const editorialRoles=[...adminRoles,'EDITOR']
export const allRoles=[...editorialRoles,'AUTHOR']
export const sectionRoles={dashboard:editorialRoles,posts:allRoles,media:allRoles,profile:allRoles,categories:editorialRoles,comments:editorialRoles,adverts:editorialRoles,newsletter:adminRoles,users:adminRoles,settings:adminRoles,'author-requests':adminRoles}
export const canAccess=(role,section)=>Boolean(sectionRoles[section]?.includes(role))
