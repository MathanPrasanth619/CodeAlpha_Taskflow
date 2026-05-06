import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const COLORS = {
  indigo: { bg: "#1a1a2e", surface: "#16213e", card: "#0f3460", accent: "#e94560", muted: "#533483" },
};

const AVATARS = ["#e94560","#533483","#0f3460","#e07b39","#2ec4b6","#cbf3f0","#ffbf69"];
function avatar(name) { return name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"??"; }
function avatarColor(name) { let h=0; for(let c of(name||""))h=(h<<5)-h+c.charCodeAt(0); return AVATARS[Math.abs(h)%AVATARS.length]; }

// ─── IN-MEMORY STORE ─────────────────────────────────────────────────────────
function createStore() {
  let _state = {
    users: [
      { id:"u1", name:"Alex Chen", email:"alex@taskflow.io", password:"pass123", avatar:"AC" },
      { id:"u2", name:"Maria Santos", email:"maria@taskflow.io", password:"pass123", avatar:"MS" },
      { id:"u3", name:"Jordan Lee", email:"jordan@taskflow.io", password:"pass123", avatar:"JL" },
      { id:"u4", name:"Sam Rivera", email:"sam@taskflow.io", password:"pass123", avatar:"SR" },
    ],
    projects: [
      { id:"p1", name:"Product Redesign", description:"Complete UI/UX overhaul for Q3", color:"#e94560", owner:"u1", members:["u1","u2","u3"], createdAt: Date.now()-86400000*5 },
      { id:"p2", name:"Backend API v2", description:"RESTful API migration with GraphQL", color:"#533483", owner:"u2", members:["u2","u3","u4"], createdAt: Date.now()-86400000*3 },
      { id:"p3", name:"Mobile Launch", description:"iOS and Android app launch campaign", color:"#2ec4b6", owner:"u3", members:["u1","u3","u4"], createdAt: Date.now()-86400000 },
    ],
    columns: [
      { id:"col-todo", name:"To Do", projectId:"p1", order:0 },
      { id:"col-prog", name:"In Progress", projectId:"p1", order:1 },
      { id:"col-rev", name:"Review", projectId:"p1", order:2 },
      { id:"col-done", name:"Done", projectId:"p1", order:3 },
      { id:"col2-todo", name:"To Do", projectId:"p2", order:0 },
      { id:"col2-prog", name:"In Progress", projectId:"p2", order:1 },
      { id:"col2-done", name:"Done", projectId:"p2", order:2 },
      { id:"col3-todo", name:"Backlog", projectId:"p3", order:0 },
      { id:"col3-prog", name:"Active", projectId:"p3", order:1 },
      { id:"col3-done", name:"Shipped", projectId:"p3", order:2 },
    ],
    tasks: [
      { id:"t1", title:"Redesign dashboard layout", description:"Create wireframes and high-fi mockups", columnId:"col-prog", projectId:"p1", assignees:["u2","u3"], priority:"high", dueDate:"2026-05-20", labels:["design","ui"], order:0, createdBy:"u1", createdAt:Date.now()-86400000*4 },
      { id:"t2", title:"User research interviews", description:"Conduct 10 user interviews for feedback", columnId:"col-todo", projectId:"p1", assignees:["u1"], priority:"medium", dueDate:"2026-05-25", labels:["research"], order:0, createdBy:"u1", createdAt:Date.now()-86400000*3 },
      { id:"t3", title:"Component library update", description:"Update Storybook with new design tokens", columnId:"col-rev", projectId:"p1", assignees:["u3"], priority:"low", dueDate:"2026-05-18", labels:["dev","design"], order:0, createdBy:"u2", createdAt:Date.now()-86400000*2 },
      { id:"t4", title:"Accessibility audit", description:"WCAG 2.1 compliance check", columnId:"col-done", projectId:"p1", assignees:["u2"], priority:"high", dueDate:"2026-05-10", labels:["a11y"], order:0, createdBy:"u1", createdAt:Date.now()-86400000 },
      { id:"t5", title:"GraphQL schema design", description:"Define types, queries and mutations", columnId:"col2-prog", projectId:"p2", assignees:["u3","u4"], priority:"high", dueDate:"2026-05-22", labels:["backend","api"], order:0, createdBy:"u2", createdAt:Date.now()-86400000*2 },
      { id:"t6", title:"Auth middleware refactor", description:"JWT refresh token handling", columnId:"col2-todo", projectId:"p2", assignees:["u4"], priority:"medium", dueDate:"2026-05-28", labels:["backend","security"], order:0, createdBy:"u2", createdAt:Date.now()-86400000 },
      { id:"t7", title:"App store listing copy", description:"Write compelling descriptions", columnId:"col3-todo", projectId:"p3", assignees:["u1"], priority:"medium", dueDate:"2026-05-30", labels:["marketing"], order:0, createdBy:"u3", createdAt:Date.now()-86400000 },
    ],
    comments: [
      { id:"c1", taskId:"t1", userId:"u2", text:"Working on the mobile breakpoints now. Should be ready for review by EOD.", createdAt:Date.now()-3600000*5 },
      { id:"c2", taskId:"t1", userId:"u3", text:"Looks great! One suggestion — can we increase contrast on the sidebar?", createdAt:Date.now()-3600000*2 },
      { id:"c3", taskId:"t1", userId:"u1", text:"Good point @Jordan. I've added it to the design notes.", createdAt:Date.now()-3600000 },
      { id:"c4", taskId:"t5", userId:"u3", text:"Schema draft is done. Needs review from the team before we proceed.", createdAt:Date.now()-7200000 },
    ],
    notifications: [
      { id:"n1", userId:"u1", type:"comment", text:"Maria commented on 'Redesign dashboard layout'", taskId:"t1", projectId:"p1", read:false, createdAt:Date.now()-3600000*2 },
      { id:"n2", userId:"u1", type:"assigned", text:"You were assigned to 'User research interviews'", taskId:"t2", projectId:"p1", read:false, createdAt:Date.now()-86400000 },
      { id:"n3", userId:"u1", type:"mention", text:"Alex mentioned you in 'Redesign dashboard layout'", taskId:"t1", projectId:"p1", read:true, createdAt:Date.now()-3600000*5 },
    ],
    currentUser: null,
    nextId: 100,
  };
  let _listeners = [];
  const subscribe = (fn) => { _listeners.push(fn); return ()=>{ _listeners=_listeners.filter(l=>l!==fn); }; };
  const emit = () => _listeners.forEach(fn=>fn({..._state}));
  const getState = () => ({..._state});
  const setState = (updater) => { _state = updater(_state); emit(); };
  const nextId = () => { const id = `id-${_state.nextId}`; setState(s=>({...s,nextId:s.nextId+1})); return id; };

  return {
    subscribe, getState,
    login: (email, password) => {
      const user = _state.users.find(u=>u.email===email&&u.password===password);
      if(!user) return false;
      setState(s=>({...s, currentUser:user}));
      return true;
    },
    logout: () => setState(s=>({...s,currentUser:null})),
    signup: (name, email, password) => {
      if(_state.users.find(u=>u.email===email)) return false;
      const user = { id:nextId(), name, email, password, avatar:avatar(name) };
      setState(s=>({...s, users:[...s.users,user], currentUser:user}));
      return true;
    },
    createProject: (name, description, color, userId) => {
      const proj = { id:nextId(), name, description, color:color||"#e94560", owner:userId, members:[userId], createdAt:Date.now() };
      const cols = ["To Do","In Progress","Review","Done"].map((n,i)=>({ id:nextId(), name:n, projectId:proj.id, order:i }));
      setState(s=>({...s, projects:[...s.projects,proj], columns:[...s.columns,...cols]}));
      return proj;
    },
    addMember: (projectId, userId) => {
      setState(s=>({...s, projects:s.projects.map(p=>p.id===projectId&&!p.members.includes(userId)?{...p,members:[...p.members,userId]}:p)}));
    },
    createTask: (data) => {
      const task = { id:nextId(), ...data, createdAt:Date.now(), order:0 };
      setState(s=>({...s, tasks:[task,...s.tasks]}));

      return task;
    },
    updateTask: (id, updates) => {
      setState(s=>({...s, tasks:s.tasks.map(t=>t.id===id?{...t,...updates}:t)}));
    },
    moveTask: (taskId, newColumnId) => {
      setState(s=>({...s, tasks:s.tasks.map(t=>t.id===taskId?{...t,columnId:newColumnId}:t)}));
    },
    deleteTask: (id) => {
      setState(s=>({...s, tasks:s.tasks.filter(t=>t.id!==id), comments:s.comments.filter(c=>c.taskId!==id)}));
    },
    addComment: (taskId, userId, text) => {
      const comment = { id:nextId(), taskId, userId, text, createdAt:Date.now() };
      setState(s=>{
        const task = s.tasks.find(t=>t.id===taskId);
        const newNotifs = (task?.assignees||[]).filter(uid=>uid!==userId).map(uid=>({
          id:`n${Date.now()}-${uid}`, userId:uid, type:"comment",
          text:`${s.users.find(u=>u.id===userId)?.name} commented on '${task?.title}'`,
          taskId, projectId:task?.projectId, read:false, createdAt:Date.now()
        }));
        return {...s, comments:[...s.comments,comment], notifications:[...s.notifications,...newNotifs]};
      });
    },
    markNotifRead: (id) => {
      setState(s=>({...s, notifications:s.notifications.map(n=>n.id===id?{...n,read:true}:n)}));
    },
    markAllRead: (userId) => {
      setState(s=>({...s, notifications:s.notifications.map(n=>n.userId===userId?{...n,read:true}:n)}));
    },
    addColumn: (projectId, name) => {
      const cols = _state.columns.filter(c=>c.projectId===projectId);
      const col = { id:nextId(), name, projectId, order:cols.length };
      setState(s=>({...s, columns:[...s.columns,col]}));
    },
  };
}

