const ic = (n, c) =>
  `<svg class="ic${c ? " " + c : ""}"><use href="#i-${n}"/></svg>`
let ST = {
  theme: null,
  alpha: 0.6,
  page: "hanoi",
  hn: 3,
  hs: 1,
  gs: 1,
  hstep: 0,
  dr: {},
  bs: { arr: "2, 5, 8, 12, 16, 23, 38, 56, 72, 91", t: "23", step: 0, sp: 1 },
  hl: { h: 3, step: 0, sp: 1 },
  names: {},
  ord: { ready: null },
  hideMine: false,
  corner: "squircle",
  accent: "blue",
  setOpen: false,
}
try {
  Object.assign(ST, JSON.parse(localStorage.getItem("rl_state") || "{}"))
} catch (e) {}
if (ST.cv !== 2) {
  ST.corner = "squircle"
  ST.cv = 2
}
const SAVED = JSON.parse(JSON.stringify(ST))
const persist = () => {
  try {
    localStorage.setItem("rl_state", JSON.stringify(ST))
  } catch (e) {}
}

const $ = (id) => document.getElementById(id),
  L = "ABC",
  RN = ["Source", "Temp", "Destination"],
  RC = ["S", "T", "D"]
let N,
  ev,
  nodes,
  I = 0,
  playing = false,
  tok = 0,
  speed = 1,
  disks = [],
  DH = 24
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* Mobile Menu logic */
const sideEl = $("side"),
  overlay = $("side-overlay")
let sideT
function sideSet(o) {
  clearTimeout(sideT)
  sideEl.classList.add("anim")
  overlay.classList.add("anim")
  sideEl.classList.toggle("open", o)
  overlay.classList.toggle("open", o)
  sideT = setTimeout(() => {
    sideEl.classList.remove("anim")
    overlay.classList.remove("anim")
  }, 350)
}
$("menuBtn").onclick = () => sideSet(true)
overlay.onclick = () => sideSet(false)
addEventListener("resize", () => {
  if (innerWidth > 800 && sideEl.classList.contains("open")) {
    sideEl.classList.remove("open")
    overlay.classList.remove("open")
  }
})

function build(n) {
  nodes = []
  ev = []
  const pegs = [[], [], []]
  for (let k = n; k >= 1; k--) pegs[0].push(k)
  const done = new Set(),
    stack = []
  let mc = 0
  const snap = (type, id, x = {}) =>
    ev.push({
      type,
      id,
      pegs: pegs.map((p) => p.slice()),
      stack: stack.slice(),
      done: new Set(done),
      ...x,
    })
  snap("start", -1)
  ;(function rec(k, s, t, d, par, dep) {
    const id = nodes.length
    nodes.push({ k, s, t, d, par, dep, x: 0 })
    stack.push(id)
    snap("call", id)
    if (k > 1) rec(k - 1, s, d, t, id, dep + 1)
    const disk = pegs[s].pop()
    pegs[d].push(disk)
    nodes[id].x = mc++
    snap("move", id, { disk, from: s, to: d })
    if (k > 1) rec(k - 1, t, s, d, id, dep + 1)
    stack.pop()
    done.add(id)
    snap("ret", id)
  })(n, 0, 1, 2, -1, 0)
}
const fn = (nd) => `hanoi(${nd.k}, ${L[nd.s]}, ${L[nd.t]}, ${L[nd.d]})`
const curNode = (e) =>
  e.stack.length ? nodes[e.stack[e.stack.length - 1]] : null
const roles = (nd) => (nd ? [nd.s, nd.t, nd.d] : null)
/* ---------- stage ---------- */
function mkDisks() {
  const st = $("stage")
  st.innerHTML = '<div class="base"></div>'
  disks = []
  for (let p = 0; p < 3; p++) {
    let e = document.createElement("div")
    e.className = "peg"
    e.id = "pg" + p
    st.appendChild(e)
    e = document.createElement("div")
    e.className = "role"
    e.id = "ro" + p
    st.appendChild(e)
    e = document.createElement("div")
    e.className = "sb"
    e.id = "sb" + p
    st.appendChild(e)
  }
  for (let k = 1; k <= N; k++) {
    const e = document.createElement("div")
    e.className = "disk"
    e.textContent = k
    e.style.backgroundColor = `hsl(${((k - 1) * 300) / Math.max(N, 1) + 200},62%,54%)`
    st.appendChild(e)
    disks[k] = e
  }
  place()
}
const W = () => $("stage").clientWidth,
  cx = (p) => (W() * (2 * p + 1)) / 6
const dw = (k) =>
  Math.min(
    W() / 3 - 14,
    38 + (k - 1) * ((W() / 3 - 14 - 38) / Math.max(N - 1, 1)),
  )
const H = () => $("stage").clientHeight
function pos(p, lv, k) {
  return [cx(p) - dw(k) / 2, H() - 16 - (lv + 1) * DH]
}
function tf(k, x, y) {
  disks[k].style.transform = `translate(${x}px,${y}px)`
}
function place() {
  const e = ev[I]
  for (let p = 0; p < 3; p++) {
    $("pg" + p).style.left = cx(p) + "px"
    $("ro" + p).style.left = cx(p) + "px"
  }
  DH = Math.max(12, Math.min(24, Math.floor((H() - 72) / Math.max(N, 1))))
  for (let k = 1; k <= N; k++) {
    disks[k].style.width = dw(k) + "px"
    disks[k].style.height = DH - 2 + "px"
    disks[k].style.fontSize = Math.min(12, DH - 8) + "px"
  }
  e.pegs.forEach((pg, p) =>
    pg.forEach((k, lv) => {
      if (disks[k].classList.contains("mv")) return
      disks[k].style.transition = "opacity .4s"
      const [x, y] = pos(p, lv, k)
      tf(k, x, y)
    }),
  )
}
/* fade disks outside current subproblem + dashed box around the subproblem's disks */
function focus(pegs, nd) {
  for (let k = 1; k <= N; k++)
    disks[k].classList.toggle("dim", !!nd && k > nd.k)
  for (let p = 0; p < 3; p++) {
    const b = $("sb" + p),
      pg = pegs[p],
      lv0 = nd ? pg.findIndex((k) => k <= nd.k) : -1
    if (lv0 < 0) {
      b.style.opacity = 0
      continue
    }
    const w = dw(pg[lv0]) + 16,
      yTop = pos(p, pg.length - 1, pg[pg.length - 1])[1] - 6,
      yBot = pos(p, lv0, pg[lv0])[1] + DH + 3
    b.style.opacity = 1
    b.style.left = cx(p) - w / 2 + "px"
    b.style.width = w + "px"
    b.style.top = yTop + "px"
    b.style.height = yBot - yTop + "px"
    b.innerHTML = `<i>n=${nd.k}</i>`
  }
  $("sub").innerHTML = nd
    ? `Subproblem <b>${fn(nd)}</b>: move the ${nd.k} smallest disk${nd.k > 1 ? "s" : ""} from <b>${L[nd.s]}</b> to <b>${L[nd.d]}</b> using <b>${L[nd.t]}</b>`
    : '<span style="color:var(--mut)">No active call</span>'
}
async function animMove(e, t) {
  const k = e.disk,
    el = disks[k],
    fromLv = ev[I - 1].pegs[e.from].length - 1,
    toLv = e.pegs[e.to].length - 1
  const P0 = () => pos(e.from, fromLv, k),
    P1 = () => pos(e.to, toLv, k),
    ty = 18,
    d = Math.max(90, 320 / speed)
  el.classList.add("mv")
  const go = async (f) => {
    const [x, y] = f()
    el.style.transition = `transform ${d}ms cubic-bezier(.45,.05,.3,1),opacity .4s`
    tf(k, x, y)
    await sleep(d)
    return t === tok
  }
  if (!(await go(() => [P0()[0], ty]))) return
  if (!(await go(() => [P1()[0], ty]))) return
  await go(P1)
  el.classList.remove("mv")
}
/* ---------- roles ---------- */
function showRoles(e, prev) {
  const cur = roles(curNode(e)),
    pr = roles(curNode(prev || ev[0]))
  for (let p = 0; p < 3; p++) {
    const el = $("ro" + p)
    let ri = cur ? cur.indexOf(p) : -1
    const was = el.dataset.r
    el.innerHTML =
      ri < 0
        ? '<b style="color:var(--mut)">' +
          L[p] +
          '</b><span style="background:var(--pend)">—</span>'
        : `<b>${L[p]}</b><span class="${RC[ri]}">${RN[ri]}</span>`
    if (was !== String(ri)) {
      el.classList.remove("flash")
      void el.offsetWidth
      el.classList.add("flash")
    }
    el.dataset.r = ri
  }
  $("rb").innerHTML = [0, 1, 2]
    .map((r) => {
      const a = pr ? L[pr[r]] : "—",
        b = cur ? L[cur[r]] : "—",
        ch = a !== b
      return `<div class="rc ${RC[r]}"><small>${RN[r]} (${RC[r]})</small><div>${a} ⟶ <span class="${ch ? "ch" : ""}">${b}</span></div></div>`
    })
    .join("")
}
/* ---------- tree ---------- */
const CW = 56,
  LH = 64
