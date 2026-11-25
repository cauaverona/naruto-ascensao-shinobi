(() => {
  const byId = id => document.getElementById(id);
  const form = byId('form');
  const create = byId('create');
  let step = 0, revealed = false, timer;
  const leaf = '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M45 12C25 4 9 21 14 38c4 15 29 17 36 2 6-14-12-26-22-15-7 8 3 19 11 12M14 39 5 51l18-3M46 14l9-7-2 18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.insertAdjacentHTML('afterbegin', '<div class="world-backdrop" aria-hidden="true"></div>');
  const heading = create.querySelector('h2');
  heading.textContent = 'SEU LEGADO COMEÇA AQUI.';
  create.querySelector('.sectionhead').insertAdjacentHTML('afterend', '<nav class="creation-tabs" aria-label="Etapas de criação"><button type="button" data-step="0">01 <span>Identidade</span></button><button type="button" data-step="1">02 <span>Aparência</span></button><button type="button" data-step="2">03 <span>Destino</span></button></nav>');
  const portrait = create.querySelector('.portrait');
  portrait.insertAdjacentHTML('afterbegin', '<div class="village-mark">' + leaf + '</div><div class="portrait-heading">ARQUIVO SHINOBI <span>木ノ葉</span></div>');
  portrait.insertAdjacentHTML('beforeend', '<div class="character-name">Novo shinobi</div><div class="character-tag">ESTUDANTE DA ACADEMIA</div><div class="character-quote">Toda lenda tem um primeiro capítulo.</div>');
  portrait.querySelector('canvas').setAttribute('aria-label', 'Prévia da aparência do personagem');
  const panel = byId('fields').parentElement;
  panel.classList.add('creation-panel');
  panel.insertAdjacentHTML('afterbegin', '<div class="panel-heading"><span id="chapter-label">QUEM É VOCÊ?</span><h3 id="chapter-title">Um nome para a sua história.</h3><p id="chapter-desc">Sua jornada começa antes da primeira bandana.</p></div>');
  byId('fields').insertAdjacentHTML('afterend', '<section class="destiny" hidden><div class="destiny-seal">' + leaf + '</div><h3>O sangue você herda.<br>O caminho você constrói.</h3><p>Seu clã, afinidade e dons iniciais serão sorteados. A sua história começa com o que o destino entregar.</p><button type="button" id="reveal-destiny">Revelar meu destino <span>↗</span></button><dl id="destiny-results" aria-live="polite"></dl></section>');
  const submit = form.querySelector('button.primary');
  submit.insertAdjacentHTML('beforebegin', '<div class="creation-actions"><button type="button" id="previous-step">Anterior</button><button type="button" id="next-step">Continuar <span>→</span></button></div>');
  submit.textContent = 'COMEÇAR MINHA HISTÓRIA →';
  submit.classList.add('start-story');
  const fieldsByStep = [['name','sex'], ['skin','hair','cut','coat','glasses'], []];
  const fateFields = ['village','clan','element','talent','attribute','past'];
  const titles = [
    ['QUEM É VOCÊ?', 'Um nome para a sua história.', 'Escolha como você será conhecido na Vila da Folha.'],
    ['SEU JEITO DE SER', 'Deixe sua marca.', 'Cabelo, traje e detalhes. O visual é todo seu.'],
    ['O PRIMEIRO CAPÍTULO', 'Encontre seu destino.', 'Os dons são sorteados. O que fazer com eles é com você.']
  ];
  function sync() {
    portrait.querySelector('.character-name').textContent = byId('f_name').value.trim() || 'Novo shinobi';
    portrait.querySelector('.character-tag').textContent = revealed ? byId('f_clan').value.toUpperCase() + ' · ' + byId('f_element').value.toUpperCase() : 'ESTUDANTE DA ACADEMIA';
  }
  function render() {
    form.classList.toggle('destiny-revealed', revealed);
    create.querySelectorAll('[data-step]').forEach((button, i) => {
      button.classList.toggle('active', i === step);
      button.setAttribute('aria-current', i === step ? 'step' : 'false');
    });
    for (const [id] of fields) byId('f_' + id).parentElement.hidden = !fieldsByStep[step].includes(id);
    byId('fields').hidden = step === 2;
    create.querySelector('.destiny').hidden = step !== 2;
    byId('origin').hidden = step !== 2 || !revealed;
    byId('previous-step').hidden = step === 0;
    byId('next-step').hidden = step === 2;
    submit.hidden = step !== 2;
    submit.disabled = !revealed;
    ['chapter-label','chapter-title','chapter-desc'].forEach((id,i) => byId(id).textContent = titles[step][i]);
    sync();
  }
  function go(next) {
    if (next > step && !byId('f_name').value.trim()) { step = 0; render(); byId('f_name').reportValidity(); return; }
    step = Math.max(0, Math.min(2, next)); render();
  }
  create.querySelectorAll('[data-step]').forEach(b => b.onclick = () => go(Number(b.dataset.step)));
  byId('next-step').onclick = () => go(step + 1);
  byId('previous-step').onclick = () => go(step - 1);
  form.addEventListener('input', sync);
  // Preserve the original submit and save pipeline. Only the source of initial traits changes.
  form.addEventListener('submit', e => {
    if (step !== 2 || !revealed) { e.preventDefault(); e.stopImmediatePropagation(); go(step + 1); }
  }, true);
  byId('reveal-destiny').onclick = () => {
    if (revealed || timer) return;
    const button = byId('reveal-destiny'); button.disabled = true;
    button.textContent = 'O destino está se revelando…';
    const roll = () => fateFields.forEach(id => {
      const select = byId('f_' + id);
      const options = [...select.options].filter(o => o.value !== 'Sortear');
      const randomValue = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
      select.value = options[Math.floor(randomValue * options.length)].value;
    });
    roll();
    timer = setTimeout(() => {
      timer = null; revealed = true; button.hidden = true;
      const labels = {village:'Origem',clan:'Clã',element:'Afinidade',talent:'Talento',attribute:'Atributo +2',past:'Histórico'};
      byId('destiny-results').replaceChildren(...fateFields.map(id => {
        const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = labels[id]; dd.textContent = byId('f_' + id).value; row.append(dt,dd); return row;
      }));
      // Refresh the original preview and background without changing campaign statistics.
      form.dispatchEvent(new Event('input', {bubbles:true})); render();
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700);
  };
  function mode() {
    const current = ['home','create','play','classic'].find(id => !byId(id).hidden);
    document.body.dataset.screen = current;
    if (current === 'create') {
      step = 0; revealed = false; clearTimeout(timer); timer = null;
      const button = byId('reveal-destiny'); button.hidden = false; button.disabled = false; button.textContent = 'Revelar meu destino ↗';
      byId('destiny-results').replaceChildren(); render();
      try { const scene = parent.document.getElementById('stage'); if (scene) document.querySelector('.world-backdrop').style.backgroundImage = 'url(' + scene.toDataURL() + ')'; } catch {}
    }
  }
  new MutationObserver(mode).observe(create, {attributes:true, attributeFilter:['hidden']});
  new MutationObserver(() => { if (create.hidden) mode(); }).observe(byId('home'), {attributes:true,attributeFilter:['hidden']});
  mode();
})();
