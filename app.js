const q = selector => document.querySelector(selector)
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])
const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n)
const dateKey = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')
const now = new Date()
const offset = days => dateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()+days))
const dateLabel = (d, options) => new Intl.DateTimeFormat('pt-BR',options).format(d)
const stages = ['Prospecção','Qualificação','Proposta','Negociação','Ganho','Perdido']
const colors = ['#7253aa','#406b94','#934e79','#845919','#536a38','#9a4b5c']
const paths = {
 painel:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 contatos:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-4 M17 3a4 4 0 0 1 0 8',
 funil:'M3 5h18l-7 8v5l-4 2v-7z',
 agenda:'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4',
 receita:'M12 2v20 M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6',
 ganho:'m5 12 4 4L19 6'
}
Object.assign(paths,{empresas:'M4 21V6l10-3v18 M14 9h6v12 M2 21h20 M8 8v1 M8 12v1 M8 16v1',tarefas:'M4 4h16v16H4z M8 12l3 3 5-6',historico:'M3 12a9 9 0 1 1 3 7 M3 6v6h6 M12 7v5l4 2',relatorios:'M4 4v16h16 M8 15v-4 M13 15V7 M18 15V4',dados:'M4 7a8 4 0 1 0 16 0 8 4 0 1 0-16 0 M4 7v10a8 4 0 0 0 16 0V7 M4 12a8 4 0 0 0 16 0'})
const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[name]+'"/></svg>'
const demoContacts = [
 ['Marina Costa','Estúdio Aurora','marina@example.com','Em negociação'],
 ['Rafael Mendes','Orbe Tecnologia','rafael@example.com','Lead'],
 ['Bianca Lima','Casa Lume','bianca@example.com','Cliente'],
 ['Lucas Ferreira','Nexo Digital','lucas@example.com','Lead'],
 ['Ana Ribeiro','Verde Forma','ana@example.com','Em negociação'],
 ['Clara Santos','Ponto Norte','clara@example.com','Cliente']
]
const seed = {
 contatos:demoContacts.map(([name,company,email,status],i)=>({id:'c'+i,name,company,email,status,date:offset(-i)})),
 funil:[
  ['Expansão de marca','Estúdio Aurora',18500,3,0],['Implantação CRM','Orbe Tecnologia',24000,0,0],
  ['Consultoria comercial','Casa Lume',12500,4,2],['Portal de parceiros','Nexo Digital',16000,1,0],
  ['Plano de crescimento','Verde Forma',14500,2,0],['Gestão de contas','Ponto Norte',17250,4,4],
  ['Projeto editorial','Casa Lume',9200,4,5],['Integração de dados','Orbe Tecnologia',21000,2,0],
  ['Diagnóstico comercial','Ponto Norte',8500,1,0],['Operação digital','Nexo Digital',21000,4,0],
  ['Pesquisa de mercado','Estúdio Aurora',7000,4,3]
 ].map(([name,company,value,stage,days],i)=>({id:'d'+i,name,company,value,status:stages[stage],date:offset(-days)})),
 agenda:[
  {id:'a0',name:'Retorno para Estúdio Aurora',date:offset(0),time:'10:30',notes:'Revisar condições da proposta.'},
  {id:'a1',name:'Apresentação para Orbe',date:offset(1),time:'14:00',notes:'Compartilhar demonstração.'},
  {id:'a2',name:'Reunião com Verde Forma',date:offset(4),time:'09:00',notes:''}
 ]
}
const storageKey = 'vertice-crm-v1'
const modules = ['contatos','funil','agenda','empresas','tarefas','historico']
const blank = () => Object.fromEntries(modules.map(key=>[key,[]]))
let data = {...blank(),...structuredClone(seed), empresas:demoContacts.map(([,name],i)=>({id:'e'+i,name,status:i%2?'Prospect':'Ativa',date:offset(-i)})), tarefas:[{id:'t0',name:'Enviar proposta revisada',company:'Estúdio Aurora',date:offset(1),status:'Pendente',priority:'Alta'}]}
try { const saved = localStorage.getItem(storageKey); if(saved) data = {...blank(),...JSON.parse(saved)} } catch {}
let month = new Date(now.getFullYear(),now.getMonth(),1)
let selected = dateKey(now)
let period = 7
let timer
const labels = {painel:'Visão geral',contatos:'Contatos',funil:'Funil de vendas',agenda:'Agenda',empresas:'Empresas',tarefas:'Tarefas',historico:'Histórico',relatorios:'Relatórios',dados:'Seus dados'}
const types = {contatos:'contato',funil:'oportunidade',agenda:'compromisso',empresas:'empresa',tarefas:'tarefa'}
const route = () => Object.hasOwn(labels,location.hash.slice(1)) ? location.hash.slice(1) : 'painel'
const button = (type,label,id='') => '<button class="'+(id?'':'primary')+'" data-edit="'+type+'" data-id="'+esc(id)+'">'+label+'</button>'
const dot = color => '<i class="dot" style="background:'+color+'"></i>'
const chip = (status,color) => '<span class="chip" style="--tone:'+color+'">'+esc(status)+'</span>'
const sum = items => items.reduce((total,item)=>total+Number(item.value),0)
function notify(message){
 q('#toast').textContent = message
 clearTimeout(timer)
 timer = setTimeout(()=>{q('#toast').textContent=''},3000)
}
function save(message){
 if(cloud.session){
  uploadWorkspace(message)
 } else {
  try { localStorage.setItem(storageKey,JSON.stringify(data)); localData=structuredClone(data); explicitLocalData=true; notify(message) }
  catch { notify('O navegador não conseguiu gravar as alterações.') }
 }
 render()
}
function track(action,type,name){
 data.historico.unshift({id:crypto.randomUUID(),action,type,name,at:new Date().toISOString()})
}
function intro(title,description,action){
 return '<section class="intro"><div><div class="eyebrow">GESTÃO COMERCIAL</div><h1>'+title+'</h1><p>'+description+'</p></div>'+action+'</section>'
}
function table(contacts){
 if(!contacts.length) return '<p class="empty">Nenhum contato encontrado.</p>'
 return '<div class="table-wrap"><table><thead><tr><th>Contato</th><th>Empresa</th><th>Status</th><th>Cadastro</th><th><span class="muted">Ações</span></th></tr></thead><tbody>'+contacts.map(c=>{
  const initials = c.name.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase()
  const color = {'Lead':'#7253aa','Cliente':'#536a38','Em negociação':'#845919'}[c.status] || colors[0]
  return '<tr><td><div class="person"><span class="avatar">'+esc(initials)+'</span><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.email)+'</small></div></div></td><td>'+esc(c.company || '—')+'</td><td>'+chip(c.status,color)+'</td><td>'+dateLabel(new Date(c.date+'T12:00'),{day:'2-digit',month:'short'})+'</td><td>'+button('contatos','Editar',c.id)+'</td></tr>'
 }).join('')+'</tbody></table></div>'
}
function revenueChart(won){
 const days = Array.from({length:period},(_,i)=>offset(i-period+1))
 const values = days.map(day=>sum(won.filter(d=>d.date===day)))
 const maximum = Math.max(1000,Math.ceil(Math.max(...values)/4000)*4000)
 const step = 510/period
 const barWidth = Math.min(46,step*.63)
 const ticks = [1,.75,.5,.25,0]
 return '<svg class="chart" viewBox="0 0 595 218" role="img" aria-label="Gráfico de receita diária dos últimos '+period+' dias">'+
 '<defs><linearGradient id="bars" x2="0" y2="1"><stop stop-color="#c6b2df"/><stop offset="1" stop-color="#a58dc8"/></linearGradient></defs>'+
 ticks.map(t=>'<line class="grid" x1="62" x2="584" y1="'+(182-t*164)+'" y2="'+(182-t*164)+'"/><text x="0" y="'+(186-t*164)+'">'+(t ? 'R$ '+Number((maximum*t/1000).toFixed(2)).toLocaleString('pt-BR')+' mil' : 'R$ 0')+'</text>').join('')+
 values.map((v,i)=>{
  const x = 67+step*(i+.5)
  const h = v/maximum*164
  const label = dateLabel(new Date(days[i]+'T12:00'),{day:'2-digit',month:'2-digit'})
  return '<rect x="'+(x-barWidth/2)+'" y="'+(182-Math.max(2,h))+'" width="'+barWidth+'" height="'+Math.max(2,h)+'" rx="3" fill="'+(v?'url(#bars)':'#e3dce9')+'"><title>'+label+' · '+money(v)+'</title></rect>'+
  (period===7 || i%5===0 || i===period-1?'<text text-anchor="middle" x="'+x+'" y="208">'+label+'</text>':'')
 }).join('')+'</svg>'
}
function dashboard(){
 const won = data.funil.filter(d=>d.status==='Ganho')
 const open = data.funil.filter(d=>!['Ganho','Perdido'].includes(d.status))
 const values = [[money(sum(won)),'Receita fechada','Valor dos negócios ganhos','receita'],[money(sum(open)),'Pipeline aberto',open.length+' oportunidades em andamento','funil'],[data.contatos.length,'Contatos cadastrados',data.contatos.filter(c=>c.status==='Lead').length+' leads na carteira','contatos'],[won.length,'Negócios ganhos','Total de fechamentos','ganho']]
 const counts = stages.map(stage=>data.funil.filter(d=>d.status===stage).length)
 let start = 0
 const segments = counts.map((count,i)=>{
  const end = start + (data.funil.length ? count/data.funil.length*100 : 0)
  const piece = 'color-mix(in srgb,'+colors[i]+' 48%, white)'+ ' '+start+'% '+end+'%'
  start = end
  return piece
 }).join(',')
 return intro('Olá, Nina.','Acompanhe suas oportunidades e resultados comerciais.',button('funil','＋ Nova oportunidade'))+
 '<section class="stats">'+values.map(([value,name,desc,img])=>'<article class="card stat"><div class="stat-top">'+name+'<span class="icon">'+icon(img)+'</span></div><b class="amount">'+value+'</b><small>'+desc+'</small></article>').join('')+'</section>'+
 '<section class="middle"><article class="card"><div class="section-head"><div><h2>Receita no período</h2><p>Valor dos negócios ganhos por dia</p></div><select id="period" aria-label="Período da receita"><option value="7">Últimos 7 dias</option><option value="30" '+(period===30?'selected':'')+'>Últimos 30 dias</option></select></div>'+revenueChart(won)+'</article>'+
 '<article class="card"><div class="section-head"><div><h2>Distribuição do funil</h2><p>Oportunidades por etapa</p></div></div><div class="summary"><div class="ring" style="background:'+(data.funil.length?'conic-gradient('+segments+')':'#eae4f0')+'"><div><b>'+data.funil.length+'</b><small>negócios</small></div></div><div class="legend">'+stages.map((s,i)=>'<div>'+dot(colors[i])+s+'<b>'+counts[i]+'</b></div>').join('')+'</div></div></article></section>'+
 '<section class="card"><div class="section-head"><div><h2>Contatos recentes</h2><p>Últimos contatos cadastrados</p></div><a href="#contatos" style="color:var(--lilac)">Ver contatos →</a></div>'+table([...data.contatos].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4))+'</section>'
}
function contacts(){
 return intro('Contatos','Organize seus leads e clientes.',button('contatos','＋ Novo contato'))+
 '<section class="card"><div class="controls"><input type="search" id="search" placeholder="Buscar nome, empresa ou e-mail" aria-label="Buscar contatos"><select id="status" aria-label="Filtrar status"><option value="">Todos os status</option><option>Lead</option><option>Em negociação</option><option>Cliente</option></select></div><div id="results">'+table(data.contatos)+'</div></section>'
}
function pipeline(){
 return intro('Funil de vendas','Arraste uma oportunidade para mudar de etapa ou clique para editar.',button('funil','＋ Nova oportunidade'))+
 '<section class="kanban">'+stages.map((stage,i)=>{
  const deals = data.funil.filter(d=>d.status===stage)
  return '<article class="lane" data-stage="'+stage+'"><h2>'+dot(colors[i])+' '+stage+' <small>· '+deals.length+'</small></h2><small>'+money(sum(deals))+'</small>'+
   deals.map(d=>'<button class="deal" draggable="true" data-edit="funil" data-id="'+esc(d.id)+'"><strong>'+esc(d.name)+'</strong><small>'+esc(d.company)+'</small><b>'+money(d.value)+'</b></button>').join('')+'</article>'
 }).join('')+'</section>'
}
function agenda(){
 const year = month.getFullYear(), m = month.getMonth()
 const blanks = (month.getDay()+6)%7
 const count = new Date(year,m+1,0).getDate()
 const events = data.agenda.filter(a=>a.date===selected).sort((a,b)=>a.time.localeCompare(b.time))
 return intro('Agenda','Planeje reuniões e próximos contatos.',button('agenda','＋ Novo compromisso'))+
 '<div class="calendar-layout"><section class="card"><div class="section-head"><h2>'+dateLabel(month,{month:'long',year:'numeric'})+'</h2><div><button data-month="-1" aria-label="Mês anterior">‹</button> <button data-month="0">Hoje</button> <button data-month="1" aria-label="Próximo mês">›</button></div></div><div class="calendar">'+
 ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(day=>'<div class="weekday">'+day+'</div>').join('')+
 '<div></div>'.repeat(blanks)+Array.from({length:count},(_,i)=>{
  const key = dateKey(new Date(year,m,i+1))
  const items = data.agenda.filter(a=>a.date===key)
  return '<button class="day '+(key===selected?'selected':'')+'" data-day="'+key+'" aria-pressed="'+(key===selected)+'">'+(i+1)+items.slice(0,2).map(a=>'<small>'+esc(a.name)+'</small>').join('')+(items.length>2?'<small>+'+(items.length-2)+'</small>':'')+'</button>'
 }).join('')+'</div></section><section class="card"><h2>'+dateLabel(new Date(selected+'T12:00'),{day:'numeric',month:'long'})+'</h2>'+
 (events.length?events.map(a=>'<div class="event"><div><strong>'+esc(a.name)+'</strong><p>'+esc(a.time)+(a.notes?' · '+esc(a.notes):'')+'</p></div>'+button('agenda','Editar',a.id)+'</div>').join(''):'<p class="empty">Nenhum compromisso neste dia.</p>')+'</section></div>'
}
function render(){
 const active = route()
 q('#nav').innerHTML = Object.entries(labels).map(([key,label])=>'<a href="#'+key+'" '+(active===key?'class="active" aria-current="page"':'')+'>'+icon(key)+label+'</a>').join('')
 q('#crumb').innerHTML = 'CRM / <strong>'+labels[active]+'</strong>'
 q('.side-bottom').innerHTML = '<a href="#dados"><i></i>'+cloudLabel()+'</a>'
 q('#main').innerHTML = {painel:dashboard,contatos:contacts,funil:pipeline,agenda,empresas:companies,tarefas:tasks,historico:historyPage,relatorios:reports,dados:dataPage}[active]()
}
const dialog = q('#editor')
function field(label,key,value='',type='text',extra=''){
 return '<label>'+label+'<input name="'+key+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></label>'
}
function options(label,items,current){
 return '<label>'+label+'<select name="status">'+items.map(item=>'<option '+(item===current?'selected':'')+'>'+item+'</option>').join('')+'</select></label>'
}
function edit(type,id){
 const item = data[type].find(r=>r.id===id) || {}
 const title = id?'Editar '+types[type]:({contatos:'Novo contato',funil:'Nova oportunidade',agenda:'Novo compromisso',empresas:'Nova empresa',tarefas:'Nova tarefa'})[type]
 const details = {
  contatos:()=>companyField(item.company)+field('E-mail','email',item.email,'email')+options('Status',['Lead','Em negociação','Cliente'],item.status)+field('Telefone','phone',item.phone,'tel')+field('Cargo','job',item.job)+notesField(item.notes),
  funil:()=>companyField(item.company)+field('Valor em reais','value',item.value,'number','required min="0" step="0.01"')+options('Etapa',stages,item.status)+field('Data de referência ou fechamento','date',item.date || dateKey(now),'date','required')+field('Próxima ação','next',item.next)+notesField(item.notes),
  empresas:()=>field('Setor','sector',item.sector)+field('Site','website',item.website,'url')+options('Status',['Prospect','Ativa','Inativa'],item.status)+notesField(item.notes),
  tarefas:()=>companyField(item.company)+field('Prazo','date',item.date || dateKey(now),'date','required')+options('Status',['Pendente','Em andamento','Concluída'],item.status)+selectField('Prioridade','priority',['Normal','Alta','Baixa'],item.priority)+notesField(item.notes),
  agenda:()=>field('Data','date',item.date || selected,'date','required')+field('Horário','time',item.time,'time','required')+'<label>Observações<textarea name="notes" rows="3">'+esc(item.notes)+'</textarea></label>'
 }
 const form = q('#form')
 form.dataset.type = type
 form.dataset.id = id
 form.innerHTML = '<h2 id="editor-title">'+title+'</h2>'+field(type==='agenda'?'Título':'Nome','name',item.name,'text','required maxlength="120"')+details[type]()+
 '<footer>'+(id?'<button type="button" class="danger" id="delete">Excluir</button>':'')+'<button type="button" id="cancel">Cancelar</button><button class="primary">Salvar</button></footer>'
 dialog.setAttribute('aria-labelledby','editor-title')
 dialog.showModal()
}
q('#form').addEventListener('submit',event=>{
 event.preventDefault()
 const form = event.currentTarget
 if(form.dataset.type==='auth')return
 const {type,id} = form.dataset
 const existing = data[type].find(item=>item.id===id)
 const updates = Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]))
 if(!updates.name){form.elements.name.focus();return}
 const record = {...existing,date:dateKey(now),...updates,id:id || crypto.randomUUID()}
 if(['contatos','empresas'].includes(type) && existing) record.date=existing.date
 if(type==='funil') record.value=Number(record.value)
 if(type==='agenda'){
  selected=record.date
  month=new Date(record.date.slice(0,7)+'-01T12:00')
 }
 if(type==='empresas' && existing && record.name!==existing.name){
  for(const related of ['contatos','funil','tarefas']){
   data[related]=data[related].map(item=>item.company===existing.name?{...item,company:record.name}:item)
  }
 }
 track(existing?'Editou':'Criou',types[type],record.name)
 data[type] = existing ? data[type].map(item=>item.id===id?record:item) : [record,...data[type]]
 dialog.close()
 save('Alterações salvas.')
})
document.addEventListener('click',event=>{
 const editButton = event.target.closest('[data-edit]')
 const day = event.target.closest('[data-day]')
 const move = event.target.closest('[data-month]')
 if(editButton && !cloud.loading) edit(editButton.dataset.edit,editButton.dataset.id)
 if(day){selected=day.dataset.day;render()}
 if(move){
  const delta=Number(move.dataset.month)
  month=delta?new Date(month.getFullYear(),month.getMonth()+delta,1):new Date(now.getFullYear(),now.getMonth(),1)
  selected=delta?dateKey(month):dateKey(now)
  render()
 }
 if(event.target.id==='cancel' && !cloud.loading) dialog.close()
 if(event.target.id==='delete' && confirm('Excluir este registro?')){
  const {type,id}=q('#form').dataset
  track('Excluiu',types[type],data[type].find(item=>item.id===id)?.name || '')
  data[type]=data[type].filter(item=>item.id!==id)
  dialog.close()
  save('Registro excluído.')
 }
})
function filterContacts(){
 const term=q('#search').value.trim().toLocaleLowerCase('pt-BR')
 const status=q('#status').value
 q('#results').innerHTML=table(data.contatos.filter(c=>(!status || c.status===status) && [c.name,c.company,c.email].some(v=>v.toLocaleLowerCase('pt-BR').includes(term))))
}
document.addEventListener('input',event=>{if(event.target.id==='search')filterContacts()})
document.addEventListener('change',event=>{
 if(event.target.id==='status')filterContacts()
 if(event.target.id==='period'){period=Number(event.target.value);render();q('#period').focus()}
})
document.addEventListener('dragstart',event=>{
 const deal=event.target.closest('.deal')
 if(deal){event.dataTransfer.setData('text/plain',deal.dataset.id);event.dataTransfer.effectAllowed='move'}
})
document.addEventListener('dragover',event=>{
 const lane=event.target.closest('.lane')
 if(lane){event.preventDefault();lane.classList.add('over')}
})
document.addEventListener('dragleave',event=>{
 const lane=event.target.closest('.lane')
 if(lane && !lane.contains(event.relatedTarget))lane.classList.remove('over')
})
document.addEventListener('drop',event=>{
 const lane=event.target.closest('.lane')
 if(!lane)return
 event.preventDefault()
 lane.classList.remove('over')
 const item=data.funil.find(d=>d.id===event.dataTransfer.getData('text/plain'))
 if(!cloud.loading && item && item.status!==lane.dataset.stage){
  item.status=lane.dataset.stage
  if(item.status==='Ganho') item.date=dateKey(now)
  track('Moveu para '+item.status,'oportunidade',item.name)
  save('Etapa atualizada.')
 }
})
window.addEventListener('hashchange',render)
q('#today').textContent=dateLabel(now,{weekday:'short',day:'numeric',month:'short'})