function mkTree() {
  const svg = $("tree"),
    w = Math.pow(2, N) * CW,
    h = N * LH + 56
  let s = ""
  svg.setAttribute("width", w)
  svg.setAttribute("height", h)
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`)
  const X = (nd) => nd.x * CW + CW / 2,
    Y = (nd) => nd.dep * LH + 30
  nodes.forEach((nd, i) => {
    if (nd.par >= 0) {
      const p = nodes[nd.par]
      s += `<path class="ed" id="ed${i}" d="M${X(p)} ${Y(p) + 19} C${X(p)} ${(Y(p) + Y(nd)) / 2},${X(nd)} ${(Y(p) + Y(nd)) / 2},${X(nd)} ${Y(nd) - 19}"/>`
    }
  })
  nodes.forEach((nd, i) => {
    s += `<g class="nd pen" id="nd${i}"><title>${fn(nd)}</title><rect x="${X(nd) - 24}" y="${Y(nd) - 19}" width="48" height="38" rx="10"/><text class="n" style="font-size:14px" x="${X(nd)}" y="${Y(nd) - 2}" text-anchor="middle">${nd.k}</text><text class="l" x="${X(nd)}" y="${Y(nd) + 12}" text-anchor="middle">${L[nd.s]}→${L[nd.d]}</text></g>`
  })
  svg.innerHTML = s
}
function showTree(e) {
  const t = curNode(e)
  nodes.forEach((nd, i) => {
    const g = $("nd" + i)
    let c = "pen"
    if (e.done.has(i)) c = "done"
    else if (e.stack.includes(i)) c = t === nd ? "act" : "rel"
    g.setAttribute("class", "nd " + c)
    const ed = $("ed" + i)
    if (ed)
      ed.setAttribute(
        "class",
        "ed " + (c === "done" ? "done" : c === "pen" ? "" : "rel"),
      )
  })
  if (t) {
    const b = $("treebox"),
      x = t.x * CW + CW / 2
    b.scrollTo({
      left: x - b.clientWidth / 2,
      top: t.dep * LH + 30 - b.clientHeight / 2,
    })
  }
}
/* ---------- stack + log ---------- */
function showStack(e) {
  $("stack").innerHTML =
    e.stack
      .map((id, j) => {
        const nd = nodes[id]
        const chips = [nd.s, nd.t, nd.d]
          .map((p, r) => `<span class="chip ${RC[r]}">${RC[r]}=${L[p]}</span>`)
          .join("")
        return `<div class="fr ${j === e.stack.length - 1 ? "top" : ""}" style="margin-left:${Math.min(j, 8) * 10}px"><span>${fn(nd)}</span><span class="chips">${chips}</span></div>`
      })
      .join("") || '<span style="color:var(--mut)">Stack is empty</span>'
}
function logHTML(k) {
  const e = ev[k]
  if (e.type === "start")
    return `<div class="lg" data-k="0"><span class="k">0</span>Start: ${N} disk${N > 1 ? "s" : ""} on peg A</div>`
  const nd = nodes[e.id],
    par = nd.par >= 0 ? nodes[nd.par] : null
  let m = ""
  if (e.type === "call") {
    const df = RC.map((c, r) => {
      const cur = [nd.s, nd.t, nd.d][r],
        pv = par ? [par.s, par.t, par.d][r] : null
      return `${RN[r]}: ${pv === null ? "" : L[pv] + "→"}<span class="${pv !== null && pv !== cur ? "df" : ""}">${L[cur]}</span>`
    }).join(", ")
    m = `<span class="tag c">CALL</span><code>${fn(nd)}</code><br>${df}`
  } else if (e.type === "move")
    m = `<span class="tag m">MOVE #${nd.x + 1}</span>Disk ${e.disk}: <b>${L[e.from]}</b> → <b>${L[e.to]}</b> <small>(inside ${fn(nd)})</small>`
  else
    m =
      `<span class="tag r">RETURN</span><code>${fn(nd)}</code>` +
      (par
        ? `<br>Back to parent: ${RC.map((c, r) => `${RN[r]} ${L[[nd.s, nd.t, nd.d][r]]}→<span class="df">${L[[par.s, par.t, par.d][r]]}</span>`).join(", ")}`
        : "")
  return `<div class="lg" data-k="${k}"><span class="k">${k}</span>${m}</div>`
}
function rebuildLog(k) {
  let h = ""
  for (let j = 0; j <= k; j++) h += logHTML(j)
  $("log").innerHTML = h
  markLog()
}
function markLog() {
  const l = $("log")
  const c = l.querySelector(".cur")
  if (c) c.classList.remove("cur")
  const t = l.lastElementChild
  if (t) {
    t.classList.add("cur")
    l.scrollTop = l.scrollHeight
  }
}
$("log").onclick = (e) => {
  const d = e.target.closest(".lg")
  if (d && !busy && !loop) jump(+d.dataset.k)
}
/* ---------- control ---------- */
function upd(prev, instant) {
  const e = ev[I]
  showRoles(e, prev)
  showTree(e)
  showStack(e)
  focus(!instant && e.type === "move" ? ev[I - 1].pegs : e.pegs, curNode(e))
  $("cnt").textContent =
    `Step ${I} / ${ev.length - 1} · Moves: ${ev.slice(0, I + 1).filter((x) => x.type === "move").length} / ${Math.pow(2, N) - 1}`
  $("pl").innerHTML = playing ? ic("pause") + " Pause" : ic("play") + " Play"
  ST.hstep = I
  ST.hn = N
  persist()
}
function jump(k) {
  tok++
  playing = false
  disks.forEach((d) => d && d.classList.remove("mv"))
  I = Math.max(0, Math.min(ev.length - 1, k))
  place()
  upd(ev[Math.max(0, I - 1)], true)
  rebuildLog(I)
}
let busy = false,
  loop = false,
  gPlay = false,
  hlPlay = false
function uiLock() {
  const lk = busy || loop || playing || gPlay || bPlay || hlPlay
  document.body.classList.toggle("locked", lk)
  document.querySelectorAll("button,input[type=number],#bArr").forEach((b) => {
    b.disabled =
      lk &&
      !(
        (b.id === "pl" && playing) ||
        (b.id === "bPl" && bPlay) ||
        (b.id === "gPl" && gPlay) ||
        (b.id === "hlPl" && hlPlay) ||
        b.classList.contains("keep")
      )
  })
}
async function step() {
  if (busy || I >= ev.length - 1) return false
  busy = true
  uiLock()
  const t = tok
  try {
    I++
    const e = ev[I]
    upd(ev[I - 1], false)
    $("log").insertAdjacentHTML("beforeend", logHTML(I))
    markLog()
    if (e.type === "move") {
      await animMove(e, t)
      if (t === tok) focus(e.pegs, curNode(e))
    } else await sleep(Math.max(60, 380 / speed))
  } finally {
    busy = false
    uiLock()
  }
  return true
}
async function play() {
  if (playing) {
    playing = false
    uiLock()
    return
  }
  if (busy || loop) return
  if (I >= ev.length - 1) jump(0)
  loop = true
  playing = true
  uiLock()
  upd(ev[Math.max(0, I - 1)], true)
  try {
    while (playing && I < ev.length - 1) {
      await step()
      if (!playing) break
      await sleep(100 / speed)
    }
  } finally {
    playing = false
    loop = false
    uiLock()
    upd(ev[Math.max(0, I - 1)], true)
  }
}
function init() {
  tok++
  playing = false
  let v = parseInt($("n").value) || 3
  v = Math.max(1, Math.min(7, v))
  $("n").value = v
  N = v
  build(N)
  I = 0
  mkDisks()
  mkTree()
  jump(0)
}
$("n").onchange = init
$("rs").onclick = init
$("pl").onclick = play
$("fw").onclick = () => {
  if (!busy && !loop) step()
}
$("bk").onclick = () => {
  if (!busy && !loop) jump(I - 1)
}
$("sp").oninput = (e) => {
  speed = +e.target.value
  ST.hs = speed
  persist()
}
new ResizeObserver(() => {
  if (!ev || !$("pg-hanoi").classList.contains("on")) return
  place()
  const e = ev[I]
  focus(busy && e.type === "move" ? ev[I - 1].pegs : e.pegs, curNode(e))
}).observe($("stage"))
init()

/* ================= Recursion Lab: generic tracer ================= */
const PRE = {
  fact: {
    t: "Factorial",
    d: "n! = n × (n−1)!, with 0! = 1! = 1. One call per level: the stack grows to depth n, then the results multiply on the way back. Time O(n), stack depth O(n). Edit the call (e.g. fact(7)) and press Enter, or press Reset to restart.",
    code: "function fact(n) {\n  if (n <= 1) return 1;      // base case\n  return n * fact(n - 1);    // recursive case\n}",
    call: "fact(5)",
  },
  fib: {
    t: "Fibonacci",
    d: "fib(n) = fib(n−1) + fib(n−2), with fib(0)=0 and fib(1)=1. Every call branches in two, so the same subproblems repeat (see Call statistics). Time O(2ⁿ), depth O(n). Edit the call (e.g. fib(6)) and press Enter, or press Reset to restart.",
    code: "function fib(n) {\n  if (n < 2) return n;                 // base cases\n  return fib(n - 1) + fib(n - 2);      // two recursive calls\n}",
    call: "fib(5)",
  },
  new: {
    t: "New algorithm",
    d: "Write any JavaScript code (helpers, memo tables and other functions are fine). The function named in your Call expression, e.g. power(2, 5), is the one that gets traced. Limit: 300 calls. Every successful run is saved in the sidebar.",
    code: "function power(b, e) {\n  if (e === 0) return 1;\n  return b * power(b, e - 1);\n}",
    call: "power(2, 5)",
  },
}
let mine = [],
  curP = "hanoi",
  gN = [],
  gE = [],
  gI = 0,
  gTok = 0,
  gSpeed = 1,
  gName = "",
  gRes
try {
  mine = JSON.parse(localStorage.getItem("rl_mine") || "[]")
} catch (e) {}
mine.forEach((m, i) => {
  if (m.id === undefined) m.id = i
})
const nid = () => mine.reduce((a, m) => Math.max(a, m.id), -1) + 1,
  findM = (id) => mine.find((m) => m.id === id)
const saveMine = () => {
  try {
    localStorage.setItem("rl_mine", JSON.stringify(mine))
  } catch (e) {}
}
const esc = (s) =>
  String(s).replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
  )
