import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, size } from './api';
import { useAuth } from './auth.jsx';

const slug = (c) => c.toLowerCase().replace(/\s+/g, '-');
const Err = ({ msg }) => (msg ? <p className="err" role="alert">{msg}</p> : null);
const Tag = ({ c }) => <span className={`tag ${slug(c)}`}>{c}</span>;

function Row({ r, onDelete }) {
  return (
    <div className="item">
      <Tag c={r.category} />
      <div className="grow">
        <Link to={`/resources/${r._id}`} className="title">{r.title}</Link>
        <p className="muted">{r.subject} - Semester {r.semester}{r.academicYear && ` - ${r.academicYear}`}</p>
      </div>
      <span className="muted nowrap">{r.downloads} downloads</span>
      {onDelete && <button className="btn small danger" onClick={() => onDelete(r)}>Delete</button>}
    </div>
  );
}

async function del(r, reload) {
  if (!confirm(`Delete "${r.title}"?`)) return;
  try { await api('/resources/' + r._id, { method: 'DELETE' }); reload(); } catch (e) { alert(e.message); }
}

export function Home() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ subjects: [], years: [], categories: [] });
  const [f, setF] = useState({ q: '', subject: '', semester: '', category: '', year: '', sort: 'new' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api('/resources/meta').then(setMeta).catch(() => {}); }, []);
  useEffect(() => {
    const p = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    api('/resources?' + p).then((d) => { setItems(d); setErr(''); }).catch((e) => setErr(e.message));
  }, [f]);

  return (
    <>
      <section className="hero">
        <h1>Every note, paper and manual your batch has ever shared, in one place.</h1>
        <p>Search by subject or semester, download what you need, and upload what helped you for the next batch.</p>
        <input className="big" placeholder="Search title, subject or topic" value={f.q} onChange={set('q')} aria-label="Search resources" />
      </section>
      <div className="filters">
        <select value={f.semester} onChange={set('semester')} aria-label="Semester">
          <option value="">All semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={f.subject} onChange={set('subject')} aria-label="Subject">
          <option value="">All subjects</option>
          {meta.subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={f.category} onChange={set('category')} aria-label="Category">
          <option value="">All types</option>
          {meta.categories.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={f.year} onChange={set('year')} aria-label="Academic year">
          <option value="">All years</option>
          {meta.years.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={f.sort} onChange={set('sort')} aria-label="Sort">
          <option value="new">Newest first</option>
          <option value="popular">Most downloaded</option>
        </select>
      </div>
      <Err msg={err} />
      <div className="list">{items.map((r) => <Row key={r._id} r={r} />)}</div>
      {!items.length && !err && <p className="muted">Nothing matches these filters. Clear a filter, or upload the first one.</p>}
    </>
  );
}

export function ResourceView() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api('/resources/' + id).then(setR).catch((e) => setErr(e.message)); }, [id]);
  if (err) return <Err msg={err} />;
  if (!r) return <p className="muted">Loading...</p>;

  const download = async () => {
    try {
      const d = await api(`/resources/${id}/download`, { method: 'POST' });
      const a = document.createElement('a');
      a.href = d.url; a.download = d.fileName; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setR({ ...r, downloads: d.downloads });
    } catch (e) { setErr(e.message); }
  };
  const canDelete = user && (user.role === 'admin' || user.id === r.uploader?._id);

  return (
    <div className="detail">
      <Tag c={r.category} />
      <h1>{r.title}</h1>
      <p>{r.description || 'No description provided.'}</p>
      <dl>
        <dt>Subject</dt><dd>{r.subject}</dd>
        <dt>Semester</dt><dd>{r.semester}</dd>
        <dt>Academic year</dt><dd>{r.academicYear || '-'}</dd>
        <dt>File</dt><dd>{r.fileName} ({size(r.fileSize)})</dd>
        <dt>Uploaded by</dt><dd>{r.uploader?.name || 'Removed user'}{r.uploader?.department && `, ${r.uploader.department}`}</dd>
        <dt>Downloads</dt><dd>{r.downloads}</dd>
      </dl>
      {user ? <button className="btn" onClick={download}>Download file</button> : <p><Link to="/login">Log in</Link> to download this file.</p>}
      {canDelete && <button className="btn danger" onClick={async () => { if (confirm('Delete this resource?')) { await api('/resources/' + id, { method: 'DELETE' }); nav('/'); } }}>Delete</button>}
    </div>
  );
}

