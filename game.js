const DECK_KEY = 'astral.deck.v1';
const MAX_DECK = 30;
const HAND_LIMIT = 9;

const themes = ['Flame', 'Forest', 'Sanctum', 'Machine', 'Shade', 'Dragon'];
const pool = [];
let cid = 1;
const id = () => `c${String(cid++).padStart(3, '0')}`;

function unit(name, cost, attack, hp, keywords = [], text = '') {
  return { id: id(), name, type: 'unit', cost, attack, hp, keywords, text };
}
function spell(name, cost, effect, text) {
  return { id: id(), name, type: 'spell', cost, effect, text };
}
function amulet(name, cost, effect, text) {
  return { id: id(), name, type: 'amulet', cost, effect, text };
}

for (const t of themes) {
  pool.push(unit(`${t} Scout`, 1, 1, 2));
  pool.push(unit(`${t} Spear`, 2, 2, 2, ['rush'], '突進'));
  pool.push(unit(`${t} Guard`, 3, 2, 4, ['guard'], '守護'));
  pool.push(unit(`${t} Rider`, 4, 4, 3, ['storm'], '疾走'));
  pool.push(unit(`${t} Sage`, 5, 3, 5, ['fanfareDraw'], 'ファンファーレ:1ドロー'));
  pool.push(unit(`${t} Revenant`, 6, 5, 5, ['lastwordDraw'], 'ラストワード:1ドロー'));
  pool.push(unit(`${t} Titan`, 7, 6, 7));
  pool.push(unit(`${t} Warden`, 4, 3, 5, ['guard']));
}

const spellTemplates = [
  ['Blazing Shot',2,{kind:'damage',target:'enemyUnit',value:3},'敵ユニット1体に3ダメージ'],
  ['Arc Bolt',1,{kind:'damage',target:'enemyUnit',value:2},'敵ユニット1体に2ダメージ'],
  ['Soul Drain',3,{kind:'damage',target:'enemyUnit',value:4},'敵ユニット1体に4ダメージ'],
  ['Battle Insight',2,{kind:'draw',value:2},'カードを2枚引く'],
  ['Sacred Prayer',2,{kind:'heal',target:'selfLeader',value:3},'自リーダーを3回復'],
  ['War Cry',2,{kind:'buffBoard',value:1},'自軍ユニットすべて+1/+1'],
  ['Meteor Crack',5,{kind:'damageAllEnemy',value:2},'敵全体に2ダメージ'],
  ['Steel Cut',4,{kind:'destroyEnemyMaxAttack',value:4},'攻撃4以下の敵を破壊'],
  ['Cycle Draw',1,{kind:'draw',value:1},'1ドロー'],
  ['Dragon Breath',3,{kind:'damageLeader',value:3},'敵リーダーに3ダメージ'],
  ['Purify Field',4,{kind:'healBoard',value:2},'自軍全体2回復'],
  ['Quick Spark',1,{kind:'damageAny',value:1},'敵1体かリーダーに1ダメージ'],
];
spellTemplates.forEach(s=>pool.push(spell(...s)));
spellTemplates.slice(0,6).forEach(s=>pool.push(spell(`${s[0]}+`, s[1]+1, s[2], s[3])));

const amuletTemplates = [
  ['Temple of Dawn',3,{kind:'turnEndHeal',value:1},'自ターン終了時1回復'],
  ['Machine Forge',2,{kind:'onPlayBuff',value:1},'ユニットを出すたび+1/+0'],
  ['Shade Lantern',2,{kind:'turnStartDrawChance',value:0.5},'自ターン開始時50%で1ドロー'],
  ['Guardian Banner',3,{kind:'guardBoost',value:1},'守護ユニット+1/+1'],
  ['Flame Sigil',4,{kind:'turnEndDamage',value:1},'敵リーダーに1ダメージ'],
  ['Sky Library',5,{kind:'turnStartDraw',value:1},'自ターン開始時1ドロー'],
  ['Soul Bell',3,{kind:'onUnitDeathHeal',value:1},'味方破壊時1回復'],
  ['Dragon Shrine',4,{kind:'costRamp',value:1},'設置時PP最大+1'],
  ['Ancient Core',2,{kind:'none'},'効果なし'],
  ['Clock Tower',1,{kind:'none'},'効果なし'],
];
amuletTemplates.forEach(a=>pool.push(amulet(...a)));