const fmt = (v) => {
  let s
  try {
    s =
      typeof v === "string"
        ? JSON.stringify(v)
        : typeof v === "object"
          ? JSON.stringify(v)
          : String(v)
  } catch (e) {
    s = String(v)
  }
  if (s === undefined) s = "undefined"
  return s.length > 200 ? s.slice(0, 199) + "…" : s
}
const lab = (n) => gName + "(" + n.args.map(fmt).join(", ") + ")"
const RD = [
  { p: "hanoi", i: "hanoi", n: "Tower of Hanoi" },
  { p: "fact", i: "fact", n: "Factorial" },
  { p: "fib", i: "fib", n: "Fibonacci" },
  { p: "bsearch", i: "search", n: "Binary Search" },
]
const CV = [{ p: "hilbert", i: "curve", n: "Hilbert Curve" }]
const nameOf = (p) =>
  ST.names[p] ||
  (p[0] === "m"
    ? (findM(+p.slice(1)) || {}).name
    : ([...RD, ...CV].find((r) => r.p === p) || {}).n) ||
  (PRE[p] || {}).t ||
  ""
const readyList = () => {
  const o = ST.ord.ready || []
  return [
    ...o.map((p) => RD.find((r) => r.p === p)).filter(Boolean),
    ...RD.filter((r) => !o.includes(r.p)),
  ]
}
const sItem = (p, ico, x = "") =>
  `<a data-p="${p}"><b class="grip" title="Drag to reorder">${ic("grip")}</b>${ic(ico, "ic-lg")}<span>${esc(nameOf(p))}</span>${x}</a>`
