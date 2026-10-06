import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Admin, AuthForm, Home, MyUploads, ResourceView, Upload } from './pages.jsx';

function Guard({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <p className="err">Only admins can open this page.</p>;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <>
      <header className="bar">
        <Link to="/" className="brand">Study<mark>Share</mark></Link>
        <nav>
          <NavLink to="/" end>Library</NavLink>
          {user ? (
            <>
              <NavLink to="/upload">Upload</NavLink>
              <NavLink to="/my-uploads">My uploads</NavLink>
              {user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
              <button className="link" onClick={() => { logout(); nav('/'); }}>Log out ({user.name.split(' ')[0]})</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/register" className="btn small">Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources/:id" element={<ResourceView />} />
          <Route path="/upload" element={<Guard><Upload /></Guard>} />
          <Route path="/my-uploads" element={<Guard><MyUploads /></Guard>} />
          <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/register" element={<AuthForm mode="register" />} />
          <Route path="*" element={<p className="muted">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
