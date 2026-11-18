const endpoint = 'https://khjoqaojzwemyrtipajz.supabase.co'
const publishableKey = 'sb_publishable_t5bftoltaVunHIBVQesGUg_7BCiJrYd'
const sessionKey = 'vertice-cloud-session'
const cloud = {session:null,revision:null,loading:false,dirty:false,error:'',conflict:false}
let localData = structuredClone(data)
let explicitLocalData = false
try { explicitLocalData = Boolean(localStorage.getItem(storageKey)) } catch {}

function cloudLabel(){
 if(cloud.loading)return 'Sincronizando…'
 if(cloud.error)return 'Sincronização pendente'
 return cloud.session?'Supabase conectado':'Dados neste navegador'
}
async function request(path,{method='GET',body,token,prefer}={}){
 const headers={apikey:publishableKey}
 if(body!==undefined)headers['Content-Type']='application/json'
 if(token)headers.Authorization='Bearer '+token
 if(prefer)headers.Prefer=prefer
 const response=await fetch(endpoint+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)})
 if(!response.ok){
  const detail=await response.json().catch(()=>({}))
  const error=new Error(detail.msg || detail.message || 'Falha na conexão com o Supabase.')
  error.status=response.status
  throw error
 }
 return response.status===204?null:response.json()
}
function remember(session){
 cloud.session=session
 try{
  if(session) sessionStorage.setItem(sessionKey,JSON.stringify(session))
  else sessionStorage.removeItem(sessionKey)
 }catch{}
}
async function token(){
 if(cloud.session.expires_at>Date.now()/1000+30)return cloud.session.access_token
 const fresh=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:cloud.session.refresh_token}})
 remember(fresh)
 return fresh.access_token
}
async function loadWorkspace(){
 const rows=await request('/rest/v1/vertice_workspaces?select=records,revision',{token:await token()})
 return rows[0] || {records:blank(),revision:null}
}
function setWorkspace(workspace){
 data={...blank(),...workspace.records}
 Object.assign(cloud,{revision:workspace.revision,dirty:false,conflict:false,error:''})
}
async function uploadWorkspace(message){
 cloud.loading=true
 cloud.dirty=true
 try{
  const accessToken=await token()
  const isNew=cloud.revision===null
  const revision=isNew?1:cloud.revision+1
  const filter=isNew?'':'?revision=eq.'+cloud.revision
  const rows=await request('/rest/v1/vertice_workspaces'+filter,{
   method:isNew?'POST':'PATCH',body:{revision,records:data},token:accessToken,prefer:'return=representation'
  })
  if(rows.length!==1){
   cloud.conflict=true
   throw new Error('Outra sessão atualizou o CRM.')
  }
  Object.assign(cloud,{revision,dirty:false,error:''})
  notify(message)
 }catch(error){
  if(error.status===409)cloud.conflict=true
  cloud.error=cloud.conflict?'Outra sessão atualizou os dados. Baixe um backup antes de carregar a versão mais recente.':'As alterações aguardam sincronização. Tente novamente ou baixe um backup antes de fechar a página.'
  notify('Sincronização pendente. Abra Seus dados para revisar.')
 }finally{
  cloud.loading=false
  render()
 }
}
function dataPage(){
 const warning=cloud.error?'<p role="alert" class="cloud-error">'+esc(cloud.error)+'</p>':''
 const account=cloud.session?
  '<h2>Supabase conectado</h2><p>'+esc(cloud.session.user?.email)+' · Entre com a mesma conta para acessar os dados em outro dispositivo.</p>'+warning+
  '<div class="data-actions">'+(cloud.dirty&&!cloud.conflict?'<button id="retry-cloud">Tentar salvar novamente</button>':'')+
  (cloud.revision===null&&!cloud.dirty&&explicitLocalData?'<button class="primary" id="import-local">Copiar dados deste navegador</button>':'')+
  '<button id="reload-cloud">'+(cloud.dirty?'Descartar alterações locais e recarregar':'Atualizar da nuvem')+'</button><button id="logout-cloud" '+(cloud.dirty?'disabled':'')+'>Sair do Supabase</button></div>':
  '<h2>Sincronização na nuvem</h2><p>Entre com sua conta do CRM para salvar no Supabase e acessar os mesmos dados em outros dispositivos.</p>'+warning+
  '<div class="data-actions"><button class="primary" data-auth="login">Entrar</button><button data-auth="signup">Criar conta do CRM</button></div>'
 return intro('Seus dados','Gerencie a sincronização e exporte uma cópia dos seus registros.','')+
 '<div class="data-layout"><section class="card">'+account+'</section><section class="card"><h2>Exportação e backup</h2><p>Exporte todos os registros em JSON ou as oportunidades em CSV.</p><div class="data-actions"><button data-download="json">Baixar backup JSON</button><button data-download="csv">Baixar oportunidades em CSV</button></div></section></div>'
}
function authDialog(mode){
 const signup=mode==='signup'
 const form=q('#form')
 form.dataset.type='auth'
 form.dataset.id=mode
 form.innerHTML='<h2 id="editor-title">'+(signup?'Criar conta do CRM':'Entrar no Supabase')+'</h2>'+
  (signup?'<p style="margin-top:7px">Se receber um e-mail de confirmação, confirme a conta e volte ao CRM para entrar.</p>':'')+
  field('E-mail','email','','email','required autocomplete="email"')+
  field('Senha','password','','password','required minlength="8" autocomplete="'+(signup?'new-password':'current-password')+'"')+
  '<p id="auth-error" role="alert" class="cloud-error" style="margin-top:10px"></p><footer><button type="button" id="cancel">Cancelar</button><button class="primary">'+(signup?'Criar conta':'Entrar')+'</button></footer>'
 dialog.setAttribute('aria-labelledby','editor-title')
 dialog.showModal()
}
dialog.addEventListener('cancel',event=>{if(cloud.loading)event.preventDefault()})
q('#form').addEventListener('submit',async event=>{
 const form=event.currentTarget
 if(form.dataset.type!=='auth')return
 event.preventDefault()
 if(cloud.loading)return
 cloud.loading=true
 const submit=form.querySelector('.primary')
 submit.disabled=true
 try{
  const {email,password}=Object.fromEntries(new FormData(form))
  const signup=form.dataset.id==='signup'
  const response=await request(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{method:'POST',body:{email:email.trim(),password}})
  if(!response.access_token){
   dialog.close()
   notify('Confira seu e-mail, confirme a conta e volte para entrar.')
   return
  }
  remember(response)
  const workspace=await loadWorkspace()
  localData=structuredClone(data)
  setWorkspace(workspace)
  dialog.close()
  notify('Supabase conectado.')
 }catch(error){
  remember(null)
  q('#auth-error').textContent=error.message==='Invalid login credentials'?'E-mail ou senha inválidos.':error.message
 }finally{
  cloud.loading=false
  submit.disabled=false
  render()
 }
})
document.addEventListener('click',async event=>{
 const action=event.target.closest('[data-auth]')
 if(cloud.loading)return
 if(action)authDialog(action.dataset.auth)
 if(event.target.id==='retry-cloud')await uploadWorkspace('Alterações sincronizadas.')
 if(event.target.id==='import-local' && cloud.revision===null && !cloud.dirty){
  data=structuredClone(localData)
  await uploadWorkspace('Dados deste navegador copiados para o Supabase.')
 }
 if(event.target.id==='reload-cloud'){
  if(cloud.dirty&&!confirm('Descartar as alterações ainda não sincronizadas?'))return
  cloud.loading=true
  try{setWorkspace(await loadWorkspace());notify('Dados atualizados.')}
  catch{cloud.error='Não foi possível acessar o Supabase. Tente novamente.'}
  finally{cloud.loading=false;render()}
 }
 if(event.target.id==='logout-cloud'&&!cloud.dirty){
  cloud.loading=true
  try{await request('/auth/v1/logout?scope=local',{method:'POST',token:await token()})}catch{}
  remember(null)
  Object.assign(cloud,{loading:false,error:'',revision:null})
  data=structuredClone(localData)
  render()
 }
})
window.addEventListener('beforeunload',event=>{
 if(cloud.dirty){event.preventDefault();event.returnValue=''}
})
async function restoreSession(){
 try{
  const saved=sessionStorage.getItem(sessionKey)
  if(!saved)return
  cloud.loading=true
  remember(JSON.parse(saved))
  render()
  setWorkspace(await loadWorkspace())
 }catch{
  remember(null)
  cloud.error='Não foi possível retomar a sessão. Entre novamente para acessar seus dados.'
 }finally{
  cloud.loading=false
  render()
 }
}
render()
restoreSession()