function side() {
  $("ready").innerHTML = readyList()
    .map((r) => sItem(r.p, r.i))
    .join("")
  $("mine").innerHTML = mine
    .map((m) =>
      sItem("m" + m.id, "fn", `<b class="x" data-x="${m.id}">${ic("x")}</b>`),
    )
    .join("")
  $("curves").innerHTML = CV.map((r) => sItem(r.p, r.i)).join("")
  $("tHil").textContent = nameOf("hilbert")
  $("mine").style.display = ST.hideMine ? "none" : ""
  $("mineBar").style.display = mine.length ? "" : "none"
  $("mHide").style.display = ST.hideMine ? "none" : ""
  $("mShow").style.display = ST.hideMine ? "" : "none"
  $("mShow").textContent = "Show all (" + mine.length + ")"
  $("tH").textContent = nameOf("hanoi")
  $("tB").textContent = nameOf("bsearch")
  document
    .querySelectorAll("#side a")
    .forEach((a) => a.classList.toggle("on", a.dataset.p === curP))
}
const sLocked = () => busy || loop || playing || gPlay || bPlay || hlPlay
$("side").onclick = (e) => {
  if (sLocked()) return
  if (e.target.closest(".grip,input")) return
  const bt = e.target.closest("#mHide,#mShow,#mDel")
  if (bt) {
    if (bt.id === "mDel") {
      if (!mine.length || !confirm("Delete all saved functions?")) return
      mine.forEach((m) => {
        delete ST.dr["m" + m.id]
        delete ST.names["m" + m.id]
      })
      mine = []
      saveMine()
      persist()
      if (curP[0] === "m") showPage("new")
      else side()
    } else {
      ST.hideMine = bt.id === "mHide"
      persist()
      side()
    }
    return
  }
  const x = e.target.closest(".x")
  if (x) {
    const id = +x.dataset.x
    mine = mine.filter((m) => m.id !== id)
    delete ST.dr["m" + id]
    delete ST.names["m" + id]
    saveMine()
    persist()
    e.stopPropagation()
    if (curP === "m" + id) showPage("new")
    else side()
    return
  }
  const a = e.target.closest("a")
  if (a) {
    if (a.dataset.p !== curP || curP === "new") showPage(a.dataset.p)
    if (window.innerWidth <= 800) sideSet(false)
  }
}
/* drag to reorder (pointer events: works with mouse and touch, via the grip handle) */
let drg = null
$("side").addEventListener("pointerdown", (e) => {
  const g = e.target.closest(".grip")
  if (!g || sLocked()) return
  const a = g.closest("a")
  drg = { a, c: a.parentElement }
  a.classList.add("drag")
  g.setPointerCapture(e.pointerId)
  e.preventDefault()
})
$("side").addEventListener("pointermove", (e) => {
  if (!drg) return
  const { a, c } = drg
  let b = null
  for (const t of c.children) {
    if (t === a) continue
    const r = t.getBoundingClientRect()
    if (e.clientY < r.top + r.height / 2) {
      b = t
      break
    }
  }
  if (a.nextElementSibling !== b) c.insertBefore(a, b)
})
const dEnd = () => {
  if (!drg) return
  const { a, c } = drg
  drg = null
  a.classList.remove("drag")
  const ids = [...c.children].map((t) => t.dataset.p)
  if (c.id === "mine") {
    mine.sort((x, y) => ids.indexOf("m" + x.id) - ids.indexOf("m" + y.id))
    saveMine()
  } else {
    ST.ord.ready = ids
    persist()
  }
  side()
}
$("side").addEventListener("pointerup", dEnd)
$("side").addEventListener("pointercancel", dEnd)
/* double click to rename */
$("side").addEventListener("dblclick", (e) => {
  const a = e.target.closest("a")
  if (
    !a ||
    a.dataset.p === "new" ||
    sLocked() ||
    e.target.closest(".x,.grip,input")
  )
    return
  const p = a.dataset.p,
    sp = a.querySelector("span"),
    inp = document.createElement("input")
  inp.className = "ren"
  inp.maxLength = 30
  inp.value = nameOf(p)
  sp.replaceWith(inp)
  inp.focus()
  inp.select()
  let fin = false
  const done = (ok) => {
    if (fin) return
    fin = true
    if (ok) {
      const v = inp.value.trim()
      if (v) ST.names[p] = v
      else delete ST.names[p]
      persist()
    }
    side()
    if (curP === p && p !== "hanoi" && p !== "bsearch" && p !== "hilbert")
      setTitle(
        nameOf(p),
        p[0] === "m"
          ? "fn"
          : p === "fact"
            ? "fact"
            : p === "fib"
              ? "fib"
              : "fn",
      )
  }
  inp.onkeydown = (k) => {
    k.stopPropagation()
    if (k.key === "Enter") done(true)
    else if (k.key === "Escape") done(false)
  }
  inp.onblur = () => done(true)
  inp.onclick = (k) => k.stopPropagation()
})
const setTitle = (t, i) => {
  $("gTitle").innerHTML = ic(i, "ic-lg") + " " + esc(t)
}
const dsave = () => {
  ST.dr[curP] = { code: $("gCode").value, call: $("gCall").value, step: gI }
  persist()
}
function showPage(p, first) {
  curP = p
  tok++
  playing = false
  gTok++
  gPlay = false
  bPlay = false
  hlPlay = false
  cancelAnimationFrame(hRaf)
  const h = p === "hanoi",
    bs = p === "bsearch",
    hil = p === "hilbert"
  $("pg-hanoi").classList.toggle("on", h)
  $("pg-bs").classList.toggle("on", bs)
  $("pg-hil").classList.toggle("on", hil)
  $("pg-gen").classList.toggle("on", !h && !bs && !hil)
  ST.page = p
  persist()
  if (bs) {
    bInit(first ? SAVED.bs.step : ST.bs.step)
  } else if (hil) {
    hlInit(first ? SAVED.hl.step : ST.hl.step, true)
  } else if (h) {
    const k = first ? SAVED.hstep : ST.hstep
    init()
    jump(k)
  } else {
    const pr = p[0] === "m" ? findM(+p.slice(1)) : PRE[p],
      d = p === "new" && !first ? null : ST.dr[p]
    const rdy = !!PRE[p] && p !== "new"
    $("gRun").innerHTML = ic("refresh") + (rdy ? " Reset" : " Run")
    $("gCode").readOnly = rdy
    $("gSave").style.display = rdy ? "none" : ""
    setTitle(
      nameOf(p),
      p[0] === "m" ? "fn" : p === "fact" ? "fact" : p === "fib" ? "fib" : "fn",
    )
    $("gDesc").textContent =
      pr.d ||
      "Your saved algorithm. Edit the code or the call and press Run to update it."
    $("gCode").value = d && !rdy ? d.code : pr.code
    $("gCall").value = d ? d.call : pr.call
    gRun()
    if (d && d.step) gJump(d.step)
  }
  side()
}
function gTrace(code, call) {
  const decl = (n) =>
    new RegExp(
      "(?:function\\s*\\*?\\s+|(?:const|let|var)\\s+)" +
        n.replace(/\$/g, "\\$") +
        "\\b",
    ).test(code)
  const cm = call.match(/([A-Za-z_$][\w$]*)\s*\(/)
  let name = cm && decl(cm[1]) ? cm[1] : null
  if (!name) {
    const m = code.match(
      /(?:function\s*\*?\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)/,
    )
    if (!m)
      throw new Error(
        "Could not find a function name. Use: function name(...) {...}",
      )
    name = m[1]
  }
  code = code.replace(
    new RegExp("\\b(?:const|let)(\\s+" + name.replace(/\$/g, "\\$") + "\\s*=)"),
    "var$1",
  )
  const nodes = [],
    evs = [{ t: "start", stack: [] }],
    st = []
  const wrap = (f) =>
    function (...a) {
      if (nodes.length >= 300)
        throw new Error("Too many calls (limit 300). Try a smaller input.")
      const id = nodes.length,
        nd = {
          id,
          args: a,
          par: st.length ? st[st.length - 1] : -1,
          ch: [],
          dep: st.length,
          ret: undefined,
          x: 0,
        }
      nodes.push(nd)
      if (nd.par >= 0) nodes[nd.par].ch.push(id)
      st.push(id)
      evs.push({ t: "call", id, stack: st.slice() })
      const r = f.apply(this, a)
      nd.ret = r
      st.pop()
      evs.push({ t: "ret", id, stack: st.slice() })
      return r
    }
  let fnc, res
  try {
    fnc = new Function(
      "__w",
      code + "\n" + name + " = __w(" + name + ");\nreturn " + name + ";",
    )(wrap)
    res = new Function(name, "return (" + call + ")")(fnc)
  } catch (e) {
    throw new Error(e.message)
  }
  if (!nodes.length)
    throw new Error("The call expression did not invoke " + name + "().")
  return { nodes, evs, name, res }
}
function gRun(save) {
  gTok++
  gPlay = false
  $("gErr").textContent = ""
  try {
    const r = gTrace($("gCode").value, $("gCall").value)
    gN = r.nodes
    gE = r.evs
    gName = r.name
    gRes = r.res
  } catch (err) {
    $("gErr").textContent = "⚠ " + err.message
    return false
  }
  if (save === true && (curP === "new" || curP[0] === "m")) {
    if (curP === "new") {
      const id = nid()
      mine.push({
        id,
        name: gName,
        code: $("gCode").value,
        call: $("gCall").value,
      })
      setSaved(id)
    } else {
      const m = findM(+curP.slice(1))
      if (m) {
        m.name = gName
        m.code = $("gCode").value
        m.call = $("gCall").value
        setTitle(nameOf(curP), "fn")
      }
    }
    saveMine()
    side()
  }
  gMk(gLay())
  gJump(0)
  return true
}
function setSaved(id) {
  curP = "m" + id
  setTitle(gName, "fn")
  $("gDesc").textContent =
    "Your saved algorithm. Edit the code or the call and press Run to update it."
  ST.page = curP
  persist()
}
function gSaveNew() {
  if (!gRun(false)) return
  const id = nid()
  mine.push({ id, name: gName, code: $("gCode").value, call: $("gCall").value })
  setSaved(id)
  saveMine()
  side()
}
const GH = 78,
  cvx = document.createElement("canvas").getContext("2d")
const tw = (t, f) => {
  cvx.font = f
  return cvx.measureText(t).width
}
const fmtR = (v) => {
  const s = fmt(v)
  return s.length > 80 ? s.slice(0, 79) + "…" : s
}
/* variable-width tidy layout: every node is as wide as its full label */
function gLay() {
  gN.forEach((n) => {
    n.lb = n.args.map(fmt).join(", ")
    n.rv = fmtR(n.ret)
    n.w = Math.max(
      44,
      tw(n.lb, "600 12px ui-monospace,Consolas,monospace") + 24,
    )
    n.rw = tw("= " + n.rv, "700 11px ui-monospace,Consolas,monospace")
  })
  const own = (n) => n.w + 2 * (n.rw + 12)
  const S = (id) => {
    const n = gN[id]
    let k = 0
    n.ch.forEach((c) => (k += S(c)))
    return (n.sw = Math.max(own(n), k))
  }
  const P = (id, left) => {
    const n = gN[id],
      kd = n.ch
    if (!kd.length) {
      n.cx = left + n.sw / 2
      return
    }
    let tot = 0
    kd.forEach((c) => (tot += gN[c].sw))
    let x = left + (n.sw - tot) / 2
    kd.forEach((c) => {
      P(c, x)
      x += gN[c].sw
    })
    const mid = (gN[kd[0]].cx + gN[kd[kd.length - 1]].cx) / 2,
      hw = own(n) / 2
    n.cx = Math.min(Math.max(mid, left + hw), left + n.sw - hw)
  }
  let x = 0
  gN.filter((n) => n.par < 0).forEach((r) => {
    S(r.id)
    P(r.id, x)
    x += r.sw
  })
  return x
}
function gMk(total) {
  const dmax = Math.max(...gN.map((n) => n.dep)),
    w = total + 24,
    h = (dmax + 1) * GH + 34,
    X = (n) => n.cx + 12,
    Y = (n) => n.dep * GH + 28
  let s = ""
  const svg = $("gTree")
  svg.setAttribute("width", w)
  svg.setAttribute("height", h)
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`)
  gN.forEach((n) => {
    if (n.par >= 0) {
      const p = gN[n.par]
      s += `<path class="ed" id="ge${n.id}" d="M${X(p)} ${Y(p) + 15} C${X(p)} ${(Y(p) + Y(n)) / 2},${X(n)} ${(Y(p) + Y(n)) / 2},${X(n)} ${Y(n) - 15}"/>`
    }
  })
  gN.forEach((n) => {
    s += `<g class="nd pen" id="gn${n.id}"><title>${esc(lab(n))}</title><rect x="${X(n) - n.w / 2}" y="${Y(n) - 15}" width="${n.w}" height="30" rx="10"/><text class="n" style="font-size:12px" x="${X(n)}" y="${Y(n) + 4.5}" text-anchor="middle">${esc(n.lb)}</text><text class="rv" id="gv${n.id}" x="${X(n) + n.w / 2 + 6}" y="${Y(n) + 4}" text-anchor="start"></text></g>`
  })
  svg.innerHTML = s
}
function gLg(k) {
  const e = gE[k]
  if (e.t === "start")
    return `<div class="lg" data-k="0"><span class="k">0</span>Start: ${esc($("gCall").value)}</div>`
  const n = gN[e.id]
  return (
    `<div class="lg" data-k="${k}"><span class="k">${k}</span>` +
    (e.t === "call"
      ? `<span class="tag c">CALL</span><code>${esc(lab(n))}</code> <small>depth ${n.dep + 1}</small>`
      : `<span class="tag r">RETURN</span><code>${esc(lab(n))}</code> = <b>${esc(fmt(n.ret))}</b>`) +
    "</div>"
  )
}
function gMark() {
  const l = $("gLog")
  const c = l.querySelector(".cur")
  if (c) c.classList.remove("cur")
  const t = l.lastElementChild
  if (t) {
    t.classList.add("cur")
    l.scrollTop = l.scrollHeight
  }
}
function gShow() {
  const e = gE[gI],
    done = new Set(),
    cnt = {}
  let calls = 0,
    md = 0
  for (let j = 1; j <= gI; j++) {
    const x = gE[j]
    if (x.t === "ret") done.add(x.id)
    else {
      calls++
      const n = gN[x.id]
      md = Math.max(md, n.dep + 1)
      const k = lab(n)
      cnt[k] = (cnt[k] || 0) + 1
    }
  }
  const top = e.stack.length ? e.stack[e.stack.length - 1] : -1
  gN.forEach((n) => {
    let c = "pen"
    if (done.has(n.id)) c = "done"
    else if (e.stack.includes(n.id)) c = n.id === top ? "act" : "rel"
    if (e.t === "ret" && e.id === n.id) c += " pop"
    $("gn" + n.id).setAttribute("class", "nd " + c)
    $("gv" + n.id).textContent = done.has(n.id) ? "= " + n.rv : ""
    const ed = $("ge" + n.id)
    if (ed)
      ed.setAttribute(
        "class",
        "ed " + (done.has(n.id) ? "done" : c === "pen" ? "" : "rel"),
      )
  })
  const fo = top >= 0 ? top : e.id !== undefined ? e.id : -1
  if (fo >= 0) {
    const n = gN[fo],
      b = $("gTB")
    b.scrollTo({
      left: n.cx + 12 - b.clientWidth / 2,
      top: n.dep * GH - b.clientHeight / 2 + 60,
    })
  }
  let info
  if (e.t === "start")
    info =
      "Ready. Press ▶ Play or Step to trace <b>" +
      esc($("gCall").value) +
      "</b>."
  else {
    const n = gN[e.id],
      p = n.par >= 0 ? gN[n.par] : null
    info =
      e.t === "call"
        ? `<b>CALL</b> ${esc(lab(n))} ${p ? "made by " + esc(lab(p)) : "(top-level call)"} · depth ${n.dep + 1}`
        : `<b>RETURN</b> ${esc(lab(n))} = <b>${esc(fmt(n.ret))}</b> ${p ? "→ handed back to " + esc(lab(p)) : "→ result of the top-level call"}`
  }
  if (gI === gE.length - 1) info += ` · <b>Final result: ${esc(fmt(gRes))}</b>`
  $("gInfo").innerHTML = info
  $("gStack").innerHTML =
    e.stack
      .map(
        (id, j) =>
          `<div class="fr ${j === e.stack.length - 1 ? "top" : ""}" style="margin-left:${Math.min(j, 10) * 10}px"><span>${esc(lab(gN[id]))}</span><span class="chips"><span class="chip" style="background:${j === e.stack.length - 1 ? "var(--act);color:#111" : "var(--rel)"}">${j === e.stack.length - 1 ? "running" : "waiting"}</span></span></div>`,
      )
      .join("") || '<span style="color:var(--mut)">Stack is empty</span>'
  const rows = Object.entries(cnt)
    .sort((a, b) => b[1] - a[1])
    .filter((r) => r[1] > 1)
    .slice(0, 10)
  $("gStat").innerHTML =
    `<div>Calls so far: <b>${calls}</b> / ${gN.length} · max depth: <b>${md}</b> · finished: <b>${done.size}</b></div>` +
    (rows.length
      ? `<table class="st">${rows.map((r) => `<tr><td>${esc(r[0])}</td><td><span class="rep">×${r[1]}</span></td></tr>`).join("")}</table>`
      : '<div style="color:var(--mut);margin-top:6px">No repeated calls yet.</div>')
  $("gCnt").textContent = `Step ${gI} / ${gE.length - 1}`
  $("gPl").innerHTML = gPlay ? ic("pause") + " Pause" : ic("play") + " Play"
  dsave()
}
function gJump(k) {
  gTok++
  gPlay = false
  gI = Math.max(0, Math.min(gE.length - 1, k))
  gShow()
  let h = ""
  for (let j = 0; j <= gI; j++) h += gLg(j)
  $("gLog").innerHTML = h
  gMark()
}
function gNext() {
  if (gI >= gE.length - 1) return false
  gI++
  gShow()
  $("gLog").insertAdjacentHTML("beforeend", gLg(gI))
  gMark()
  return true
}
async function gStep() {
  if (busy || gI >= gE.length - 1) return false
  busy = true
  uiLock()
  try {
    gNext()
    await sleep(Math.max(300, 560 / gSpeed))
  } finally {
    busy = false
    uiLock()
  }
  return true
}
async function gPlayF() {
  if (gPlay) {
    gPlay = false
    uiLock()
    return
  }
  if (busy || loop || !gE.length) return
  if (gI >= gE.length - 1) gJump(0)
  loop = true
  gPlay = true
  uiLock()
  gShow()
  try {
    while (gPlay && gI < gE.length - 1) await gStep()
  } finally {
    gPlay = false
    loop = false
    uiLock()
    gShow()
  }
}
$("gRun").onclick = () => gRun(true)
$("gSave").onclick = () => {
  if (!busy && !loop) gSaveNew()
}
$("gPl").onclick = gPlayF
$("gFw").onclick = () => {
  if (!busy && !loop) gStep()
}
$("gBk").onclick = () => {
  if (!busy && !loop) gJump(gI - 1)
}
$("gSpd").oninput = (e) => {
  gSpeed = +e.target.value
  ST.gs = gSpeed
  persist()
}
$("gCode").oninput = $("gCall").oninput = dsave
$("gLog").onclick = (e) => {
  const d = e.target.closest(".lg")
  if (d && !busy && !loop) gJump(+d.dataset.k)
}
$("gCall").onchange = () => {
  if ((curP === "fact" || curP === "fib") && !busy && !loop && !gPlay) gRun()
}
$("gCode").onkeydown = (e) => {
  if (e.key === "Tab") {
    e.preventDefault()
    document.execCommand("insertText", false, "  ")
  }
}

