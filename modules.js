const notesField = value => '<label>Observações<textarea name="notes" rows="3">'+esc(value)+'</textarea></label>'
function selectField(label,key,items,current){
 return '<label>'+label+'<select name="'+key+'">'+items.map(item=>'<option '+(item===current?'selected':'')+'>'+item+'</option>').join('')+'</select></label>'
}
function companyField(value){
 return field('Empresa','company',value,'text','list="company-list"')+
 '<datalist id="company-list">'+data.empresas.map(item=>'<option value="'+esc(item.name)+'"></option>').join('')+'</datalist>'
}
function companySummary(company){
 const related = key => data[key].filter(item=>item.company===company.name)
 return related('contatos').length+' contatos · '+related('funil').length+' oportunidades'
}
function companies(){
 return intro('Empresas','Centralize as contas e acompanhe seus vínculos comerciais.',button('empresas','＋ Nova empresa'))+
 (data.empresas.length?'<div class="record-grid">'+data.empresas.map(company=>'<article class="card record"><div class="section-head"><div class="icon">'+icon('empresas')+'</div>'+chip(company.status,company.status==='Ativa'?'#536a38':'#7253aa')+'</div><h2>'+esc(company.name)+'</h2><p>'+esc(company.sector || 'Setor em aberto')+'</p>'+(company.notes?'<p class="record-notes">'+esc(company.notes)+'</p>':'')+'<footer><small>'+companySummary(company)+'</small>'+button('empresas','Editar',company.id)+'</footer></article>').join('')+'</div>':'<section class="card empty">Nenhuma empresa cadastrada.</section>')
}
let taskFilter = ''
function tasks(){
 const tasks = [...data.tarefas].sort((a,b)=>a.date.localeCompare(b.date))
 const filtered = tasks.filter(task=>!taskFilter || task.status===taskFilter)
 return intro('Tarefas','Acompanhe prazos, prioridades e retornos.',button('tarefas','＋ Nova tarefa'))+
 '<section class="card"><div class="section-head"><h2>'+tasks.filter(t=>t.status!=='Concluída').length+' em aberto</h2><select id="task-filter" aria-label="Filtrar tarefas">'+['','Pendente','Em andamento','Concluída'].map(status=>'<option value="'+status+'" '+(status===taskFilter?'selected':'')+'>'+(status||'Todos os status')+'</option>').join('')+'</select></div>'+
 (filtered.length?'<div class="table-wrap"><table><thead><tr><th>Tarefa</th><th>Prazo</th><th>Prioridade</th><th>Status</th><th>Ações</th></tr></thead><tbody>'+filtered.map(t=>'<tr><td><strong>'+esc(t.name)+'</strong><div class="muted">'+esc(t.company)+'</div></td><td>'+dateLabel(new Date(t.date+'T12:00'),{day:'2-digit',month:'short'})+(t.date<dateKey(now)&&t.status!=='Concluída'?' <small class="late">Vencida</small>':'')+'</td><td>'+chip(t.priority,t.priority==='Alta'?'#934e79':'#7253aa')+'</td><td>'+esc(t.status)+'</td><td>'+button('tarefas','Editar',t.id)+(t.status!=='Concluída'?' <button data-complete="'+esc(t.id)+'">Concluir</button>':'')+'</td></tr>').join('')+'</tbody></table></div>':'<p class="empty">Nenhuma tarefa neste filtro.</p>')+'</section>'
}
function historyPage(){
 return intro('Histórico','Consulte as alterações feitas no CRM.','')+
 '<section class="card"><h2>Atividade recente</h2>'+(data.historico.length?data.historico.map(entry=>'<div class="event"><div><strong>'+esc(entry.action)+' '+esc(entry.type)+'</strong><p>'+esc(entry.name)+'</p></div><small>'+dateLabel(new Date(entry.at),{dateStyle:'short',timeStyle:'short'})+'</small></div>').join(''):'<p class="empty">As próximas alterações aparecerão aqui.</p>')+'</section>'
}
function reports(){
 const won = data.funil.filter(item=>item.status==='Ganho')
 const lost = data.funil.filter(item=>item.status==='Perdido')
 const closed = won.length+lost.length
 const average = won.length?sum(won)/won.length:0
 return intro('Relatórios','Analise o desempenho da operação comercial.','<button data-download="csv">Exportar oportunidades em CSV</button>')+
 '<section class="stats report-stats">'+[['Taxa de ganho',closed?Math.round(won.length/closed*100)+'%':'—','Ganhos entre negócios encerrados'],['Ticket médio',money(average),'Valor médio por negócio ganho'],['Receita fechada',money(sum(won)),won.length+' negócios ganhos'],['Volume perdido',money(sum(lost)),lost.length+' negócios perdidos']].map(([label,value,sub])=>'<article class="card stat"><div class="stat-top">'+label+'</div><b class="amount">'+value+'</b><small>'+sub+'</small></article>').join('')+
 '</section><section class="card"><h2>Oportunidades por etapa</h2><div class="table-wrap"><table><thead><tr><th>Etapa</th><th>Oportunidades</th><th>Valor total</th></tr></thead><tbody>'+stages.map((stage,i)=>{const deals=data.funil.filter(d=>d.status===stage);return '<tr><td>'+chip(stage,colors[i])+'</td><td>'+deals.length+'</td><td>'+money(sum(deals))+'</td></tr>'}).join('')+'</tbody></table></div></section>'
}
function csvCell(value){
 let text=String(value??'')
 if(/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text="'"+text
 return '"'+text.replaceAll('"','""')+'"'
}
function download(format){
 const isCsv=format==='csv'
 const rows=[['Nome','Empresa','Etapa','Valor BRL','Data','Próxima ação'],...data.funil.map(d=>[d.name,d.company,d.status,d.value,d.date,d.next])]
 const contents=isCsv?'\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'):JSON.stringify(data,null,2)
 const url=URL.createObjectURL(new Blob([contents],{type:isCsv?'text/csv;charset=utf-8':'application/json'}))
 const link=document.createElement('a')
 link.href=url
 link.download='vertice-'+(isCsv?'oportunidades.csv':'backup.json')
 link.click()
 setTimeout(()=>URL.revokeObjectURL(url),1000)
}
document.addEventListener('change',event=>{
 if(event.target.id==='task-filter'){taskFilter=event.target.value;render();q('#task-filter').focus()}
})
document.addEventListener('click',event=>{
 const complete=event.target.closest('[data-complete]')
 const link=event.target.closest('[data-download]')
 if(link)download(link.dataset.download)
 if(!complete||cloud.loading)return
 const task=data.tarefas.find(t=>t.id===complete.dataset.complete)
 if(task && task.status!=='Concluída'){
  task.status='Concluída'
  track('Concluiu','tarefa',task.name)
  save('Tarefa concluída.')
 }
})