const store = createStore();

function useStore() {
  const [state, setState] = useState(store.getState());
  useEffect(()=>store.subscribe(setState),[]);
  return state;
}

// ─── WEBSOCKET SIMULATION ────────────────────────────────────────────────────
function useWS(projectId, userId) {
  const [connected, setConnected] = useState(false);
  const [activity, setActivity] = useState([]);
  const timerRef = useRef();
  const MESSAGES = [
    "is viewing this board","updated a task","moved a card","added a comment","joined the project"
  ];
  useEffect(()=>{
    if(!projectId||!userId) return;
    setTimeout(()=>setConnected(true),600);
    timerRef.current = setInterval(()=>{
      const state = store.getState();
      const members = state.projects.find(p=>p.id===projectId)?.members||[];
      const others = members.filter(m=>m!==userId);
      if(others.length===0) return;
      const uid = others[Math.floor(Math.random()*others.length)];
      const user = state.users.find(u=>u.id===uid);
      if(Math.random()>0.7) {
        setActivity(a=>[{ id:Date.now(), user, msg:MESSAGES[Math.floor(Math.random()*MESSAGES.length)], time:Date.now() },...a].slice(0,5));
      }
    },4000);
    return ()=>{ clearInterval(timerRef.current); setConnected(false); };
  },[projectId,userId]);
  return { connected, activity };
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily:"'DM Sans',system-ui,sans-serif", minHeight:"100vh", background:"#0d0d1a", color:"#e8e8f0", display:"flex", flexDirection:"column" },
  nav: { background:"rgba(13,13,26,0.95)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 24px", height:56, display:"flex", alignItems:"center", gap:16, position:"sticky", top:0, zIndex:100 },
  logo: { fontWeight:700, fontSize:18, letterSpacing:"-0.5px", color:"#fff", display:"flex", alignItems:"center", gap:8 },
  logoMark: { width:28, height:28, background:"linear-gradient(135deg,#e94560,#533483)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff" },
  main: { flex:1, display:"flex", overflow:"hidden", height:"calc(100vh - 56px)" },
  sidebar: { width:220, background:"#0a0a18", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"16px 0", display:"flex", flexDirection:"column", gap:4, overflowY:"auto" },
  content: { flex:1, overflowY:"auto", overflowX:"hidden" },
  btn: (variant="primary",size="md") => ({
    display:"inline-flex", alignItems:"center", gap:6, padding:size==="sm"?"6px 12px":"8px 16px",
    borderRadius:8, border:"none", cursor:"pointer", fontWeight:500, fontSize:size==="sm"?12:14, transition:"all 0.15s",
    ...(variant==="primary"?{ background:"#e94560", color:"#fff" }:
       variant==="ghost"?{ background:"transparent", color:"#9090b0", border:"1px solid rgba(255,255,255,0.1)" }:
       { background:"rgba(255,255,255,0.05)", color:"#e8e8f0", border:"1px solid rgba(255,255,255,0.08)" })
  }),
  card: { background:"#141428", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px" },
  input: { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"8px 12px", color:"#e8e8f0", fontSize:14, width:"100%", outline:"none" },
  badge: (color) => ({ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600, background:color+"22", color:color }),
  avatar: (name,size=28) => ({ width:size, height:size, borderRadius:"50%", background:avatarColor(name), display:"flex", alignItems:"center", justifyContent:"center", fontSize:size>28?14:10, fontWeight:700, color:"#fff", flexShrink:0 }),
  col: { minWidth:272, maxWidth:272, background:"rgba(255,255,255,0.025)", borderRadius:12, padding:"12px 10px", display:"flex", flexDirection:"column", gap:8 },
  taskCard: { background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"12px", cursor:"pointer", transition:"all 0.15s" },
  tag: (c) => ({ padding:"1px 7px", borderRadius:20, fontSize:10, fontWeight:600, background:c+"33", color:c }),
  modal: { position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 },
  modalBox: { background:"#141428", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, width:"100%", maxWidth:680, maxHeight:"85vh", overflow:"auto" },
  sideItem: (active) => ({ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", cursor:"pointer", borderRadius:6, margin:"0 8px", fontSize:13, fontWeight:500, color:active?"#fff":"#7070a0", background:active?"rgba(233,69,96,0.12)":"transparent", transition:"all 0.12s" }),
};

const PRIORITY_COLORS = { high:"#e94560", medium:"#f0a500", low:"#2ec4b6" };
const LABEL_COLORS = { design:"#533483",ui:"#e94560",research:"#f0a500",dev:"#2ec4b6",a11y:"#2ec4b6",backend:"#533483",api:"#e07b39",security:"#e94560",marketing:"#f0a500" };

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Avatar({ name, size=28 }) {
  return <div style={S.avatar(name,size)}>{avatar(name)}</div>;
}

function PriorityDot({ priority }) {
  return <span style={{ width:8,height:8,borderRadius:"50%",background:PRIORITY_COLORS[priority]||"#555",flexShrink:0 }} />;
}

function Tag({ label }) {
  const c = LABEL_COLORS[label]||"#7070a0";
  return <span style={S.tag(c)}>{label}</span>;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"alex@taskflow.io", password:"pass123" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setErr(""); setLoading(true);
    setTimeout(()=>{
      setLoading(false);
      if(mode==="login") {
        if(!store.login(form.email, form.password)) setErr("Invalid email or password");
      } else {
        if(!form.name.trim()) return setErr("Name required");
        if(!store.signup(form.name, form.email, form.password)) setErr("Email already in use");
      }
    },400);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0d0d1a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ ...S.card, width:"100%", maxWidth:380, padding:32 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ ...S.logoMark, margin:"0 auto 12px", width:44, height:44, borderRadius:12, fontSize:18 }}>T</div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:"#fff" }}>TaskFlow</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#7070a0" }}>Collaborative project management</p>
        </div>
        <div style={{ display:"flex", gap:4, marginBottom:24, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:3 }}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{ flex:1, padding:"7px", borderRadius:6, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, background:mode===m?"#e94560":"transparent", color:mode===m?"#fff":"#7070a0", transition:"all 0.15s" }}>{m==="login"?"Sign In":"Sign Up"}</button>
          ))}
        </div>
        {mode==="signup"&&<input style={{ ...S.input, marginBottom:10 }} placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />}
        <input style={{ ...S.input, marginBottom:10 }} placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <input style={{ ...S.input, marginBottom:16 }} placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()} />
        {err&&<p style={{ color:"#e94560", fontSize:12, margin:"0 0 12px" }}>{err}</p>}
        <button style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", padding:"10px", opacity:loading?0.7:1 }} onClick={submit} disabled={loading}>
          {loading?"…":mode==="login"?"Sign In":"Create Account"}
        </button>
        {mode==="login"&&(
          <p style={{ textAlign:"center", fontSize:12, color:"#5050a0", marginTop:16 }}>
            Demo: <span style={{ color:"#7070c0", cursor:"pointer" }} onClick={()=>setForm({...form,email:"alex@taskflow.io",password:"pass123"})}>alex@taskflow.io / pass123</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────
function TaskCard({ task, users, onClick }) {
  const [hover, setHover] = useState(false);
  const assignees = (task.assignees||[]).map(id=>users.find(u=>u.id===id)).filter(Boolean);
  return (
    <div onClick={()=>onClick(task)} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ ...S.taskCard, borderColor:hover?"rgba(233,69,96,0.3)":"rgba(255,255,255,0.08)", transform:hover?"translateY(-1px)":"none" }}>
      {task.labels?.length>0&&<div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>{task.labels.map(l=><Tag key={l} label={l}/>)}</div>}
      <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:500, color:"#e8e8f0", lineHeight:1.4 }}>{task.title}</p>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <PriorityDot priority={task.priority}/>
          {task.dueDate&&<span style={{ fontSize:11, color:"#5050a0" }}>{new Date(task.dueDate).toLocaleDateString("en",{month:"short",day:"numeric"})}</span>}
        </div>
        <div style={{ display:"flex", alignItems:"center" }}>
          {assignees.slice(0,3).map((u,i)=>(
            <div key={u.id} style={{ ...S.avatar(u.name,22), marginLeft:i>0?-6:0, border:"2px solid #1a1a2e" }} title={u.name}>{avatar(u.name)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BOARD COLUMN ─────────────────────────────────────────────────────────────
function BoardColumn({ col, tasks, users, onTaskClick, projectId }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if(taskId) store.moveTask(taskId, col.id);
  };

  const addTask = () => {
    if(!title.trim()) return setAdding(false);
    const state = store.getState();
    store.createTask({ title:title.trim(), description:"", columnId:col.id, projectId, assignees:[], priority:"medium", dueDate:"", labels:[], createdBy:state.currentUser?.id||"u1" });
    setTitle(""); setAdding(false);
  };

  return (
    <div style={{ ...S.col, background:dragOver?"rgba(233,69,96,0.06)":"rgba(255,255,255,0.025)", borderColor:dragOver?"rgba(233,69,96,0.3)":"transparent", border:"1px solid transparent" }}
      onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 2px 4px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:13, fontWeight:600, color:"#c0c0e0" }}>{col.name}</span>
          <span style={{ fontSize:11, background:"rgba(255,255,255,0.08)", color:"#7070a0", borderRadius:20, padding:"1px 7px" }}>{tasks.length}</span>
        </div>
        <button onClick={()=>setAdding(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"#5050a0", fontSize:18, lineHeight:1, padding:"0 2px" }}>+</button>
      </div>
      {tasks.map(t=>(
        <div key={t.id} draggable onDragStart={e=>e.dataTransfer.setData("taskId",t.id)}>
          <TaskCard task={t} users={users} onClick={onTaskClick}/>
        </div>
      ))}
      {adding&&(
        <div style={{ background:"#1a1a2e", borderRadius:8, padding:8 }}>
          <input autoFocus style={{ ...S.input, marginBottom:6, padding:"6px 10px" }} placeholder="Task title…" value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask();if(e.key==="Escape")setAdding(false);}}/>
          <div style={{ display:"flex", gap:6 }}>
            <button style={S.btn("primary","sm")} onClick={addTask}>Add</button>
            <button style={S.btn("ghost","sm")} onClick={()=>setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TASK DETAIL MODAL ────────────────────────────────────────────────────────
function TaskModal({ task, state, onClose }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title:task.title, description:task.description||"", priority:task.priority, dueDate:task.dueDate||"" });
  const [comment, setComment] = useState("");
  const comments = state.comments.filter(c=>c.taskId===task.id).sort((a,b)=>a.createdAt-b.createdAt);
  const cu = state.currentUser;
  const project = state.projects.find(p=>p.id===task.projectId);
  const col = state.columns.find(c=>c.id===task.columnId);

  const save = () => {
    store.updateTask(task.id, form);
    setEditing(false);
  };
  const submitComment = () => {
    if(!comment.trim()) return;
    store.addComment(task.id, cu.id, comment);
    setComment("");
  };
  const toggleAssignee = (uid) => {
    const assignees = task.assignees.includes(uid)?task.assignees.filter(a=>a!==uid):[...task.assignees,uid];
    store.updateTask(task.id, { assignees });
  };

  return (
    <div style={S.modal} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={S.modalBox}>
        <div style={{ padding:"20px 24px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12 }}>
            <div style={{ flex:1 }}>
              {!editing?<h2 style={{ margin:0, fontSize:18, fontWeight:600, color:"#fff" }}>{task.title}</h2>:
                <input style={{ ...S.input, fontSize:16, fontWeight:600 }} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>}
              <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap", alignItems:"center" }}>
                <span style={S.badge(project?.color||"#e94560")}>{project?.name}</span>
                <span style={S.badge("#7070a0")}>{col?.name}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {!editing?<button style={S.btn("ghost","sm")} onClick={()=>setEditing(true)}>Edit</button>:
                <><button style={S.btn("primary","sm")} onClick={save}>Save</button><button style={S.btn("ghost","sm")} onClick={()=>setEditing(false)}>Cancel</button></>}
              <button onClick={()=>store.deleteTask(task.id)||onClose()} style={{ ...S.btn("ghost","sm"), color:"#e94560" }}>Delete</button>
              <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#5050a0", fontSize:20, lineHeight:1 }}>×</button>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:0 }}>
          <div style={{ flex:1, padding:"20px 24px" }}>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#5050a0", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Description</label>
              {!editing?<p style={{ margin:0, fontSize:14, color:"#9090b0", lineHeight:1.6 }}>{task.description||"No description."}</p>:
                <textarea style={{ ...S.input, minHeight:80, resize:"vertical" }} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>}
            </div>
            {task.labels?.length>0&&<div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>{task.labels.map(l=><Tag key={l} label={l}/>)}</div>}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#5050a0", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:10 }}>Comments ({comments.length})</label>
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:14 }}>
                {comments.map(c=>{
                  const u = state.users.find(u=>u.id===c.userId);
                  return (
                    <div key={c.id} style={{ display:"flex", gap:10 }}>
                      <Avatar name={u?.name||"?"} size={30}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:"#d0d0f0" }}>{u?.name}</span>
                          <span style={{ fontSize:11, color:"#404060" }}>{new Date(c.createdAt).toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})}</span>
                        </div>
                        <p style={{ margin:0, fontSize:13, color:"#9090b0", lineHeight:1.5 }}>{c.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Avatar name={cu?.name||"?"} size={30}/>
                <div style={{ flex:1, display:"flex", gap:8 }}>
                  <textarea style={{ ...S.input, flex:1, minHeight:36, resize:"none" }} placeholder="Add a comment…" value={comment} onChange={e=>setComment(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitComment();}}}/>
                  <button style={S.btn("primary","sm")} onClick={submitComment}>Send</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ width:200, borderLeft:"1px solid rgba(255,255,255,0.06)", padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"#5050a0", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:8 }}>Priority</label>
              {!editing?<span style={S.badge(PRIORITY_COLORS[task.priority]||"#555")}>{task.priority}</span>:
                <select style={{ ...S.input, padding:"5px 8px" }} value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  <option>high</option><option>medium</option><option>low</option>
                </select>}
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"#5050a0", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:8 }}>Due Date</label>
              {!editing?<span style={{ fontSize:13, color:"#9090b0" }}>{task.dueDate||"—"}</span>:
                <input type="date" style={{ ...S.input, padding:"5px 8px" }} value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>}
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"#5050a0", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:8 }}>Assignees</label>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {(project?.members||[]).map(uid=>{
                  const u = state.users.find(x=>x.id===uid);
                  const assigned = task.assignees?.includes(uid);
                  return (
                    <div key={uid} onClick={()=>toggleAssignee(uid)} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"4px 6px", borderRadius:6, background:assigned?"rgba(233,69,96,0.1)":"transparent" }}>
                      <Avatar name={u?.name||"?"} size={24}/>
                      <span style={{ fontSize:12, color:assigned?"#e0e0f8":"#6060a0", flex:1 }}>{u?.name}</span>
                      {assigned&&<span style={{ color:"#e94560", fontSize:14 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"#5050a0", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:8 }}>Move to</label>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {state.columns.filter(c=>c.projectId===task.projectId&&c.id!==task.columnId).map(c=>(
                  <button key={c.id} style={{ ...S.btn("ghost","sm"), justifyContent:"flex-start", fontSize:12 }} onClick={()=>store.moveTask(task.id,c.id)}>→ {c.name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROJECT BOARD ────────────────────────────────────────────────────────────
function ProjectBoard({ project, state }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [newCol, setNewCol] = useState(false);
  const [colName, setColName] = useState("");
  const { connected, activity } = useWS(project.id, state.currentUser?.id);
  const columns = state.columns.filter(c=>c.projectId===project.id).sort((a,b)=>a.order-b.order);
  const tasks = state.tasks.filter(t=>t.projectId===project.id);

  const addCol = () => {
    if(colName.trim()) { store.addColumn(project.id, colName.trim()); setColName(""); }
    setNewCol(false);
  };

  // Update selectedTask if it changes in store
  const liveTask = selectedTask ? state.tasks.find(t=>t.id===selectedTask.id)||null : null;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 24px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:12, height:12, borderRadius:"50%", background:project.color }}/>
          <h2 style={{ margin:0, fontSize:16, fontWeight:600, color:"#fff" }}>{project.name}</h2>
          <span style={{ fontSize:12, color:"#5050a0" }}>{project.description}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:connected?"#2ec4b6":"#404060", display:"inline-block" }}/>
            <span style={{ fontSize:11, color:connected?"#2ec4b6":"#404060" }}>{connected?"Live":"Connecting…"}</span>
          </div>
          {activity.length>0&&(
            <span style={{ fontSize:11, color:"#6060a0", maxWidth:240, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {activity[0].user?.name} {activity[0].msg}
            </span>
          )}
          <div style={{ display:"flex" }}>
            {(project.members||[]).map(uid=>{
              const u = state.users.find(x=>x.id===uid);
              return <div key={uid} style={{ ...S.avatar(u?.name||"?",28), marginLeft:-6, border:"2px solid #0d0d1a" }} title={u?.name}>{avatar(u?.name||"?")}</div>;
            })}
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowX:"auto", padding:"16px 20px", display:"flex", gap:12, alignItems:"flex-start" }}>
        {columns.map(col=>(
          <BoardColumn key={col.id} col={col} tasks={tasks.filter(t=>t.columnId===col.id)} users={state.users} onTaskClick={setSelectedTask} projectId={project.id}/>
        ))}
        <div style={{ minWidth:200 }}>
          {!newCol?(
            <button style={{ ...S.btn("ghost"), fontSize:13, color:"#5050a0", border:"1px dashed rgba(255,255,255,0.1)", padding:"8px 14px" }} onClick={()=>setNewCol(true)}>+ Add Column</button>
          ):(
            <div style={{ ...S.col }}>
              <input autoFocus style={{ ...S.input, padding:"7px 10px" }} placeholder="Column name…" value={colName} onChange={e=>setColName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCol();if(e.key==="Escape")setNewCol(false);}}/>
              <div style={{ display:"flex", gap:6 }}>
                <button style={S.btn("primary","sm")} onClick={addCol}>Add</button>
                <button style={S.btn("ghost","sm")} onClick={()=>setNewCol(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {liveTask&&<TaskModal task={liveTask} state={state} onClose={()=>setSelectedTask(null)}/>}
    </div>
  );
}

// ─── CREATE PROJECT MODAL ─────────────────────────────────────────────────────
function CreateProjectModal({ onClose, userId }) {
  const [form, setForm] = useState({ name:"", description:"", color:"#e94560" });
  const COLORS_LIST = ["#e94560","#533483","#2ec4b6","#f0a500","#e07b39","#4a9eff"];
  const create = () => {
    if(!form.name.trim()) return;
    store.createProject(form.name, form.description, form.color, userId);
    onClose();
  };
  return (
    <div style={S.modal} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ ...S.modalBox, maxWidth:440 }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:600, color:"#fff" }}>New Project</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#5050a0", fontSize:20 }}>×</button>
        </div>
        <div style={{ padding:"20px 24px" }}>
          <label style={{ fontSize:12, color:"#7070a0", display:"block", marginBottom:6 }}>Project Name</label>
          <input style={{ ...S.input, marginBottom:14 }} placeholder="e.g. Website Redesign" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <label style={{ fontSize:12, color:"#7070a0", display:"block", marginBottom:6 }}>Description</label>
          <input style={{ ...S.input, marginBottom:16 }} placeholder="Brief description…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
          <label style={{ fontSize:12, color:"#7070a0", display:"block", marginBottom:8 }}>Color</label>
          <div style={{ display:"flex", gap:8, marginBottom:24 }}>
            {COLORS_LIST.map(c=>(
              <div key={c} onClick={()=>setForm({...form,color:c})} style={{ width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer", border:form.color===c?"3px solid #fff":"3px solid transparent", transition:"all 0.1s" }}/>
            ))}
          </div>
          <button style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", padding:10 }} onClick={create}>Create Project</button>
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────
function NotifPanel({ state, onClose }) {
  const myNotifs = state.notifications.filter(n=>n.userId===state.currentUser?.id).sort((a,b)=>b.createdAt-a.createdAt);
  return (
    <div style={{ position:"absolute", top:52, right:16, width:320, background:"#141428", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, zIndex:150, boxShadow:"0 20px 60px rgba(0,0,0,0.5)", overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:14, fontWeight:600, color:"#fff" }}>Notifications</span>
        <button style={{ ...S.btn("ghost","sm"), fontSize:11 }} onClick={()=>store.markAllRead(state.currentUser?.id)}>Mark all read</button>
      </div>
      <div style={{ maxHeight:320, overflowY:"auto" }}>
        {myNotifs.length===0&&<p style={{ textAlign:"center", color:"#5050a0", fontSize:13, padding:20 }}>All caught up!</p>}
        {myNotifs.map(n=>(
          <div key={n.id} onClick={()=>store.markNotifRead(n.id)} style={{ padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer", background:n.read?"transparent":"rgba(233,69,96,0.05)", display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:n.read?"transparent":"#e94560", marginTop:5, flexShrink:0 }}/>
            <div>
              <p style={{ margin:0, fontSize:12, color:n.read?"#6060a0":"#c0c0e0", lineHeight:1.4 }}>{n.text}</p>
              <span style={{ fontSize:11, color:"#404060" }}>{new Date(n.createdAt).toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OVERVIEW / HOME ──────────────────────────────────────────────────────────
function Overview({ state, onSelectProject }) {
  const cu = state.currentUser;
  const myProjects = state.projects.filter(p=>p.members?.includes(cu?.id));
  const myTasks = state.tasks.filter(t=>t.assignees?.includes(cu?.id));
  const pending = myTasks.filter(t=>{ const col=state.columns.find(c=>c.id===t.columnId); return col&&!col.name.toLowerCase().includes("done")&&!col.name.toLowerCase().includes("shipped"); });

  return (
    <div style={{ padding:"28px 32px" }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ margin:"0 0 4px", fontSize:22, fontWeight:700, color:"#fff" }}>Welcome back, {cu?.name?.split(" ")[0]} 👋</h1>
        <p style={{ margin:0, fontSize:14, color:"#5050a0" }}>Here's what's happening across your projects</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:32 }}>
        {[
          { label:"My Projects", value:myProjects.length, color:"#e94560" },
          { label:"Open Tasks", value:pending.length, color:"#f0a500" },
          { label:"Team Members", value:[...new Set(myProjects.flatMap(p=>p.members||[]))].length, color:"#2ec4b6" },
        ].map(m=>(
          <div key={m.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"16px", border:"1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ margin:"0 0 4px", fontSize:11, color:"#5050a0", textTransform:"uppercase", letterSpacing:1 }}>{m.label}</p>
            <p style={{ margin:0, fontSize:28, fontWeight:700, color:m.color }}>{m.value}</p>
          </div>
        ))}
      </div>
      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:600, color:"#8080b0", textTransform:"uppercase", letterSpacing:1 }}>My Projects</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
        {myProjects.map(p=>{
          const ptasks = state.tasks.filter(t=>t.projectId===p.id);
          const done = ptasks.filter(t=>{ const c=state.columns.find(col=>col.id===t.columnId); return c&&(c.name.toLowerCase().includes("done")||c.name.toLowerCase().includes("shipped")); });
          const pct = ptasks.length?Math.round(done.length/ptasks.length*100):0;
          const members = (p.members||[]).map(id=>state.users.find(u=>u.id===id)).filter(Boolean);
          return (
            <div key={p.id} onClick={()=>onSelectProject(p)} style={{ ...S.card, cursor:"pointer", transition:"all 0.15s", borderColor:"rgba(255,255,255,0.07)" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=p.color+"66"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:p.color }}/>
                  <span style={{ fontSize:14, fontWeight:600, color:"#fff" }}>{p.name}</span>
                </div>
                <span style={S.badge(p.color)}>{ptasks.length} tasks</span>
              </div>
              <p style={{ margin:"0 0 14px", fontSize:12, color:"#5050a0" }}>{p.description}</p>
              <div style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:11, color:"#5050a0" }}>Progress</span>
                  <span style={{ fontSize:11, color:"#7070a0" }}>{pct}%</span>
                </div>
                <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:p.color, borderRadius:2, transition:"width 0.4s" }}/>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex" }}>
                  {members.slice(0,4).map((u,i)=>(
                    <div key={u.id} style={{ ...S.avatar(u.name,22), marginLeft:i>0?-5:0, border:"2px solid #141428" }}>{avatar(u.name)}</div>
                  ))}
                </div>
                <span style={{ fontSize:11, color:"#404060" }}>{new Date(p.createdAt).toLocaleDateString("en",{month:"short",day:"numeric"})}</span>
              </div>
            </div>
          );
        })}
      </div>

      {pending.length>0&&(
        <>
          <h3 style={{ margin:"32px 0 14px", fontSize:14, fontWeight:600, color:"#8080b0", textTransform:"uppercase", letterSpacing:1 }}>My Open Tasks</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {pending.slice(0,6).map(t=>{
              const proj = state.projects.find(p=>p.id===t.projectId);
              const col = state.columns.find(c=>c.id===t.columnId);
              return (
                <div key={t.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:12, padding:"10px 14px" }}>
                  <PriorityDot priority={t.priority}/>
                  <span style={{ flex:1, fontSize:13, color:"#d0d0f0" }}>{t.title}</span>
                  <span style={S.badge(proj?.color||"#555")}>{proj?.name}</span>
                  <span style={{ fontSize:11, color:"#5050a0", minWidth:60, textAlign:"right" }}>{col?.name}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── PEOPLE PAGE ──────────────────────────────────────────────────────────────
function PeoplePage({ state }) {
  return (
    <div style={{ padding:"28px 32px" }}>
      <h2 style={{ margin:"0 0 20px", fontSize:18, fontWeight:600, color:"#fff" }}>Team Members</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
        {state.users.map(u=>{
          const tasks = state.tasks.filter(t=>t.assignees?.includes(u.id));
          const projs = state.projects.filter(p=>p.members?.includes(u.id));
          return (
            <div key={u.id} style={{ ...S.card, textAlign:"center", padding:"20px 16px" }}>
              <div style={{ ...S.avatar(u.name,48), margin:"0 auto 10px" }}>{avatar(u.name)}</div>
              <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:600, color:"#fff" }}>{u.name}</p>
              <p style={{ margin:"0 0 14px", fontSize:12, color:"#5050a0" }}>{u.email}</p>
              <div style={{ display:"flex", justifyContent:"center", gap:16 }}>
                <div>
                  <p style={{ margin:0, fontSize:18, fontWeight:700, color:"#e94560" }}>{tasks.length}</p>
                  <p style={{ margin:0, fontSize:10, color:"#5050a0" }}>tasks</p>
                </div>
                <div>
                  <p style={{ margin:0, fontSize:18, fontWeight:700, color:"#533483" }}>{projs.length}</p>
                  <p style={{ margin:0, fontSize:10, color:"#5050a0" }}>projects</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const state = useStore();
  const [page, setPage] = useState("home");
  const [activeProject, setActiveProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const cu = state.currentUser;
  if(!cu) return <AuthPage/>;

  const myProjects = state.projects.filter(p=>p.members?.includes(cu.id));
  const unread = state.notifications.filter(n=>n.userId===cu.id&&!n.read).length;

  const selectProject = (p) => { setActiveProject(p); setPage("board"); };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <nav style={S.nav}>
        <div style={S.logo}>
          <div style={S.logoMark}>T</div>
          TaskFlow
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ position:"relative" }}>
          <button onClick={()=>setShowNotifs(!showNotifs)} style={{ ...S.btn("ghost","sm"), position:"relative", padding:"6px 10px" }}>
            🔔
            {unread>0&&<span style={{ position:"absolute", top:-2, right:-2, width:16, height:16, borderRadius:"50%", background:"#e94560", fontSize:10, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>{unread}</span>}
          </button>
          {showNotifs&&<NotifPanel state={state} onClose={()=>setShowNotifs(false)}/>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Avatar name={cu.name}/>
          <span style={{ fontSize:13, color:"#9090b0" }}>{cu.name}</span>
          <button style={S.btn("ghost","sm")} onClick={()=>store.logout()}>Sign out</button>
        </div>
      </nav>
      <div style={S.main}>
        <aside style={S.sidebar}>
          <button onClick={()=>setPage("home")} style={S.sideItem(page==="home"&&!activeProject)}>🏠 Home</button>
          <button onClick={()=>setPage("people")} style={S.sideItem(page==="people")}>👥 People</button>
          <div style={{ padding:"16px 16px 6px", fontSize:11, fontWeight:600, color:"#303060", textTransform:"uppercase", letterSpacing:1 }}>Projects</div>
          {myProjects.map(p=>(
            <button key={p.id} onClick={()=>selectProject(p)} style={{ ...S.sideItem(page==="board"&&activeProject?.id===p.id), display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:p.color, flexShrink:0 }}/>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
            </button>
          ))}
          <div style={{ padding:"8px 16px" }}>
            <button onClick={()=>setShowNewProject(true)} style={{ ...S.btn("ghost","sm"), width:"100%", justifyContent:"center", fontSize:12, color:"#5050a0", border:"1px dashed rgba(255,255,255,0.1)" }}>+ New Project</button>
          </div>
        </aside>
        <main style={S.content} onClick={()=>showNotifs&&setShowNotifs(false)}>
          {page==="home"&&<Overview state={state} onSelectProject={selectProject}/>}
          {page==="people"&&<PeoplePage state={state}/>}
          {page==="board"&&activeProject&&<ProjectBoard project={activeProject} state={state}/>}
        </main>
      </div>
      {showNewProject&&<CreateProjectModal onClose={()=>setShowNewProject(false)} userId={cu.id}/>}
    </div>
  );
}