const state = {
  deck: [],
  mode: 'deck',
  game: null,
};

const el = (id) => document.getElementById(id);
const log = (m) => {
  const node = el('log');
  if (!node) return;
  const p = document.createElement('div');
  p.textContent = `• ${m}`;
  node.prepend(p);
};

function getDeckMap() {
  const map = {};
  state.deck.forEach(id => map[id] = (map[id] || 0) + 1);
  return map;
}

function renderDeckBuilder() {
  const search = el('search').value.toLowerCase();
  const cf = el('costFilter').value;
  const tf = el('typeFilter').value;
  const map = getDeckMap();
  el('deckCount').textContent = `デッキ: ${state.deck.length}/${MAX_DECK}`;
  el('startBattle').disabled = state.deck.length !== MAX_DECK;

  const poolList = el('poolList');
  const deckList = el('deckList');
  poolList.innerHTML = '';
  deckList.innerHTML = '';

  const filtered = pool.filter(c =>
    c.name.toLowerCase().includes(search) &&
    (cf === 'all' || String(c.cost) === cf) &&
    (tf === 'all' || c.type === tf)
  );

  filtered.forEach(c => {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `<h4>${c.name}</h4><div class='small'>${jpType(c.type)} / ${c.cost}</div><div class='small'>${c.text || ''}</div><div class='small'>枚数: ${map[c.id] || 0}</div>`;
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = '追加';
    b.disabled = state.deck.length >= MAX_DECK || (map[c.id] || 0) >= 3;
    b.onclick = () => { state.deck.push(c.id); renderDeckBuilder(); };
    d.appendChild(b);
    poolList.appendChild(d);
  });

  Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([id, n]) => {
    const c = pool.find(x => x.id === id);
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `<h4>${c.name} ×${n}</h4><div class='small'>${jpType(c.type)} / ${c.cost}</div>`;
    const b = document.createElement('button');
    b.className = 'btn btn-danger';
    b.textContent = '1枚削除';
    b.onclick = () => {
      const idx = state.deck.indexOf(id);
      if (idx >= 0) state.deck.splice(idx, 1);
      renderDeckBuilder();
    };
    d.appendChild(b);
    deckList.appendChild(d);
  });
}

function jpType(t) { return t === 'unit' ? 'ユニット' : t === 'spell' ? 'スペル' : 'アミュレット'; }

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function cloneCard(base) { return { ...base, uid: crypto.randomUUID(), currentHp: base.hp, canAttack: false, hasAwakened: false }; }

function startBattle() {
  const playerDeck = shuffle(state.deck.map(id => cloneCard(pool.find(c => c.id === id))));
  const auto = []; const counts = {};
  while (auto.length < MAX_DECK) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    counts[c.id] = (counts[c.id] || 0) + 1;
    if (counts[c.id] <= 3) auto.push(cloneCard(c));
  }
  const cpuDeck = shuffle(auto);
  const playerFirst = Math.random() < 0.5;
  state.mode = 'battle';
  state.game = {
    turn: 1,
    active: playerFirst ? 'player' : 'cpu',
    player: { hp: 20, maxCost: 0, cost: 0, hand: [], board: [], deck: playerDeck, grave: [], awaken: 2, first: playerFirst },
    cpu: { hp: 20, maxCost: 0, cost: 0, hand: [], board: [], deck: cpuDeck, grave: [], awaken: 2, first: !playerFirst },
    winner: null,
  };
  el('deckView').classList.add('hidden');
  el('battleView').classList.remove('hidden');
  el('log').innerHTML = '';
  for (let i = 0; i < 3; i++) { draw('player'); draw('cpu'); }
  log(`${playerFirst ? 'あなた' : 'CPU'}の先攻で開始`);
  startTurn(state.game.active);
  renderBattle();
}

function draw(side, n = 1) {
  const p = state.game[side];
  for (let i = 0; i < n; i++) {
    if (!p.deck.length || p.hand.length >= HAND_LIMIT) return;
    p.hand.push(p.deck.pop());
  }
}