/* ===== Binary Search ===== */
let bA = [],
  bT = 0,
  bN = [],
  bE = [],
  bI = 0,
  bRes = -1,
  bPlay = false,
  bSpeed = 1
const bl = (n) => `bs(${n.lo}, ${n.hi})`,
  bTop = (e) => (e.stack.length ? bN[e.stack[e.stack.length - 1]] : null),
  BW = 92,
  BLH = 70,
  BSH = 86
function bBuild() {
  bN = []
  bE = []
  const st = [],
    done = new Set()
  const snap = (type, id) =>
    bE.push({ type, id, stack: st.slice(), done: new Set(done) })
  snap("start", -1)
  const rec = (lo, hi, par, dep) => {
    const id = bN.length,
      n = { id, lo, hi, par, dep, mid: -1, res: -1, act: "empty" }
    bN.push(n)
    st.push(id)
    snap("call", id)
    if (lo <= hi) {
      n.mid = (lo + hi) >> 1
      const v = bA[n.mid]
      if (v === bT) {
        n.act = "found"
        n.res = n.mid
        snap("cmp", id)
      } else {
        n.act = v < bT ? "right" : "left"
        snap("cmp", id)
        n.res =
          v < bT
            ? rec(n.mid + 1, hi, id, dep + 1)
            : rec(lo, n.mid - 1, id, dep + 1)
      }
    } else snap("cmp", id)
    st.pop()
    done.add(id)
    snap("ret", id)
    return n.res
  }
  bRes = rec(0, bA.length - 1, -1, 0)
}
function bInit(k) {
  const nums = $("bArr")
      .value.split(/[\s,;]+/)
      .filter(Boolean)
      .map(Number),
    t = parseFloat($("bTgt").value)
  const err =
    !nums.length || nums.some((x) => !isFinite(x))
      ? "Enter numbers separated by commas."
      : nums.length > 16
        ? "Maximum 16 numbers."
        : isNaN(t)
          ? "Enter a numeric target."
          : ""
  $("bErr").textContent = err ? "⚠ " + err : ""
  if (err) return
  bA = nums.sort((a, b) => a - b)
  bT = t
  $("bArr").value = bA.join(", ")
  bBuild()
  bMk()
  bJump(k || 0)
}
function bMk() {
  $("bCells").innerHTML = bA
    .map(
      (v, i) =>
        `<div class="bcw"><div class="bp" id="bp${i}"></div><div class="bc" id="bc${i}">${v}</div><div class="bx">${i}</div></div>`,
    )
    .join("")
  const raw = []
  bN.forEach(
    (n) =>
      (raw[n.id] =
        n.par < 0 ? 0 : raw[n.par] + (bN[n.par].act === "left" ? -BSH : BSH)),
  )
  const mn = Math.min(...raw),
    pad = BW / 2 + 14,
    w = Math.max(...raw) - mn + pad * 2 + 50,
    h = (Math.max(...bN.map((n) => n.dep)) + 1) * BLH + 30
  bN.forEach((n) => {
    n.cx = raw[n.id] - mn + pad
    n.cy = n.dep * BLH + 30
  })
  let s = ""
  bN.forEach((n) => {
    if (n.par >= 0) {
      const p = bN[n.par],
        m = (p.cy + n.cy) / 2
      s += `<path class="ed" id="be${n.id}" d="M${p.cx} ${p.cy + 19} C${p.cx} ${m},${n.cx} ${m},${n.cx} ${n.cy - 19}"/>`
    }
  })
  bN.forEach((n) => {
    s += `<g class="nd pen" id="bn${n.id}"><rect x="${n.cx - BW / 2}" y="${n.cy - 19}" width="${BW}" height="38" rx="10"/><text class="n" style="font-size:13px" x="${n.cx}" y="${n.cy - 2}" text-anchor="middle">${bl(n)}</text><text class="l" x="${n.cx}" y="${n.cy + 12}" text-anchor="middle">${n.mid < 0 ? "empty" : "mid=" + n.mid}</text><text class="rv" id="bv${n.id}" x="${n.cx + BW / 2 + 6}" y="${n.cy + 4}" text-anchor="start"></text></g>`
  })
  const svg = $("bTree")
  svg.setAttribute("width", w)
  svg.setAttribute("height", h)
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`)
  svg.innerHTML = s
}
const bCmp = (n) =>
  n.act === "empty"
    ? "lo &gt; hi → empty range → return <b>-1</b>"
    : `mid = ${n.mid}: a[${n.mid}] = <b>${bA[n.mid]}</b> ${n.act === "found" ? "= " + bT + " → <b>found</b>" : n.act === "right" ? "&lt; " + bT + " → go right (lo = " + (n.mid + 1) + ")" : "&gt; " + bT + " → go left (hi = " + (n.mid - 1) + ")"}`
function bLg(k) {
  const e = bE[k]
  if (e.type === "start")
    return `<div class="lg" data-k="0"><span class="k">0</span>Start: find <b>${bT}</b> in [${bA.join(", ")}]</div>`
  const n = bN[e.id]
  return (
    `<div class="lg" data-k="${k}"><span class="k">${k}</span>` +
    (e.type === "call"
      ? `<span class="tag c">CALL</span><code>${bl(n)}</code> <small>depth ${n.dep + 1}</small>`
      : e.type === "cmp"
        ? `<span class="tag m">COMPARE</span>${bCmp(n)}`
        : `<span class="tag r">RETURN</span><code>${bl(n)}</code> = <b>${n.res}</b>`) +
    "</div>"
  )
}
function bShow() {
  const e = bE[bI],
    c = bTop(e),
    sm = !!c && e.type !== "call" && c.mid >= 0
  let hit = -1
  for (let j = 1; j <= bI; j++) {
    const x = bE[j]
    if (x.type === "cmp" && bN[x.id].act === "found") hit = bN[x.id].mid
  }
  bA.forEach((v, i) => {
    const inR = c ? i >= c.lo && i <= c.hi : bI === 0 || i === hit
    $("bc" + i).className =
      "bc" +
      (inR ? "" : " dim") +
      (sm && i === c.mid ? " mid" : "") +
      (i === hit ? " hit" : "")
    $("bp" + i).innerHTML = c
      ? (i === c.lo ? '<b class="S">L</b>' : "") +
        (sm && i === c.mid ? '<b class="T">M</b>' : "") +
        (i === c.hi ? '<b class="D">H</b>' : "")
      : ""
    if (c) {
      const el = $("bc" + i)
      if (inR && i === c.lo) el.classList.add("pL")
      if (inR && i === c.hi) el.classList.add("pH")
    }
  })
  bN.forEach((n) => {
    const d = e.done.has(n.id)
    let k = "pen"
    if (d) k = "done"
    else if (e.stack.includes(n.id)) k = n === c ? "act" : "rel"
    $("bn" + n.id).setAttribute("class", "nd " + k)
    $("bv" + n.id).textContent = d ? "= " + n.res : ""
    const ed = $("be" + n.id)
    if (ed)
      ed.setAttribute("class", "ed " + (d ? "done" : k === "pen" ? "" : "rel"))
  })
  const n = e.id >= 0 ? bN[e.id] : null,
    fo = c || n
  if (fo) {
    const b = $("bTB")
    b.scrollTo({
      left: fo.cx - b.clientWidth / 2,
      top: fo.cy - b.clientHeight / 2,
    })
  }
  let info =
    e.type === "start"
      ? `Find <b>${bT}</b> in the sorted array. Press ▶ Play or Step.`
      : e.type === "call"
        ? `<b>CALL</b> ${bl(n)} · range [${n.lo}..${n.hi}] · depth ${n.dep + 1}`
        : e.type === "cmp"
          ? `<b>COMPARE</b> ${bCmp(n)}`
          : `<b>RETURN</b> ${bl(n)} = <b>${n.res}</b>`
  if (bI === bE.length - 1)
    info +=
      bRes >= 0
        ? ` · <b>Found ${bT} at index ${bRes}</b>`
        : ` · <b>${bT} is not in the array</b>`
  $("bInfo").innerHTML = info
  const pe = bE[Math.max(0, bI - 1)],
    pv = bTop(pe),
    psm = !!pv && pe.type !== "call" && pv.mid >= 0,
    v = (x, m, k) => (x && (k !== "mid" || m) ? x[k] : "—")
  $("bRb").innerHTML = [
    ["low", "S", "lo"],
    ["mid", "T", "mid"],
    ["high", "D", "hi"],
  ]
    .map(([l, cl, k]) => {
      const a = v(pv, psm, k),
        b = v(c, sm, k)
      return `<div class="rc ${cl}"><small>${l}</small><div>${a} ⟶ <span class="${a !== b ? "ch" : ""}">${b}</span></div></div>`
    })
    .join("")
  const s =
    e.stack
      .map((id, j) => {
        const x = bN[id],
          top = j === e.stack.length - 1,
          m = x.mid >= 0 && !(top && e.type === "call")
        return `<div class="fr ${top ? "top" : ""}" style="margin-left:${Math.min(j, 8) * 10}px"><span>${bl(x)}</span><span class="chips"><span class="chip S">lo=${x.lo}</span>${m ? `<span class="chip T">mid=${x.mid}</span>` : ""}<span class="chip D">hi=${x.hi}</span></span></div>`
      })
      .join("") || '<span style="color:var(--mut)">Stack is empty</span>'
  const el = $("bStack")
  if (el.dataset.h !== s) {
    el.dataset.h = s
    el.innerHTML = s
    el.scrollTop = el.scrollHeight
  }
  $("bCnt").textContent = `Step ${bI} / ${bE.length - 1}`
  $("bPl").innerHTML = bPlay ? ic("pause") + " Pause" : ic("play") + " Play"
  ST.bs = { arr: $("bArr").value, t: $("bTgt").value, step: bI, sp: bSpeed }
  persist()
}
function bMark() {
  const l = $("bLog"),
    c = l.querySelector(".cur")
  if (c) c.classList.remove("cur")
  const t = l.lastElementChild
  if (t) {
    t.classList.add("cur")
    l.scrollTop = l.scrollHeight
  }
}
function bJump(k) {
  bPlay = false
  bI = Math.max(0, Math.min(bE.length - 1, k))
  bShow()
  let h = ""
  for (let j = 0; j <= bI; j++) h += bLg(j)
  $("bLog").innerHTML = h
  bMark()
}
async function bStep() {
  if (busy || bI >= bE.length - 1) return false
  busy = true
  uiLock()
  try {
    bI++
    bShow()
    $("bLog").insertAdjacentHTML("beforeend", bLg(bI))
    bMark()
    await sleep(Math.max(250, 700 / bSpeed))
  } finally {
    busy = false
    uiLock()
  }
  return true
}
async function bPlayF() {
  if (bPlay) {
    bPlay = false
    uiLock()
    return
  }
  if (busy || loop || !bE.length) return
  if (bI >= bE.length - 1) bJump(0)
  loop = true
  bPlay = true
  uiLock()
  bShow()
  try {
    while (bPlay && bI < bE.length - 1) await bStep()
  } finally {
    bPlay = false
    loop = false
    uiLock()
    bShow()
  }
}
$("bRs").onclick = () => {
  if (!busy && !loop) bInit(0)
}
$("bPl").onclick = bPlayF
$("bFw").onclick = () => {
  if (!busy && !loop) bStep()
}
$("bBk").onclick = () => {
  if (!busy && !loop) bJump(bI - 1)
}
$("bArr").onchange = $("bTgt").onchange = () => {
  if (!busy && !loop) bInit(0)
}
$("bSp").oninput = (e) => {
  bSpeed = +e.target.value
  ST.bs.sp = bSpeed
  persist()
}
$("bLog").onclick = (e) => {
  const d = e.target.closest(".lg")
  if (d && !busy && !loop) bJump(+d.dataset.k)
}

/* ===== Recursion curves: Hilbert ===== */
const HC = ["#D85A30", "#1D9E75", "#7F77DD", "#BA7517", "#D4537E"],
  HQ = [
    {
      o: [0.5, 0],
      T: [0, -1, -1, 0, 1, 1],
      n: "Top right",
      t: "mirror on / diagonal",
    },
    { o: [0, 0], T: [1, 0, 0, 1, 0, 0], n: "Top left", t: "same" },
    { o: [0, 0.5], T: [1, 0, 0, 1, 0, 0], n: "Bottom left", t: "same" },
    {
      o: [0.5, 0.5],
      T: [0, 1, 1, 0, 0, 0],
      n: "Bottom right",
      t: "mirror on \\ diagonal",
    },
  ],
  HCH = HQ.map((q) => [
    q.T[0] / 2,
    q.T[1] / 2,
    q.T[2] / 2,
    q.T[3] / 2,
    q.T[4] / 2 + q.o[0],
    q.T[5] / 2 + q.o[1],
  ]),
  hap = (M, p) => [
    M[0] * p[0] + M[2] * p[1] + M[4],
    M[1] * p[0] + M[3] * p[1] + M[5],
  ],
  hmul = (M, N) => [
    M[0] * N[0] + M[2] * N[1],
    M[1] * N[0] + M[3] * N[1],
    M[0] * N[2] + M[2] * N[3],
    M[1] * N[2] + M[3] * N[3],
    M[0] * N[4] + M[2] * N[5] + M[4],
    M[1] * N[4] + M[3] * N[5] + M[5],
  ],
  HSt = [[0.5, 0.5]],
  HEn = [[0.5, 0.5]],
  hcss = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim(),
  hfmt = (n) => n.toLocaleString("en-US"),
  hease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
for (let i = 1; i <= 14; i++) {
  HSt[i] = hap(HCH[0], HSt[i - 1])
  HEn[i] = hap(HCH[3], HEn[i - 1])
}
let hN = [],
  hE = [],
  hCC = [],
  hVis = [],
  hh = 3,
  hD = 3,
  hCo = 0,
  hTD = 3,
  hI = 0,
  hSp = 1,
  hProg = 1,
  hRaf = 0,
  hAccN = 0,
  hLast = null,
  hCell = 1
const HS = 1000,
  HP = 20,
  HCW = 30,
  HLH = 56,
  hcv = $("hlCv"),
  hctx = hcv.getContext("2d"),
  hacc = document.createElement("canvas")
hacc.width = hacc.height = HS
const hax = hacc.getContext("2d"),
  hmp = (p) => [HP + p[0] * (HS - 2 * HP), HP + p[1] * (HS - 2 * HP)],
  hps = (nd) => hap(nd.M, HSt[nd.n]),
  hpe = (nd) => hap(nd.M, HEn[nd.n]),
  hLw = (n) => Math.max(1.2, Math.min(8, hCell * 0.03 * (n + 1)))
/* the real recursion, recorded as events: 0 call, 1 emit/block, 2 link, 3 return, 4 start.
   Only the top 7 levels are expanded; for h > 7 the leaves are blocks of order h-7. */
function hBuild(h) {
  hh = h
  hD = Math.min(h, 7)
  hCo = h - hD
  hTD = Math.min(hD, 4)
  hN = []
  hE = []
  hCC = []
  let cc = 0
  const ad = (x) => {
    hE.push(x)
    if (x[0] === 0) cc++
    hCC.push(cc)
  }
  ad([4, -1])
  const rec = (n, M, dep, q, par) => {
    const id = hN.length,
      nd = { id, n, M, dep, q, par, c: hE.length, r: 0, ch: [], x: 0, cls: "" }
    hN.push(nd)
    ad([0, id])
    if (dep === hD) ad([1, id])
    else
      for (let i = 0; i < 4; i++) {
        const cid = hN.length
        nd.ch.push(cid)
        rec(n - 1, hmul(M, HCH[i]), dep + 1, i, id)
        if (i < 3) ad([2, id, cid, hN.length])
      }
    nd.r = hE.length
    ad([3, id])
  }
  rec(h, [1, 0, 0, 1, 0, 0], 0, -1, -1)
}
function hPts(M, n, cb) {
  if (!n) return cb(hap(M, [0.5, 0.5]))
  for (let i = 0; i < 4; i++) hPts(hmul(M, HCH[i]), n - 1, cb)
}
function hSeg(c, p, q, col, w) {
  const a = hmp(p),
    b = hmp(q)
  c.beginPath()
  c.moveTo(a[0], a[1])
  c.lineTo(b[0], b[1])
  c.strokeStyle = col
  c.lineWidth = w
  c.stroke()
}
function hPaint(i) {
  const e = hE[i]
  if (e[0] === 2) {
    const A = hN[e[2]],
      B = hN[e[3]],
      P = hN[e[1]],
      p = hpe(A),
      q = hps(B)
    hSeg(hax, p, q, HC[P.dep % 5], hLw(P.n))
    hLast = [p, q]
  } else if (e[0] === 1) {
    const nd = hN[e[1]]
    if (!nd.n) {
      if (hCell >= 5) {
        const c = hmp(hap(nd.M, [0.5, 0.5]))
        hax.beginPath()
        hax.arc(c[0], c[1], Math.min(10, hCell * 0.16), 0, 7)
        hax.fillStyle = hcss("--mut")
        hax.fill()
      }
    } else {
      let prev = null,
        last = null
      hax.beginPath()
      hPts(nd.M, nd.n, (p) => {
        const [x, y] = hmp(p)
        prev ? hax.lineTo(x, y) : hax.moveTo(x, y)
        last = prev
        prev = p
      })
      hax.strokeStyle = HC[nd.dep % 5]
      hax.lineWidth = Math.max(1, Math.min(6, hCell * 0.03))
      hax.stroke()
      hLast = [last, prev]
    }
  }
}
function hSync(k) {
  const t = k + (hE[k][0] === 1 && hCo > 0 ? 1 : 0)
  if (hAccN > t) {
    hax.clearRect(0, 0, HS, HS)
    hAccN = 0
    hLast = null
  }
  hax.lineCap = hax.lineJoin = "round"
  while (hAccN < t) hPaint(hAccN++)
}
const hCur = (e) => (e[0] === 4 ? -1 : e[0] === 3 ? hN[e[1]].par : e[1]),
  hChain = () => {
    const ch = []
    for (let i = hCur(hE[hI]); i >= 0; i = hN[i].par) ch.unshift(hN[i])
    return ch
  },
  harr = (c, p, q, sz, col) => {
    c.save()
    c.translate(q[0], q[1])
    c.rotate(Math.atan2(q[1] - p[1], q[0] - p[0]))
    c.beginPath()
    c.moveTo(0, 0)
    c.lineTo(-sz, -sz * 0.6)
    c.lineTo(-sz, sz * 0.6)
    c.closePath()
    c.fillStyle = col
    c.fill()
    c.restore()
  }
function hDraw() {
  const e = hE[hI],
    c = hctx,
    ink = hcss("--txt"),
    ch = hChain(),
    sz = Math.max(8, Math.min(14, hCell * 0.3))
  c.clearRect(0, 0, HS, HS)
  c.strokeStyle = hcss("--bd")
  c.lineWidth = 2
  c.strokeRect(HP, HP, HS - 2 * HP, HS - 2 * HP)
  c.drawImage(hacc, 0, 0)
  ch.forEach((nd, j) => {
    const top = j === ch.length - 1,
      col = HC[nd.dep % 5]
    c.beginPath()
    ;[
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ].forEach((q, i) => {
      const [x, y] = hmp(hap(nd.M, q))
      i ? c.lineTo(x, y) : c.moveTo(x, y)
    })
    c.closePath()
    if (top) {
      c.fillStyle = col + "2a"
      c.fill()
      c.setLineDash([])
      c.lineWidth = 4
      c.strokeStyle = col
    } else {
      c.setLineDash([10, 8])
      c.lineWidth = 2.5
      c.strokeStyle = col + "bb"
    }
    c.stroke()
    c.setLineDash([])
    if (top && nd.n > 0) {
      const g = HQ.map((q) => hmp(hap(nd.M, [q.o[0] + 0.25, q.o[1] + 0.25])))
      c.beginPath()
      g.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])))
      c.setLineDash([4, 7])
      c.lineWidth = 2.5
      c.strokeStyle = col
      c.stroke()
      c.setLineDash([])
      c.beginPath()
      c.arc(g[0][0], g[0][1], 8, 0, 7)
      c.fillStyle = col
      c.fill()
      c.beginPath()
      c.arc(g[3][0], g[3][1], 8, 0, 7)
      c.lineWidth = 3
      c.fillStyle = hcss("--field")
      c.fill()
      c.stroke()
    }
  })
  let seg = hLast && [hmp(hLast[0]), hmp(hLast[1])]
  if (e[0] === 2) {
    const p = hmp(hpe(hN[e[2]])),
      q = hmp(hps(hN[e[3]])),
      t = hease(hProg),
      tip = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
    c.beginPath()
    c.moveTo(p[0], p[1])
    c.lineTo(tip[0], tip[1])
    c.strokeStyle = ink
    c.lineWidth = hLw(hN[e[1]].n) + 2
    c.lineCap = "round"
    c.stroke()
    seg = hProg > 0.05 ? [p, tip] : seg
  } else if (e[0] === 1 && !hN[e[1]].n) {
    const p = hmp(hap(hN[e[1]].M, [0.5, 0.5]))
    c.beginPath()
    c.arc(
      p[0],
      p[1],
      Math.max(4, Math.min(14, hCell * 0.2)) * hease(hProg),
      0,
      7,
    )
    c.fillStyle = ink
    c.fill()
  }
  if (seg) harr(c, seg[0], seg[1], sz, ink)
}
function hAnim(on) {
  cancelAnimationFrame(hRaf)
  const e = hE[hI]
  if (
    !on ||
    (e[0] !== 2 && e[0] !== 1) ||
    (hCo && e[0] === 1) ||
    matchMedia("(prefers-reduced-motion:reduce)").matches
  ) {
    hProg = 1
    return
  }
  hProg = 0
  const t0 = performance.now(),
    d = Math.min(420, 320 / hSp)
  const f = (n) => {
    hProg = Math.min(1, (n - t0) / d)
    hDraw()
    if (hProg < 1) hRaf = requestAnimationFrame(f)
  }
  hRaf = requestAnimationFrame(f)
}
/* ---------- tree (top levels only; deeper calls fold into their ancestor) ---------- */
function hMkTree() {
  let lc = 0
  hN.forEach((nd) => {
    if (nd.dep === hTD) nd.x = lc++
  })
  for (let i = hN.length - 1; i >= 0; i--) {
    const nd = hN[i]
    if (nd.dep < hTD && nd.ch.length)
      nd.x = (hN[nd.ch[0]].x + hN[nd.ch[nd.ch.length - 1]].x) / 2
  }
  hVis = hN.filter((n) => n.dep <= hTD)
  const X = (n) => n.x * HCW + HCW / 2,
    Y = (n) => n.dep * HLH + 28,
    w = lc * HCW,
    h = hTD * HLH + 56,
    svg = $("hlTree")
  let s = ""
  hVis.forEach((n) => {
    if (n.par >= 0) {
      const p = hN[n.par],
        m = (Y(p) + Y(n)) / 2
      s += `<path class="ed" id="he${n.id}" d="M${X(p)} ${Y(p) + 16} C${X(p)} ${m},${X(n)} ${m},${X(n)} ${Y(n) - 16}"/>`
    }
  })
  hVis.forEach((n) => {
    s += `<g class="nd pen" id="hn${n.id}"><title>hilbert(${n.n})${n.q >= 0 ? " - child " + (n.q + 1) + ", " + HQ[n.q].n : ""}</title><rect x="${X(n) - 12}" y="${Y(n) - 16}" width="24" height="32" rx="8"/><text class="n" style="font-size:13px" x="${X(n)}" y="${Y(n) - 1}" text-anchor="middle">${n.n}</text><text class="l" x="${X(n)}" y="${Y(n) + 11}" text-anchor="middle">${n.q >= 0 ? "#" + (n.q + 1) : "root"}</text></g>`
  })
  svg.setAttribute("width", w)
  svg.setAttribute("height", h)
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`)
  svg.innerHTML = s
}
function hTreeShow() {
  let t = hCur(hE[hI])
  while (t >= 0 && hN[t].dep > hTD) t = hN[t].par
  hVis.forEach((nd) => {
    let c = "pen"
    if (nd.r <= hI) c = "done"
    else if (nd.c <= hI) c = nd.id === t ? "act" : "rel"
    if (nd.cls === c) return
    nd.cls = c
    $("hn" + nd.id).setAttribute("class", "nd " + c)
    const ed = $("he" + nd.id)
    if (ed)
      ed.setAttribute(
        "class",
        "ed " + (c === "done" ? "done" : c === "pen" ? "" : "rel"),
      )
  })
  if (t >= 0) {
    const b = $("hlTB"),
      n = hN[t]
    b.scrollTo({
      left: n.x * HCW + HCW / 2 - b.clientWidth / 2,
      top: n.dep * HLH - b.clientHeight / 2 + 40,
    })
  }
}
function hStackShow() {
  const ch = hChain()
  $("hlStack").innerHTML =
    ch
      .map(
        (nd, j) =>
          `<div class="fr ${j === ch.length - 1 ? "top" : ""}" style="margin-left:${Math.min(j, 8) * 10}px"><span>hilbert(${nd.n})${nd.dep === hD && hCo ? " block" : ""}</span><span class="chips">${nd.q < 0 ? '<span class="chip" style="background:var(--rel)">root</span>' : `<span class="chip" style="background:${HC[nd.dep % 5]}">child ${nd.q + 1}</span><span class="chip" style="background:var(--rel)">${HQ[nd.q].n}</span><span class="chip" style="background:var(--T)">${HQ[nd.q].t}</span>`}</span></div>`,
      )
      .join("") || '<span style="color:var(--mut)">Stack is empty</span>'
}
function hLogRow(k) {
  const e = hE[k],
    nd = e[1] >= 0 ? hN[e[1]] : null
  let m
  if (e[0] === 4) m = `Start: hilbert(${hh}) - ${hfmt(Math.pow(4, hh))} points`
  else if (e[0] === 0)
    m = `<span class="tag c">CALL</span><code>hilbert(${nd.n})</code> ${nd.q >= 0 ? `<small>child ${nd.q + 1} of hilbert(${nd.n + 1}) → ${HQ[nd.q].n}</small>` : "<small>root call</small>"}`
  else if (e[0] === 1)
    m = nd.n
      ? `<span class="tag m">BLOCK</span>draw <code>hilbert(${nd.n})</code> at once (${hfmt(Math.pow(4, nd.n))} points)`
      : `<span class="tag m">EMIT</span>point at the center of this cell`
  else if (e[0] === 2)
    m = `<span class="tag m">LINK</span>end of child ${hN[e[2]].q + 1} → start of child ${hN[e[3]].q + 1} <small>(inside hilbert(${nd.n}))</small>`
  else
    m = `<span class="tag r">RETURN</span><code>hilbert(${nd.n})</code> finished <small>(${hfmt(Math.pow(4, nd.n))} points)</small>`
  return `<div class="lg" data-k="${k}"><span class="k">${k}</span>${m}</div>`
}
function hInfoTxt() {
  const e = hE[hI],
    nd = e[1] >= 0 ? hN[e[1]] : null
  let s
  if (e[0] === 4)
    s =
      `Ready: <b>hilbert(${hh})</b> = ${hfmt(Math.pow(4, hh))} points. Press Play or Step.` +
      (hCo
        ? ` The top 7 levels are traced call by call; the leaves are blocks of order ${hCo} drawn in one step.`
        : "")
  else if (e[0] === 0)
    s =
      `<b>CALL</b> hilbert(${nd.n})${nd.q >= 0 ? ` as child ${nd.q + 1} of its parent: it fills the <b>${HQ[nd.q].n.toLowerCase()}</b> quadrant, copy is <b>${HQ[nd.q].t}</b>` : " (root)"} · ` +
      (nd.dep < hD
        ? `it will call hilbert(${nd.n - 1}) 4 times and add 3 links`
        : hCo
          ? `order ${nd.n} is drawn as one block`
          : "base case: it will emit one point")
  else if (e[0] === 1)
    s = nd.n
      ? `<b>BLOCK</b> hilbert(${nd.n}) drawn at once: ${hfmt(Math.pow(4, nd.n))} points`
      : "<b>EMIT</b> base case: one point at the center of the cell"
  else if (e[0] === 2)
    s = `<b>LINK</b> hilbert(${nd.n}) joins the end of its child ${hN[e[2]].q + 1} to the start of its child ${hN[e[3]].q + 1}`
  else
    s = `<b>RETURN</b> hilbert(${nd.n}) finished${nd.par >= 0 ? ", back to hilbert(" + hN[nd.par].n + ")" : ""}`
  if (hI === hE.length - 1)
    s += ` · <b>Done: hilbert(${hh}) has ${hfmt(Math.pow(4, hh))} points</b>`
  return s
}
function hShow() {
  hSync(hI)
  hDraw()
  hTreeShow()
  hStackShow()
  let h = ""
  for (let j = Math.max(0, hI - 199); j <= hI; j++) h += hLogRow(j)
  const l = $("hlLog")
  l.innerHTML = h
  if (l.lastElementChild) l.lastElementChild.classList.add("cur")
  l.scrollTop = l.scrollHeight
  $("hlInfo").innerHTML = hInfoTxt()
  $("hlCnt").textContent =
    `Step ${hI} / ${hE.length - 1} · Calls: ${hCC[hI]} / ${hN.length}`
  $("hlScrub").value = hI
  $("hlPl").innerHTML = hlPlay ? ic("pause") + " Pause" : ic("play") + " Play"
  ST.hl = { h: hh, step: hI, sp: hSp }
  persist()
}
function hGo(k, anim) {
  hI = Math.max(0, Math.min(hE.length - 1, k))
  hAnim(anim)
  hShow()
}
function hJump(k) {
  hlPlay = false
  hGo(k, false)
}
function hlInit(step, load) {
  hlPlay = false
  if (load) {
    $("hlN").value = ST.hl.h
    hSp = ST.hl.sp || 1
    $("hlSp").value = hSp
  }
  let v = parseInt($("hlN").value)
  if (isNaN(v)) v = 3
  v = Math.max(0, Math.min(12, v))
  $("hlN").value = v
  hBuild(v)
  hCell = (HS - 2 * HP) / Math.pow(2, v)
  hax.clearRect(0, 0, HS, HS)
  hAccN = 0
  hLast = null
  hMkTree()
  $("hlScrub").max = hE.length - 1
  hJump(Math.min(step || 0, hE.length - 1))
}
async function hStep(b) {
  if (busy || hI >= hE.length - 1) return false
  busy = true
  uiLock()
  try {
    hGo(hI + b, b === 1)
    await sleep(Math.max(40, 360 / hSp))
  } finally {
    busy = false
    uiLock()
  }
  return true
}
async function hPlayF() {
  if (hlPlay) {
    hlPlay = false
    uiLock()
    return
  }
  if (busy || loop) return
  if (hI >= hE.length - 1) hJump(0)
  loop = true
  hlPlay = true
  uiLock()
  hShow()
  const b = 1 + Math.floor(hE.length / 6000)
  try {
    while (hlPlay && hI < hE.length - 1) await hStep(b)
  } finally {
    hlPlay = false
    loop = false
    uiLock()
    hShow()
  }
}
$("hlRs").onclick = () => {
  if (!busy && !loop) hlInit(0)
}
$("hlPl").onclick = hPlayF
$("hlFw").onclick = () => {
  if (!busy && !loop) hStep(1)
}
$("hlBk").onclick = () => {
  if (!busy && !loop) hJump(hI - 1)
}
$("hlN").onchange = () => {
  if (!busy && !loop) hlInit(0)
}
$("hlSp").oninput = (e) => {
  hSp = +e.target.value
  ST.hl.sp = hSp
  persist()
}
$("hlScrub").oninput = (e) => {
  if (!busy && !loop) hJump(+e.target.value)
}
$("hlLog").onclick = (e) => {
  const d = e.target.closest(".lg")
  if (d && !busy && !loop) hJump(+d.dataset.k)
}

