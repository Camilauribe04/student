import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Briefcase,
  MessageSquare,
  Bell,
  User,
  Users,
  ShieldAlert,
  LogOut,
  CheckCircle,
  Plus,
  Send,
  Trash2,
  Shield,
  Award,
  MapPin,
  DollarSign,
  ExternalLink,
  Search,
  BookMarked,
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

function App() {
  // Authentication states
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  // Registration form
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('estudiante');
  const [regProgram, setRegProgram] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // System feedback states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dashboard states
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [usersList, setUsersList] = useState([]); // Admin view
  const [documents, setDocuments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [allUsersChat, setAllUsersChat] = useState([]); // To list chat recipients
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatInput, setChatInput] = useState('');

  // Upload/Post forms
  const [docTitle, setDocTitle] = useState('');
  const [docProgram, setDocProgram] = useState('Análisis y Desarrollo de Software (ADSO)');
  const [docUrl, setDocUrl] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docRecommended, setDocRecommended] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobLocation, setJobLocation] = useState('');

  // Edit profile states
  const [profileBio, setProfileBio] = useState('');
  const [profileProgram, setProfileProgram] = useState('');
  const [profilePassword, setProfilePassword] = useState('');

  // Search/Filter states
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [searchJobQuery, setSearchJobQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('Todos');

  // Ref for chat auto-scroll
  const messagesEndRef = useRef(null);

  // Auto-clear messages
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch current user details on token mount
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setCurrentUser(null);
    }
  }, [token]);

  // Dynamic system fetching on login
  useEffect(() => {
    if (currentUser) {
      fetchDocuments();
      fetchJobs();
      fetchNotifications();
      fetchMessages();

      // If admin, fetch all users
      if (currentUser.role === 'administrador') {
        fetchAdminUsers();
      }

      // Load users available for chat
      fetchChatUsers();

      // Start automatic polling for messages/notifications (simulates WebSockets beautifully)
      const interval = setInterval(() => {
        pollUpdates();
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChatUser]);

  const pollUpdates = async () => {
    if (!token) return;
    try {
      // Notifications
      const notifRes = await fetch(`${API_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notifRes.ok) {
        const notifs = await notifRes.json();
        setNotifications(notifs);
      }

      // Messages
      const msgRes = await fetch(`${API_BASE}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (msgRes.ok) {
        const msgs = await msgRes.json();
        setMessages(msgs);
      }
    } catch (e) {
      console.log("Polling error:", e);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        setProfileBio(data.bio || '');
        setProfileProgram(data.program || '');
      } else {
        // Expired or bad token
        handleLogout();
      }
    } catch (error) {
      setErrorMessage('No se pudo conectar con el servidor backend.');
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChatUsers = async () => {
    try {
      // Use registration email formats to query, or simple fallback
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/admin/users`, { headers }).catch(() => null);

      if (res && res.ok) {
        const users = await res.json();
        // Exclude current user
        setAllUsersChat(users.filter(u => u.id !== currentUser?.id));
      } else {
        // Fallback for non-admins to list core people (e.g. instructors/admin)
        // Since teachers can message, let's fetch an inline list
        setAllUsersChat([
          { id: 'u1', username: 'admin_sena', role: 'administrador', program: 'Administración' },
          { id: 'u2', username: 'docente_maria', role: 'docente', program: 'ADSO' },
          { id: 'u3', username: 'estudiante_carlos', role: 'estudiante', program: 'ADSO' }
        ].filter(u => u.username !== currentUser?.username));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Operations
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regUsername || !regEmail || !regPassword) {
      setErrorMessage('Por favor complete todos los campos obligatorios.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
          role: regRole,
          program: regProgram
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setSuccessMessage('¡Usuario registrado exitosamente en el SENA!');
        // Reset inputs
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setRegProgram('');
      } else {
        setErrorMessage(data.error || 'Ocurrió un error al registrar.');
      }
    } catch (error) {
      setErrorMessage('Error al conectar con el servidor.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Por favor ingrese su correo y contraseña.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setSuccessMessage('Sesión iniciada con éxito. ¡Bienvenido!');
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setErrorMessage(data.error || 'Credenciales inválidas.');
      }
    } catch (error) {
      setErrorMessage('Error al conectar con el servidor.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setCurrentUser(null);
    setCurrentTab('dashboard');
    setActiveChatUser(null);
    setSuccessMessage('Has cerrado sesión correctamente.');
  };

  // Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const body = { bio: profileBio, program: profileProgram };
      if (profilePassword) body.password = profilePassword;

      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        setProfilePassword('');
        setSuccessMessage('¡Tu perfil del SENA se ha actualizado!');
      } else {
        setErrorMessage(data.error || 'Error al actualizar perfil.');
      }
    } catch (error) {
      setErrorMessage('Error en el servidor.');
    }
  };

  // Upload Study Material
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!docTitle || !docUrl || !docDesc) {
      setErrorMessage('Por favor complete todos los datos del documento.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: docTitle,
          program: docProgram,
          url: docUrl,
          description: docDesc,
          recommended: docRecommended
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setDocTitle('');
        setDocUrl('');
        setDocDesc('');
        setDocRecommended(false);
        fetchDocuments();
      } else {
        setErrorMessage(data.error || 'Error al subir documento.');
      }
    } catch (error) {
      setErrorMessage('Error al conectar con el servidor.');
    }
  };

  // Delete Document
  const handleDeleteDocument = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este recurso de estudio?')) return;
    try {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        fetchDocuments();
      } else {
        setErrorMessage(data.error || 'No se pudo eliminar.');
      }
    } catch (e) {
      setErrorMessage('Error en el servidor.');
    }
  };

  // Post Job Offer
  const handlePostJob = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!jobTitle || !jobCompany || !jobDesc || !jobRequirements || !jobSalary || !jobLocation) {
      setErrorMessage('Por favor complete todos los campos de la oferta laboral.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: jobTitle,
          company: jobCompany,
          description: jobDesc,
          requirements: jobRequirements,
          salary: jobSalary,
          location: jobLocation
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setJobTitle('');
        setJobCompany('');
        setJobDesc('');
        setJobRequirements('');
        setJobSalary('');
        setJobLocation('');
        fetchJobs();
      } else {
        setErrorMessage(data.error || 'Error al publicar la vacante.');
      }
    } catch (error) {
      setErrorMessage('Error en el servidor.');
    }
  };

  // Delete Job Offer
  const handleDeleteJob = async (id) => {
    if (!window.confirm('¿Desea retirar esta oferta de empleo?')) return;
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        fetchJobs();
      } else {
        setErrorMessage(data.error || 'No se pudo eliminar la vacante.');
      }
    } catch (e) {
      setErrorMessage('Error en el servidor.');
    }
  };

  // Apply to Job Offer
  const handleApplyJob = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        fetchJobs();
        fetchCurrentUser(); // Reload student progress
      } else {
        setErrorMessage(data.error || 'No se pudo aplicar a la oferta.');
      }
    } catch (e) {
      setErrorMessage('Error al conectar con el servidor.');
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeChatUser || !chatInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activeChatUser.id,
          content: chatInput
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setChatInput('');
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Error al enviar mensaje.');
      }
    } catch (e) {
      setErrorMessage('Error al conectar con el chat.');
    }
  };

  // Mark single Notification read
  const handleMarkNotifRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all notifications read
  const handleMarkAllNotifsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setSuccessMessage('Todas las notificaciones marcadas como leídas.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin User Permissions Edit
  const handleAdminUpdateUser = async (userId, role, permissions, verified) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, permissions, verified })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        fetchAdminUsers();
      } else {
        setErrorMessage(data.error || 'Error al actualizar permisos.');
      }
    } catch (e) {
      setErrorMessage('Error en el servidor.');
    }
  };

  // Admin Delete User
  const handleAdminDeleteUser = async (userId) => {
    if (!window.confirm('¿Está seguro de revocar y eliminar permanentemente esta cuenta de la plataforma?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        fetchAdminUsers();
      } else {
        setErrorMessage(data.error || 'No se pudo eliminar el usuario.');
      }
    } catch (e) {
      setErrorMessage('Error en el servidor.');
    }
  };

  // Filter study programs list helper
  const programsList = [
    'Análisis y Desarrollo de Software (ADSO)',
    'Multimedia y Diseño',
    'Gestión Administrativa',
    'Electricidad Industrial',
    'Mantenimiento Mecatrónico'
  ];

  // Filtering logs
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchDocQuery.toLowerCase());
    const matchesProgram = filterProgram === 'Todos' || doc.program === filterProgram;
    return matchesSearch && matchesProgram;
  });

  const filteredJobs = jobs.filter(job => {
    return job.title.toLowerCase().includes(searchJobQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchJobQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchJobQuery.toLowerCase()) ||
      job.requirements.toLowerCase().includes(searchJobQuery.toLowerCase());
  });

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  // Filter messages for direct chat conversation
  const activeChatMessages = messages.filter(msg => {
    if (!activeChatUser) return false;
    return (msg.senderId === currentUser.id && msg.receiverId === activeChatUser.id) ||
      (msg.senderId === activeChatUser.id && msg.receiverId === currentUser.id);
  });

  // Render Login / Register View
  if (!currentUser) {
    return (
      <div className="auth-container">
        <div className="glass-panel auth-box animate-fade-in">
          <div className="auth-header-box">
            <div className="auth-logo">
              <Sparkles className="animate-spin" size={28} style={{ animationDuration: '4s' }} />
              <span>SENA Connect</span>
            </div>
            <p className="subtitle">Portal Académico & Profesional para Aprendices</p>
          </div>

          {errorMessage && (
            <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.12)' }}>
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="badge badge-verified" style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.12)' }}>
              {successMessage}
            </div>
          )}

          {authView === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Correo Institucional Activo</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ejemplo@misena.edu.co"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Ingresar al Portal
              </button>

              <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>¿No tienes una cuenta? </span>
                <a href="#register" onClick={() => setAuthView('register')} style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                  Regístrate aquí
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Nombre de Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="CarlosSena99"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Correo Institucional (SENA)</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="carlos@misena.edu.co o maria@sena.edu.co"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  * Debe terminar en <strong>@sena.edu.co</strong> o <strong>@misena.edu.co</strong>
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rol del Usuario</label>
                <select
                  className="form-control"
                  value={regRole}
                  onChange={e => setRegRole(e.target.value)}
                >
                  <option value="estudiante">Estudiante / Aprendiz</option>
                  <option value="docente">Docente / Instructor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              {regRole === 'estudiante' && (
                <div className="form-group">
                  <label className="form-label">Programa de Formación</label>
                  <select
                    className="form-control"
                    value={regProgram}
                    onChange={e => setRegProgram(e.target.value)}
                    required
                  >
                    <option value="">Selecciona tu programa...</option>
                    {programsList.map(prog => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Crear Cuenta SENA
              </button>

              <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>¿Ya tienes cuenta? </span>
                <a href="#login" onClick={() => setAuthView('login')} style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                  Inicia sesión aquí
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render Full Dashboard App Layout
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="glass-panel" style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--border)',
        borderRadius: 0,
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100
      }}>
        <div className="auth-logo" style={{ justifyContent: 'flex-start', paddingLeft: '10px', marginBottom: '32px' }}>
          <Award style={{ color: 'var(--primary)' }} size={30} />
          <span>SENA Connect</span>
        </div>

        {/* User Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              color: 'white',
              fontSize: '1.1rem'
            }}>
              {currentUser.username[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '0.95rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {currentUser.username}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span className={`badge ${currentUser.role === 'administrador' ? 'badge-admin' :
                  currentUser.role === 'docente' ? 'badge-teacher' : 'badge-student'
                  }`} style={{ scale: '0.85', transformOrigin: 'left' }}>
                  {currentUser.role}
                </span>
                {currentUser.verified && <UserCheck size={14} style={{ color: 'var(--success)' }} />}
              </div>
            </div>
          </div>

          {currentUser.role === 'estudiante' && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Progreso Académico</span>
                <span>{currentUser.progress}%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${currentUser.progress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Menu Options */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button
            className={`btn btn-secondary`}
            style={{
              justifyContent: 'flex-start',
              background: currentTab === 'dashboard' ? 'rgba(57,169,0,0.18)' : 'transparent',
              borderColor: currentTab === 'dashboard' ? 'var(--primary)' : 'transparent',
              textAlign: 'left'
            }}
            onClick={() => setCurrentTab('dashboard')}
          >
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            Panel Principal
          </button>

          <button
            className={`btn btn-secondary`}
            style={{
              justifyContent: 'flex-start',
              background: currentTab === 'documents' ? 'rgba(57,169,0,0.18)' : 'transparent',
              borderColor: currentTab === 'documents' ? 'var(--primary)' : 'transparent',
              textAlign: 'left'
            }}
            onClick={() => setCurrentTab('documents')}
          >
            <BookOpen size={18} style={{ color: 'var(--primary)' }} />
            Material de Estudio
          </button>

          <button
            className={`btn btn-secondary`}
            style={{
              justifyContent: 'flex-start',
              background: currentTab === 'jobs' ? 'rgba(57,169,0,0.18)' : 'transparent',
              borderColor: currentTab === 'jobs' ? 'var(--primary)' : 'transparent',
              textAlign: 'left'
            }}
            onClick={() => setCurrentTab('jobs')}
          >
            <Briefcase size={18} style={{ color: 'var(--primary)' }} />
            Ofertas de Empleo
          </button>

          <button
            className={`btn btn-secondary`}
            style={{
              justifyContent: 'flex-start',
              background: currentTab === 'chat' ? 'rgba(57,169,0,0.18)' : 'transparent',
              borderColor: currentTab === 'chat' ? 'var(--primary)' : 'transparent',
              textAlign: 'left'
            }}
            onClick={() => setCurrentTab('chat')}
          >
            <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
            Chat Institucional
          </button>

          <button
            className={`btn btn-secondary`}
            style={{
              justifyContent: 'flex-start',
              background: currentTab === 'notifications' ? 'rgba(57,169,0,0.18)' : 'transparent',
              borderColor: currentTab === 'notifications' ? 'var(--primary)' : 'transparent',
              textAlign: 'left',
              position: 'relative'
            }}
            onClick={() => setCurrentTab('notifications')}
          >
            <Bell size={18} style={{ color: 'var(--primary)' }} />
            Notificaciones
            {unreadNotifsCount > 0 && (
              <span style={{
                position: 'absolute',
                right: '16px',
                background: 'var(--error)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>{unreadNotifsCount}</span>
            )}
          </button>

          <button
            className={`btn btn-secondary`}
            style={{
              justifyContent: 'flex-start',
              background: currentTab === 'profile' ? 'rgba(57,169,0,0.18)' : 'transparent',
              borderColor: currentTab === 'profile' ? 'var(--primary)' : 'transparent',
              textAlign: 'left'
            }}
            onClick={() => setCurrentTab('profile')}
          >
            <User size={18} style={{ color: 'var(--primary)' }} />
            Mi Perfil
          </button>

          {currentUser.role === 'administrador' && (
            <button
              className={`btn btn-secondary`}
              style={{
                justifyContent: 'flex-start',
                background: currentTab === 'admin' ? 'rgba(239,68,68,0.12)' : 'transparent',
                borderColor: currentTab === 'admin' ? 'rgba(239,68,68,0.4)' : 'transparent',
                textAlign: 'left'
              }}
              onClick={() => setCurrentTab('admin')}
            >
              <Users size={18} style={{ color: '#ef4444' }} />
              Administración
            </button>
          )}
        </nav>

        {/* Footer info & Logout */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(57, 169, 0, 0.1)' }}>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Alerts Center */}
        {successMessage && (
          <div className="badge badge-verified animate-fade-in" style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 1000,
            padding: '14px 20px',
            borderRadius: '8px',
            fontSize: '0.92rem',
            boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--success)'
          }}>
            <CheckCircle size={18} style={{ marginRight: '8px', color: 'var(--success)' }} />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="badge badge-danger animate-fade-in" style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 1000,
            padding: '14px 20px',
            borderRadius: '8px',
            fontSize: '0.92rem',
            boxShadow: '0 8px 32px rgba(239,68,68,0.3)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--error)'
          }}>
            <ShieldAlert size={18} style={{ marginRight: '8px', color: 'var(--error)' }} />
            {errorMessage}
          </div>
        )}

        {/* Dynamic Views Router */}
        {currentTab === 'dashboard' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1>Bienvenido, {currentUser.username}</h1>
              <p className="subtitle">
                {currentUser.role === 'estudiante'
                  ? `Estudiante del programa ${currentUser.program}. Aquí tienes tus sugerencias académicas de hoy.`
                  : currentUser.role === 'docente'
                    ? `Instructor líder de formación del SENA. Administra materiales pedagógicos y ofertas laborales.`
                    : `Administrador de sistemas SENA Connect. Control total y confidencial del sistema.`
                }
              </p>
            </div>

            {/* Quick stats row */}
            <div className="grid-3">
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(57,169,0,0.15)', color: 'var(--primary)' }}>
                  <BookMarked size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.6rem' }}>{documents.length}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Recursos de Formación</p>
                </div>
              </div>
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(57,169,0,0.15)', color: 'var(--primary)' }}>
                  <Briefcase size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.6rem' }}>{jobs.length}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ofertas Laborales Activas</p>
                </div>
              </div>
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(57,169,0,0.15)', color: 'var(--primary)' }}>
                  <Bell size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.6rem' }}>{unreadNotifsCount}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Alertas sin Leer</p>
                </div>
              </div>
            </div>

            {/* Recommended Materials (Spec specific) */}
            <div>
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen style={{ color: 'var(--primary)' }} />
                Recursos Recomendados por Instructores
              </h2>
              <div className="grid-2">
                {documents.filter(d => d.recommended).slice(0, 4).map(doc => (
                  <div key={doc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge badge-admin" style={{ fontSize: '0.7rem' }}>{doc.program}</span>
                      <span className="badge badge-verified" style={{ fontSize: '0.68rem', display: 'flex', gap: '4px' }}>
                        <Award size={10} /> Recomendado
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem' }}>{doc.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1 }}>{doc.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Sugerido por: <strong>{doc.suggestedBy}</strong></span>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                        Consultar <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
                {documents.filter(d => d.recommended).length === 0 && (
                  <div className="glass-card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No hay recomendaciones especiales en este momento.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Academic profile highlight */}
            <div className="grid-2">
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award style={{ color: 'var(--primary)' }} />
                  Tu Resumen SENA
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.92rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cuenta:</span>
                    <strong style={{ color: 'var(--primary)' }}>{currentUser.email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Rol Asignado:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{currentUser.role}</strong>
                  </div>
                  {currentUser.role === 'estudiante' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Programa Académico:</span>
                      <strong>{currentUser.program}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Miembro Desde:</span>
                    <strong>{new Date(currentUser.created_at).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>Accesos Rápidos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', height: '100%' }}>
                  <button onClick={() => setCurrentTab('documents')} className="btn btn-secondary" style={{ flexDirection: 'column', gap: '8px', padding: '16px' }}>
                    <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                    Ver Guías
                  </button>
                  <button onClick={() => setCurrentTab('jobs')} className="btn btn-secondary" style={{ flexDirection: 'column', gap: '8px', padding: '16px' }}>
                    <Briefcase size={20} style={{ color: 'var(--primary)' }} />
                    Ver Empleos
                  </button>
                  <button onClick={() => setCurrentTab('chat')} className="btn btn-secondary" style={{ flexDirection: 'column', gap: '8px', padding: '16px' }}>
                    <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
                    Iniciar Chat
                  </button>
                  <button onClick={() => setCurrentTab('profile')} className="btn btn-secondary" style={{ flexDirection: 'column', gap: '8px', padding: '16px' }}>
                    <User size={20} style={{ color: 'var(--primary)' }} />
                    Editar Perfil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'documents' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1>Materiales Pedagógicos y de Estudio</h1>
                <p className="subtitle">Consulta recursos compartidos por tus instructores del SENA.</p>
              </div>
            </div>

            {/* Docente / Admin Upload panel */}
            {(currentUser.role === 'docente' || currentUser.role === 'administrador') && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Plus style={{ color: 'var(--primary)' }} />
                  Publicar Nuevo Material Académico
                </h3>
                <form onSubmit={handleUploadDocument} className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Título del Recurso</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Guía práctica de SQL y disparadores"
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Programa Temático</label>
                    <select
                      className="form-control"
                      value={docProgram}
                      onChange={e => setDocProgram(e.target.value)}
                    >
                      {programsList.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">URL del Documento / Recurso (Enlace)</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://drive.google.com/... o https://recurso.com"
                      value={docUrl}
                      onChange={e => setDocUrl(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Breve Descripción / Instrucciones</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Explica a los estudiantes qué aprenderán con este recurso..."
                      value={docDesc}
                      onChange={e => setDocDesc(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="docRecommended"
                      style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      checked={docRecommended}
                      onChange={e => setDocRecommended(e.target.checked)}
                    />
                    <label htmlFor="docRecommended" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                      Recomendar material en la página de inicio
                    </label>
                  </div>
                  <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                    <button type="submit" className="btn btn-primary">
                      <Plus size={18} /> Publicar y Compartir
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar guías por palabra clave..."
                  style={{ paddingLeft: '44px' }}
                  value={searchDocQuery}
                  onChange={e => setSearchDocQuery(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="form-control"
                  style={{ minWidth: '220px' }}
                  value={filterProgram}
                  onChange={e => setFilterProgram(e.target.value)}
                >
                  <option value="Todos">Todos los Programas</option>
                  {programsList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Documents List */}
            <div className="grid-2">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-student">{doc.program}</span>
                    {doc.recommended && (
                      <span className="badge badge-verified" style={{ fontSize: '0.68rem', display: 'flex', gap: '4px' }}>
                        Recomendado
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.2rem' }}>{doc.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1 }}>{doc.description}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Subido por: <strong>{doc.suggestedBy}</strong></span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                        Consultar Enlace <ExternalLink size={14} />
                      </a>

                      {/* Delete option if admin or instructor author */}
                      {(currentUser.role === 'administrador' || doc.suggestedBy === currentUser.username) && (
                        <button onClick={() => handleDeleteDocument(doc.id)} className="btn btn-danger" style={{ padding: '8px 10px' }} title="Eliminar recurso">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredDocs.length === 0 && (
                <div className="glass-card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px' }}>
                  <BookMarked size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
                  <h3>No se encontraron recursos</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Prueba ajustando la búsqueda o el filtro de programas.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'jobs' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1>Ofertas de Empleo y Prácticas SENA</h1>
              <p className="subtitle">Vacantes exclusivas y pasantías patrocinadas para estudiantes y egresados.</p>
            </div>

            {/* Post Job Panel (Docente / Admin only) */}
            {(currentUser.role === 'docente' || currentUser.role === 'administrador') && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Plus style={{ color: 'var(--primary)' }} />
                  Publicar Nueva Oferta Laboral
                </h3>
                <form onSubmit={handlePostJob} className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Título del Cargo</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Desarrollador Frontend React Jr"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Empresa Contratante</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Bancolombia"
                      value={jobCompany}
                      onChange={e => setJobCompany(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Asignación Salarial Estimada</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. $ 2.200.000 COP"
                      value={jobSalary}
                      onChange={e => setJobSalary(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ubicación de la Vacante</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Medellín / Híbrido"
                      value={jobLocation}
                      onChange={e => setJobLocation(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Descripción de las Labores</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Escribe detalladamente las funciones principales de la posición..."
                      value={jobDesc}
                      onChange={e => setJobDesc(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Requisitos Exigidos</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Egresado tecnólogo ADSO, manejo de HTML5, JS, bases de datos SQL..."
                      value={jobRequirements}
                      onChange={e => setJobRequirements(e.target.value)}
                    ></textarea>
                  </div>
                  <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                    <button type="submit" className="btn btn-primary">
                      <Plus size={18} /> Publicar Empleo
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter Search Bar */}
            <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar vacantes por empresa o perfil..."
                  style={{ paddingLeft: '44px' }}
                  value={searchJobQuery}
                  onChange={e => setSearchJobQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Jobs List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredJobs.map(job => {
                const alreadyApplied = job.applicants.includes(currentUser.id);
                return (
                  <div key={job.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.4rem' }}>{job.title}</h2>
                        <h4 style={{ color: 'var(--primary)', marginTop: '4px', fontSize: '1.02rem' }}>{job.company}</h4>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} /> {job.location}
                        </span>
                        <span style={{ fontSize: '0.88rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                          <DollarSign size={14} /> {job.salary}
                        </span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(57,169,0,0.1)', borderBottom: '1px solid rgba(57,169,0,0.1)', padding: '14px 0', fontSize: '0.94rem' }}>
                      <p style={{ lineHeight: '1.5' }}><strong>Descripción:</strong> {job.description}</p>
                      <p style={{ marginTop: '8px', lineHeight: '1.5' }}><strong>Requisitos:</strong> {job.requirements}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Candidatos postulados: <strong>{job.applicants.length}</strong>
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {currentUser.role === 'estudiante' && (
                          <button
                            onClick={() => handleApplyJob(job.id)}
                            disabled={alreadyApplied}
                            className={`btn ${alreadyApplied ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ opacity: alreadyApplied ? 0.7 : 1, cursor: alreadyApplied ? 'not-allowed' : 'pointer' }}
                          >
                            {alreadyApplied ? (
                              <>
                                <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                                Postulado con Éxito
                              </>
                            ) : 'Postularme a la vacante'}
                          </button>
                        )}

                        {/* Admin or teacher can delete */}
                        {(currentUser.role === 'administrador' || currentUser.role === 'docente') && (
                          <button onClick={() => handleDeleteJob(job.id)} className="btn btn-danger">
                            <Trash2 size={16} /> Retirar Oferta
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                  <Briefcase size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
                  <h3>No se encontraron ofertas laborales</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Intenta realizar otra búsqueda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'chat' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            <div>
              <h1>Chat e Interacción Institucional</h1>
              <p className="subtitle">Comunícate de manera instantánea y segura con instructores, compañeros o administradores.</p>
            </div>

            <div className="glass-panel chat-container" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              {/* Chat Sidebar recipients */}
              <div className="chat-sidebar">
                <h4 style={{ marginBottom: '12px', paddingLeft: '4px', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Miembros Activos
                </h4>
                {allUsersChat.map(user => {
                  const isActive = activeChatUser && activeChatUser.id === user.id;
                  return (
                    <div
                      key={user.id}
                      className={`chat-user-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveChatUser(user)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-highlight)' }}>
                          {user.username}
                        </strong>
                        <span className={`badge ${user.role === 'administrador' ? 'badge-admin' :
                          user.role === 'docente' ? 'badge-teacher' : 'badge-student'
                          }`} style={{ scale: '0.75' }}>
                          {user.role}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {user.program || 'SENA'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Main conversation window */}
              <div className="chat-main">
                {activeChatUser ? (
                  <>
                    <div className="chat-header">
                      <div>
                        <h3>{activeChatUser.username}</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Rol: {activeChatUser.role} | {activeChatUser.program || 'Comunidad SENA'}
                        </p>
                      </div>
                      {activeChatUser.verified && <CheckCircle size={16} style={{ color: 'var(--success)' }} />}
                    </div>

                    <div className="chat-messages">
                      {activeChatMessages.map(msg => {
                        const isSentByMe = msg.senderId === currentUser.id;
                        return (
                          <div
                            key={msg.id}
                            className={`chat-bubble ${isSentByMe ? 'sent' : 'received'}`}
                          >
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '2px', color: isSentByMe ? 'rgba(255,255,255,0.8)' : 'var(--primary)' }}>
                              {msg.senderName}
                            </div>
                            <div>{msg.content}</div>
                            <div style={{
                              fontSize: '0.65rem',
                              textAlign: 'right',
                              marginTop: '4px',
                              color: isSentByMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)'
                            }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}

                      {activeChatMessages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                          No hay mensajes anteriores en este chat. Escribe un mensaje abajo para comenzar.
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="chat-input-area">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Escribe tu mensaje institucional de forma respetuosa..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
                        <Send size={18} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px', textAlign: 'center' }}>
                    <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }} />
                    <h3>Bandeja de Entrada</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
                      Selecciona un miembro activo de la barra lateral izquierda para iniciar una conversación instantánea.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'notifications' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1>Centro de Notificaciones e Historial</h1>
                <p className="subtitle">Novedades importantes sobre materiales, ofertas o estados de roles.</p>
              </div>
              {notifications.length > 0 && (
                <button onClick={handleMarkAllNotifsRead} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  Marcar todo como leído
                </button>
              )}
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notif-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleMarkNotifRead(notif.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {!notif.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>}
                      <span style={{ fontWeight: '500', color: notif.read ? 'var(--text-muted)' : 'var(--text-highlight)' }}>
                        {notif.message}
                      </span>
                    </div>
                    <span className="notif-time">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  <Bell size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <h3>No tienes notificaciones registradas</h3>
                  <p>Te notificaremos cuando instructores publiquen guías o recibas mensajes.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'profile' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1>Ajustes de mi Perfil Académico</h1>
              <p className="subtitle">Gestiona tu información pública, biografía y programa académico del SENA.</p>
            </div>

            <div className="grid-2">
              <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  color: 'white',
                  fontSize: '2.5rem',
                  boxShadow: '0 0 20px var(--primary-glow)'
                }}>
                  {currentUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.6rem' }}>{currentUser.username}</h2>
                  <p style={{ color: 'var(--primary)', fontWeight: '600', textTransform: 'capitalize', marginTop: '4px' }}>
                    Instructor / {currentUser.role}
                  </p>
                  {currentUser.verified && (
                    <span className="badge badge-verified" style={{ marginTop: '8px', display: 'inline-flex', gap: '5px' }}>
                      <CheckCircle size={12} /> Egresado/Estudiante Verificado
                    </span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(57,169,0,0.1)', width: '100%', paddingTop: '16px', fontSize: '0.9rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p><strong>Correo SENA:</strong> <span style={{ color: 'var(--text-muted)' }}>{currentUser.email}</span></p>
                  {currentUser.role === 'estudiante' && (
                    <p><strong>Programa:</strong> <span style={{ color: 'var(--text-muted)' }}>{currentUser.program}</span></p>
                  )}
                  <p><strong>Biografía:</strong> <span style={{ color: 'var(--text-muted)' }}>{currentUser.bio || 'Sin biografía añadida.'}</span></p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px' }}>Actualizar Información</h3>
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group">
                    <label className="form-label">Mi Biografía / Presentación</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Cuéntanos un poco sobre ti, tus intereses técnicos y metas académicas..."
                      value={profileBio}
                      onChange={e => setProfileBio(e.target.value)}
                    ></textarea>
                  </div>
                  {currentUser.role === 'estudiante' && (
                    <div className="form-group">
                      <label className="form-label">Programa de Formación</label>
                      <select
                        className="form-control"
                        value={profileProgram}
                        onChange={e => setProfileProgram(e.target.value)}
                      >
                        {programsList.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Cambiar Contraseña (Opcional)</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Ingresa nueva contraseña si deseas cambiarla"
                      value={profilePassword}
                      onChange={e => setProfilePassword(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Guardar Cambios del Perfil
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'admin' && currentUser.role === 'administrador' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1>Confidencial: Panel de Control Administrativo</h1>
              <p className="subtitle">Gestión estricta de usuarios, roles, permisos y confidencialidad del SENA.</p>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock style={{ color: 'var(--primary)' }} />
                  Base de Datos de Usuarios y Roles Registrados
                </h3>
                <span className="badge badge-admin" style={{ fontSize: '0.8rem' }}>
                  Control Activo
                </span>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Usuario / Correo</th>
                      <th>Rol</th>
                      <th>Permisos Asignados</th>
                      <th>Verificado</th>
                      <th style={{ textAlign: 'right' }}>Acciones del Sistema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(user => {
                      const isMe = user.id === currentUser.id;
                      return (
                        <tr key={user.id}>
                          <td>
                            <div><strong>{user.username}</strong></div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.email}</span>
                          </td>
                          <td>
                            <select
                              className="form-control"
                              style={{ padding: '6px 10px', fontSize: '0.85rem', width: '140px' }}
                              value={user.role}
                              disabled={isMe}
                              onChange={e => handleAdminUpdateUser(user.id, e.target.value, user.permissions, user.verified)}
                            >
                              <option value="estudiante">estudiante</option>
                              <option value="docente">docente</option>
                              <option value="administrador">administrador</option>
                            </select>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {['lectura', 'escritura', 'actualizacion', 'eliminacion', 'administracion'].map(perm => {
                                const hasPerm = user.permissions.includes(perm);
                                return (
                                  <span
                                    key={perm}
                                    onClick={() => {
                                      if (isMe) return;
                                      const newPerms = hasPerm
                                        ? user.permissions.filter(p => p !== perm)
                                        : [...user.permissions, perm];
                                      handleAdminUpdateUser(user.id, user.role, newPerms, user.verified);
                                    }}
                                    className="badge"
                                    style={{
                                      fontSize: '0.62rem',
                                      padding: '2px 6px',
                                      cursor: isMe ? 'default' : 'pointer',
                                      background: hasPerm ? 'rgba(57,169,0,0.18)' : 'rgba(255,255,255,0.03)',
                                      color: hasPerm ? 'var(--primary)' : 'var(--text-muted)',
                                      border: `1px solid ${hasPerm ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`
                                    }}
                                  >
                                    {perm}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={user.verified}
                              disabled={isMe}
                              onChange={e => handleAdminUpdateUser(user.id, user.role, user.permissions, e.target.checked)}
                              style={{ transform: 'scale(1.1)', cursor: isMe ? 'default' : 'pointer' }}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleAdminDeleteUser(user.id)}
                              disabled={isMe}
                              className="btn btn-danger"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: isMe ? 0.5 : 1, cursor: isMe ? 'not-allowed' : 'pointer' }}
                            >
                              Revocar Acceso
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