export function Upload() {
  const nav = useNavigate();
  const [meta, setMeta] = useState({ subjects: [], categories: [] });
  const [f, setF] = useState({ title: '', description: '', subject: '', semester: '1', category: 'Notes', academicYear: '2025-26' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { api('/resources/meta').then(setMeta).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setErr('Choose a file to upload');
    const form = new FormData();
    Object.entries(f).forEach(([k, v]) => form.append(k, v));
    form.append('file', file);
    setBusy(true); setErr('');
    try { const r = await api('/resources', { method: 'POST', form }); nav('/resources/' + r._id); }
    catch (x) { setErr(x.message); setBusy(false); }
  };

  return (
    <form className="form" onSubmit={submit}>
      <h1>Upload a resource</h1>
      <label>Title<input required value={f.title} onChange={set('title')} placeholder="e.g. DBMS Unit 3 Notes" /></label>
      <label>Subject<input required list="subjects" value={f.subject} onChange={set('subject')} /></label>
      <datalist id="subjects">{meta.subjects.map((s) => <option key={s} value={s} />)}</datalist>
      <div className="two">
        <label>Semester
          <select value={f.semester} onChange={set('semester')}>{[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s}>{s}</option>)}</select>
        </label>
        <label>Type
          <select value={f.category} onChange={set('category')}>{meta.categories.map((s) => <option key={s}>{s}</option>)}</select>
        </label>
      </div>
      <label>Academic year<input value={f.academicYear} onChange={set('academicYear')} placeholder="2025-26" /></label>
      <label>Description<textarea rows="3" value={f.description} onChange={set('description')} /></label>
      <label>File (PDF, Word, PowerPoint, Excel, image, zip - up to 10 MB)
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      </label>
      <Err msg={err} />
      <button className="btn" disabled={busy}>{busy ? 'Uploading...' : 'Upload resource'}</button>
    </form>
  );
}

export function MyUploads() {
  const [items, setItems] = useState([]);
  const load = () => api('/resources/mine').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);
  return (
    <>
      <h1>My uploads</h1>
      <div className="list">{items.map((r) => <Row key={r._id} r={r} onDelete={(x) => del(x, load)} />)}</div>
      {!items.length && <p className="muted">You have not uploaded anything yet. <Link to="/upload">Upload your first resource</Link>.</p>}
    </>
  );
}

export function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const load = () => {
    api('/users/stats').then(setStats).catch(() => {});
    api('/users').then(setUsers).catch(() => {});
    api('/resources').then(setItems).catch(() => {});
  };
  useEffect(load, []);
  const rmUser = async (u) => {
    if (!confirm(`Delete ${u.name} and all their uploads?`)) return;
    try { await api('/users/' + u.id, { method: 'DELETE' }); load(); } catch (e) { alert(e.message); }
  };
  return (
    <>
      <h1>Admin</h1>
      <p className="stats"><b>{stats.users}</b> users - <b>{stats.resources}</b> resources - <b>{stats.downloads}</b> downloads</p>
      <h2>Users</h2>
      <div className="list">
        {users.map((u) => (
          <div className="item" key={u.id}>
            <div className="grow"><b>{u.name}</b> <span className="muted">{u.email} - {u.role}</span></div>
            {u.id !== user.id && <button className="btn small danger" onClick={() => rmUser(u)}>Delete</button>}
          </div>
        ))}
      </div>
      <h2>All resources</h2>
      <div className="list">{items.map((r) => <Row key={r._id} r={r} onDelete={(x) => del(x, load)} />)}</div>
    </>
  );
}

export function AuthForm({ mode }) {
  const isReg = mode === 'register';
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', department: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try { login(await api(isReg ? '/auth/register' : '/auth/login', { method: 'POST', body: f })); nav('/'); }
    catch (x) { setErr(x.message); }
  };
  return (
    <form className="form" onSubmit={submit}>
      <h1>{isReg ? 'Create your account' : 'Welcome back'}</h1>
      {isReg && <label>Full name<input required value={f.name} onChange={set('name')} /></label>}
      <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
      <label>Password<input type="password" required minLength="6" value={f.password} onChange={set('password')} /></label>
      {isReg && <label>Department<input value={f.department} onChange={set('department')} placeholder="Computer Engineering" /></label>}
      <Err msg={err} />
      <button className="btn">{isReg ? 'Sign up' : 'Log in'}</button>
      {!isReg && <p className="muted">Demo: jiya@demo.dev / password123</p>}
    </form>
  );
}