function startTurn(side) {
  const p = state.game[side];
  state.game.active = side;
  p.maxCost = Math.min(10, p.maxCost + 1);
  p.cost = p.maxCost;
  draw(side, 1);
  p.board.forEach(u => u.canAttack = true);
  applyAmuletTurnStart(side);
  renderBattle();
  if (side === 'cpu') setTimeout(cpuTurn, 500);
}

function endTurn() {
  const side = state.game.active;
  applyAmuletTurnEnd(side);
  const next = side === 'player' ? 'cpu' : 'player';
  if (next === 'player') state.game.turn += 1;
  startTurn(next);
}

function playCard(side, index) {
  if (state.game.active !== side) return;
  const p = state.game[side], e = state.game[side === 'player' ? 'cpu' : 'player'];
  const c = p.hand[index];
  if (!c || c.cost > p.cost) return;
  if (c.type === 'unit' && p.board.length >= 5) return;
  p.cost -= c.cost;
  p.hand.splice(index, 1);
  if (c.type === 'unit') {
    c.canAttack = c.keywords?.includes('storm');
    if (c.keywords?.includes('rush')) c.canAttack = true;
    p.board.push(c);
    if (c.keywords?.includes('fanfareDraw')) draw(side, 1);
    applyAmuletOnPlay(side, c);
    log(`${side === 'player' ? 'あなた' : 'CPU'}が${c.name}を召喚`);
  } else if (c.type === 'spell') {
    castSpell(side, c);
    p.grave.push(c);
    log(`${side === 'player' ? 'あなた' : 'CPU'}が${c.name}を使用`);
  } else {
    c.turnPlayed = state.game.turn;
    p.board.push(c);
    if (c.effect.kind === 'costRamp') { p.maxCost = Math.min(10, p.maxCost + 1); p.cost = Math.min(10, p.cost + 1); }
    log(`${side === 'player' ? 'あなた' : 'CPU'}が${c.name}を設置`);
  }
  cleanup();
  renderBattle();
}

function castSpell(side, c) {
  const p = state.game[side], e = state.game[side === 'player' ? 'cpu' : 'player'];
  const eff = c.effect;
  if (eff.kind === 'draw') draw(side, eff.value);
  if (eff.kind === 'heal') p.hp = Math.min(20, p.hp + eff.value);
  if (eff.kind === 'damageLeader') e.hp -= eff.value;
  if (eff.kind === 'damageEnemyLeader') e.hp -= eff.value;
  if (eff.kind === 'damageAny') {
    if (e.board.length) e.board[0].currentHp -= eff.value; else e.hp -= eff.value;
  }
  if (eff.kind === 'damage' || eff.kind === 'enemyUnit') {
    if (e.board.length) e.board[0].currentHp -= eff.value;
  }
  if (eff.kind === 'damageAllEnemy') e.board.forEach(u => u.currentHp -= eff.value);
  if (eff.kind === 'destroyEnemyMaxAttack') {
    const t = e.board.find(u => u.attack <= eff.value);
    if (t) t.currentHp = 0;
  }
  if (eff.kind === 'buffBoard') p.board.forEach(u => { u.attack += eff.value; u.currentHp += eff.value; });
  if (eff.kind === 'healBoard') p.board.forEach(u => { u.currentHp = Math.min(u.hp + 2, u.currentHp + eff.value); });
}

function hasGuard(side) { return state.game[side].board.some(u => u.type === 'unit' && u.keywords?.includes('guard')); }

function unitAttack(side, uid, target) {
  if (state.game.active !== side) return;
  const p = state.game[side], e = state.game[side === 'player' ? 'cpu' : 'player'];
  const a = p.board.find(u => u.uid === uid);
  if (!a || !a.canAttack || a.type !== 'unit') return;
  const guardExists = hasGuard(side === 'player' ? 'cpu' : 'player');
  if (target === 'leader') {
    if (guardExists && !a.keywords?.includes('storm')) return;
    e.hp -= a.attack;
    a.canAttack = false;
    log(`${a.name}がリーダー攻撃`);
  } else {
    const d = e.board.find(u => u.uid === target);
    if (!d || d.type !== 'unit') return;
    if (guardExists && !d.keywords?.includes('guard')) return;
    d.currentHp -= a.attack;
    a.currentHp -= d.attack;
    a.canAttack = false;
    log(`${a.name}が${d.name}を攻撃`);
  }
  cleanup();
  renderBattle();
}