/* ===== theme, glass, restore ===== */
const ACC = {
  blue: "#5b8def",
  violet: "#8b6cf0",
  cyan: "#22b8cf",
  pink: "#e5609c",
  slate: "#6b7a99",
}
function applyTheme() {
  const t =
    ST.theme ||
    (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light")
  document.documentElement.dataset.theme = t
  document
    .querySelectorAll("#segTh button")
    .forEach((b) => b.classList.toggle("on", b.dataset.t === t))
}
function applyUI() {
  const d = document.documentElement
  d.dataset.corner = ST.corner
  d.style.setProperty("--rel", ACC[ST.accent] || ACC.blue)
  document
    .querySelectorAll("#segCo button")
    .forEach((b) => b.classList.toggle("on", b.dataset.c === ST.corner))
  document
    .querySelectorAll("#swA button")
    .forEach((b) => b.classList.toggle("on", b.dataset.c === ST.accent))
  $("sCard").classList.toggle("open", !!ST.setOpen)
  $("glv").textContent = Math.round(ST.alpha * 100) + "%"
}
$("segTh").onclick = (e) => {
  const b = e.target.closest("button")
  if (b) {
    ST.theme = b.dataset.t
    applyTheme()
    persist()
  }
}
$("segCo").onclick = (e) => {
  const b = e.target.closest("button")
  if (b) {
    ST.corner = b.dataset.c
    applyUI()
    persist()
  }
}
$("swA").onclick = (e) => {
  const b = e.target.closest("button")
  if (b) {
    ST.accent = b.dataset.c
    applyUI()
    persist()
  }
}
$("sTog").onclick = () => {
  ST.setOpen = !ST.setOpen
  applyUI()
  persist()
}
const devModal = $("devModal"),
  devInfo = $("devInfo"),
  devClose = $("devClose")
function openDevModal() {
  devModal.classList.add("open")
  devModal.setAttribute("aria-hidden", "false")
  devClose.focus()
}
function closeDevModal() {
  devModal.classList.remove("open")
  devModal.setAttribute("aria-hidden", "true")
  devInfo.focus()
}
devInfo.onclick = openDevModal
devClose.onclick = closeDevModal
devModal.addEventListener("click", (e) => {
  if (e.target === devModal) closeDevModal()
})
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && devModal.classList.contains("open")) closeDevModal()
})

