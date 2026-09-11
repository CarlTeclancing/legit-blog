import jwt from 'jsonwebtoken'
export async function auth(req,res,next){
 const h=req.headers.authorization||''; const token=h.startsWith('Bearer ')?h.slice(7):null
 if(!token)return res.status(401).json({message:'Authentication required'})
 let claims
 try{claims=jwt.verify(token,process.env.JWT_SECRET)}catch{return res.status(401).json({message:'Invalid or expired token'})}
 try {
  const user=await req.app.locals.prisma.user.findUnique({where:{id:claims.id},select:{id:true,role:true,name:true,email:true,active:true}})
  if(!user?.active)return res.status(401).json({message:'Account disabled or unavailable'})
  req.user=user;next()
 } catch(error){next(error)}
}
export function roles(...allowed){return (req,res,next)=>allowed.includes(req.user.role)?next():res.status(403).json({message:'Insufficient permission'})}