function cleanup() {
  ['player', 'cpu'].forEach(side => {
    const p = state.game[side];
    const lost = p.board.filter(c => c.type === 'unit' && c.currentHp <= 0);
    if (lost.length) {
      lost.forEach(u => {
        if (u.keywords?.includes('lastwordDraw')) draw(side, 1);
        const allies = p.board.filter(x => x.type === 'amulet' && x.effect.kind === 'onUnitDeathHeal');
        if (allies.length) p.hp = Math.min(20, p.hp + allies.length);
      });
    }
    p.grave.push(...lost);
    p.board = p.board.filter(c => !(c.type === 'unit' && c.currentHp <= 0));
  });
  if (state.game.player.hp <= 0 || state.game.cpu.hp <= 0) {
    state.game.winner = state.game.player.hp <= 0 ? 'CPU' : 'あなた';
    alert(`${state.game.winner}の勝利！`);
  }
}

function canAwaken(side) {
  const p = state.game[side];
  if (p.awaken <= 0) return false;
  if (p.first && state.game.turn < 5) return false;
  if (!p.first && state.game.turn < 4) return false;
  return p.board.some(u => u.type === 'unit');
}

function awaken(side, uid) {
  if (!canAwaken(side)) return;
  const p = state.game[side];
  const u = p.board.find(x => x.uid === uid && x.type === 'unit');
  if (!u) return;
  p.awaken -= 1;
  u.attack += 2;
  u.currentHp += 2;
  u.canAttack = true;
  u.hasAwakened = true;
  log(`${side === 'player' ? 'あなた' : 'CPU'}が${u.name}を覚醒`);
  renderBattle();
}

function applyAmuletTurnStart(side) {
  const p = state.game[side];
  p.board.filter(c => c.type === 'amulet').forEach(a => {
    if (a.effect.kind === 'turnStartDrawChance' && Math.random() < a.effect.value) draw(side,1);
    if (a.effect.kind === 'turnStartDraw') draw(side,a.effect.value);
  });
}
function applyAmuletTurnEnd(side) {
  const p = state.game[side], e = state.game[side === 'player' ? 'cpu' : 'player'];
  p.board.filter(c => c.type === 'amulet').forEach(a => {
    if (a.effect.kind === 'turnEndHeal') p.hp = Math.min(20, p.hp + a.effect.value);
    if (a.effect.kind === 'turnEndDamage') e.hp -= a.effect.value;
  });
  cleanup();
}
function applyAmuletOnPlay(side, unitCard) {
  const p = state.game[side];
  p.board.filter(c => c.type === 'amulet').forEach(a => {
    if (a.effect.kind === 'onPlayBuff') unitCard.attack += a.effect.value;
    if (a.effect.kind === 'guardBoost' && unitCard.keywords?.includes('guard')) { unitCard.attack += 1; unitCard.currentHp += 1; }
  });
}

function cpuTurn() {
  if (state.game.active !== 'cpu' || state.game.winner) return;
  const cpu = state.game.cpu;
  if (canAwaken('cpu')) awaken('cpu', cpu.board.find(u => u.type === 'unit').uid);

  let action = true;
  while (action) {
    action = false;
    const playable = cpu.hand
      .map((c, i) => ({ c, i, score: c.type === 'unit' ? c.attack + c.currentHp : 2 + c.cost }))
      .filter(x => x.c.cost <= cpu.cost)
      .sort((a, b) => b.score - a.score);
    if (playable.length) {
      playCard('cpu', playable[0].i);
      action = true;
    }
  }

  const attacks = cpu.board.filter(u => u.type === 'unit' && u.canAttack);
  for (const u of attacks) {
    const guard = state.game.player.board.find(x => x.type === 'unit' && x.keywords?.includes('guard'));
    if (guard) unitAttack('cpu', u.uid, guard.uid);
    else if (state.game.player.board.length) {
      const kill = state.game.player.board.find(t => t.type === 'unit' && t.currentHp <= u.attack);
      if (kill) unitAttack('cpu', u.uid, kill.uid);
      else unitAttack('cpu', u.uid, 'leader');
    } else unitAttack('cpu', u.uid, 'leader');
  }
  setTimeout(endTurn, 500);
}