/* ===== keyboard shortcuts for every algorithm page ===== */
const KEYS = {
  hanoi: ["rs", "bk", "pl", "fw"],
  bsearch: ["bRs", "bBk", "bPl", "bFw"],
  hilbert: ["hlRs", "hlBk", "hlPl", "hlFw"],
  gen: ["gRun", "gBk", "gPl", "gFw"],
}
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
  if (devModal.classList.contains("open")) return
  const t = e.target
  if (t.closest && t.closest("textarea,select,[contenteditable='true']")) return
  if (
    t.tagName === "INPUT" &&
    !["range", "checkbox", "button"].includes(t.type)
  )
    return
  const i = { KeyR: 0, ArrowLeft: 1, Space: 2, ArrowRight: 3 }[e.code]
  if (i === undefined) return
  if (e.repeat && (i === 0 || i === 2)) return
  if (i === 0 && curP === "new") return
  const set = KEYS[curP] || KEYS.gen,
    b = $(set[i])
  e.preventDefault()
  const a = document.activeElement
  if (a && /^(BUTTON|INPUT)$/.test(a.tagName)) a.blur()
  if (b && !b.disabled) b.click()
})
document.addEventListener("change", (e) => {
  if (e.target.type === "number") e.target.blur()
})

function applyAlpha() {
  document.documentElement.style.setProperty("--ga", ST.alpha)
  $("gla").value = ST.alpha
}
$("gla").oninput = (e) => {
  ST.alpha = +e.target.value
  applyAlpha()
  applyUI()
  persist()
}
applyTheme()
applyAlpha()
applyUI()
$("n").value = SAVED.hn
$("sp").value = SAVED.hs
speed = SAVED.hs
$("gSpd").value = SAVED.gs
gSpeed = SAVED.gs
$("bArr").value = SAVED.bs.arr
$("bTgt").value = SAVED.bs.t
$("bSp").value = SAVED.bs.sp
bSpeed = +SAVED.bs.sp
let p0 = SAVED.page
if (p0[0] === "m" && !findM(+p0.slice(1))) p0 = "hanoi"
showPage(p0, true)
document.documentElement.removeAttribute("data-boot")

/* navbar: keep every child the same height whenever the width changes */
function eqBar(bar) {
  if (!bar.offsetParent) return
  bar.classList.add("eqm")
  let h = 0
  for (const c of bar.children) h = Math.max(h, c.offsetHeight)
  bar.classList.remove("eqm")
  bar.style.setProperty("--bar-h", h + "px")
}
const barW = new WeakMap(),
  barRO = new ResizeObserver((es) => {
    for (const e of es) {
      const w = Math.round(e.contentRect.width)
      if (barW.get(e.target) !== w) {
        barW.set(e.target, w)
        eqBar(e.target)
      }
    }
  })
document.querySelectorAll(".bar").forEach((b) => barRO.observe(b))
if (document.fonts && document.fonts.ready)
  document.fonts.ready.then(() =>
    document.querySelectorAll(".bar").forEach(eqBar),
  )