function renderBattle() {
  const g = state.game;
  if (!g) return;
  el('status').innerHTML = `
  <div>ターン: ${g.turn} / 行動: ${g.active === 'player' ? 'あなた' : 'CPU'}</div>
  <div>コスト: ${g.player.cost}/${g.player.maxCost} | 覚醒: ${g.player.awaken}</div>
  <div>あなた HP ${g.player.hp} / 山札 ${g.player.deck.length} / 墓地 ${g.player.grave.length}</div>
  <div>CPU HP ${g.cpu.hp} / 山札 ${g.cpu.deck.length} / 墓地 ${g.cpu.grave.length}</div>`;

  renderBoard('playerBoard', 'player');
  renderBoard('cpuBoard', 'cpu');
  const hand = el('hand'); hand.innerHTML = '';
  g.player.hand.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `<h4>${c.name}</h4><div class='small'>${jpType(c.type)} / ${c.cost}</div><div class='small'>${c.type==='unit'?`${c.attack}/${c.currentHp}`:''}</div><div class='small'>${c.text || ''}</div>`;
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = '使用';
    b.disabled = g.active !== 'player' || c.cost > g.player.cost;
    b.onclick = () => playCard('player', i);
    d.appendChild(b);
    hand.appendChild(d);
  });

  el('endTurn').disabled = g.active !== 'player';
  el('awaken').disabled = g.active !== 'player' || !canAwaken('player');
}

function renderBoard(domId, side) {
  const wrap = el(domId); wrap.innerHTML = '';
  const enemy = side === 'player' ? 'cpu' : 'player';
  state.game[side].board.forEach(c => {
    const d = document.createElement('div');
    d.className = `unit ${c.canAttack ? 'ready' : ''}`;
    d.innerHTML = `<strong>${c.name}</strong><div class='small'>${jpType(c.type)}</div><div>${c.type==='unit'?`${c.attack}/${c.currentHp}`:'-'}</div><div class='small'>${(c.keywords||[]).join(',')}</div>`;
    if (side === 'player' && c.type === 'unit') {
      const b1 = document.createElement('button'); b1.className = 'btn'; b1.textContent = '顔攻撃';
      b1.disabled = state.game.active !== 'player' || !c.canAttack;
      b1.onclick = () => unitAttack('player', c.uid, 'leader');
      d.appendChild(b1);
      state.game[enemy].board.filter(x => x.type === 'unit').forEach(t => {
        const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = `→${t.name}`;
        bt.disabled = state.game.active !== 'player' || !c.canAttack;
        bt.onclick = () => unitAttack('player', c.uid, t.uid);
        d.appendChild(bt);
      });
      if (canAwaken('player')) {
        const aw = document.createElement('button'); aw.className = 'btn btn-primary'; aw.textContent = '覚醒';
        aw.onclick = () => awaken('player', c.uid);
        d.appendChild(aw);
      }
    }
    wrap.appendChild(d);
  });
}

function init() {
  const saved = JSON.parse(localStorage.getItem(DECK_KEY) || '[]');
  state.deck = Array.isArray(saved) ? saved.filter(id => pool.some(c => c.id === id)) : [];
  for (let i = 1; i <= 10; i++) {
    const op = document.createElement('option'); op.value = String(i); op.textContent = `コスト:${i}`;
    el('costFilter').appendChild(op);
  }
  ['search', 'costFilter', 'typeFilter'].forEach(id => el(id).addEventListener('input', renderDeckBuilder));
  el('saveDeck').onclick = () => { localStorage.setItem(DECK_KEY, JSON.stringify(state.deck)); alert('保存しました'); };
  el('startBattle').onclick = startBattle;
  el('endTurn').onclick = endTurn;
  el('restart').onclick = () => location.reload();
  el('autoBuild').onclick = () => {
    state.deck = [];
    const counts = {};
    while (state.deck.length < MAX_DECK) {
      const c = pool[Math.floor(Math.random() * pool.length)];
      counts[c.id] = (counts[c.id] || 0) + 1;
      if (counts[c.id] <= 3) state.deck.push(c.id);
    }
    renderDeckBuilder();
  };
  el('awaken').onclick = () => {
    const u = state.game?.player.board.find(x => x.type === 'unit');
    if (u) awaken('player', u.uid);
  };
  renderDeckBuilder();
}

init();
