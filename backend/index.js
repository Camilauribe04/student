const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sena_secret_key_extremely_secure';

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware for JWT Verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// Middleware to authorize specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const user = db.getUserById(req.user.id);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
    }
    next();
  };
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor Backend del SENA en funcionamiento',
    status: 'online',
    version: '1.0.0'
  });
});

// ================= AUTHENTICATION =================

// Register User
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password, role, program } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben completarse.' });
    }

    // Validate role constraint
    const allowedRoles = ['estudiante', 'docente', 'administrador'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'El rol especificado no es válido.' });
    }

    // Strict validation for active SENA account email
    const senaEmailRegex = /^[a-zA-Z0-9._%+-]+@(sena\.edu\.co|misena\.edu\.co|soy\.sena\.edu\.co)$/i;
    if (!senaEmailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'El correo electrónico debe ser una cuenta institucional activa del SENA (@sena.edu.co, @misena.edu.co, @soy.sena.edu.co).' 
      });
    }

    // Unique checks
    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }
    if (db.getUserByUsername(username)) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
    }

    // Create user
    const newUser = db.createUser({
      username,
      email,
      password,
      role,
      program: program || 'Sin asignar'
    });

    // Generate JWT
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error del servidor al registrar el usuario.' });
  }
});

// Login User
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Por favor proporcione correo y contraseña.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas o correo no registrado.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const updates = {};
    const { bio, program, password } = req.body;

    if (bio !== undefined) updates.bio = bio;
    if (program !== undefined) updates.program = program;
    if (password) updates.password = password;

    const updatedUser = db.updateUser(req.user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({
      message: 'Perfil actualizado exitosamente',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});


// ================= DOCUMENTS MANAGEMENT =================

// Get all documents
app.get('/api/documents', authenticateToken, (req, res) => {
  try {
    const docs = db.getDocuments();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener documentos.' });
  }
});

// Upload study document (Teachers & Admins only)
app.post('/api/documents', authenticateToken, authorizeRoles('docente', 'administrador'), (req, res) => {
  try {
    const { title, program, url, description, recommended } = req.body;

    if (!title || !program || !url || !description) {
      return res.status(400).json({ error: 'Todos los campos del documento son obligatorios.' });
    }

    const user = db.getUserById(req.user.id);

    const newDoc = db.createDocument({
      title,
      program,
      url,
      description,
      suggestedBy: user.username,
      recommended: !!recommended
    });

    // Notify all students in the program (or globally for simplicity)
    const students = db.getUsers().filter(u => u.role === 'estudiante');
    students.forEach(student => {
      db.createNotification(
        student.id,
        `La instructora ${user.username} ha recomendado un nuevo documento: "${title}" para ${program}.`
      );
    });

    res.status(201).json({
      message: 'Documento académico publicado y compartido con los estudiantes.',
      document: newDoc
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al publicar documento.' });
  }
});

// Delete document (Creator or Admin)
app.delete('/api/documents/:id', authenticateToken, (req, res) => {
  try {
    const docId = req.params.id;
    const docs = db.getDocuments();
    const doc = docs.find(d => d.id === docId);

    if (!doc) {
      return res.status(404).json({ error: 'Documento no encontrado.' });
    }

    const user = db.getUserById(req.user.id);

    // Check permissions: creator or admin
    if (user.role !== 'administrador' && doc.suggestedBy !== user.username) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este documento.' });
    }

    const deleted = db.deleteDocument(docId);
    if (deleted) {
      res.json({ message: 'Documento eliminado exitosamente.' });
    } else {
      res.status(400).json({ error: 'No se pudo eliminar el documento.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el documento.' });
  }
});


// ================= JOBS BOARD =================

// Get all job offers
app.get('/api/jobs', authenticateToken, (req, res) => {
  try {
    const jobs = db.getJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las ofertas de empleo.' });
  }
});

// Post a job offer (Admin or Teacher)
app.post('/api/jobs', authenticateToken, authorizeRoles('docente', 'administrador'), (req, res) => {
  try {
    const { title, company, description, requirements, salary, location } = req.body;

    if (!title || !company || !description || !requirements || !salary || !location) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const newJob = db.createJob({
      title,
      company,
      description,
      requirements,
      salary,
      location
    });

    // Notify all students
    const students = db.getUsers().filter(u => u.role === 'estudiante');
    students.forEach(student => {
      db.createNotification(
        student.id,
        `Nueva oferta de empleo disponible: "${title}" en ${company} (${location}).`
      );
    });

    res.status(201).json({
      message: 'Oferta de empleo publicada exitosamente.',
      job: newJob
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al publicar la oferta de empleo.' });
  }
});

// Apply to a job (Student only)
app.post('/api/jobs/:id/apply', authenticateToken, authorizeRoles('estudiante'), (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    const job = db.getJobs().find(j => j.id === jobId);
    if (!job) {
      return res.status(404).json({ error: 'Oferta de empleo no encontrada.' });
    }

    if (job.applicants.includes(userId)) {
      return res.status(400).json({ error: 'Ya te has postulado a esta oferta de empleo.' });
    }

    const updatedJob = db.applyToJob(jobId, userId);
    
    // Create status notification
    db.createNotification(userId, `Te has postulado exitosamente a la vacante: "${job.title}" de ${job.company}. ¡Tu progreso ha aumentado!`);

    res.json({
      message: 'Postulación enviada con éxito. ¡Sigue así! Tu progreso académico y profesional se actualizó.',
      job: updatedJob
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al aplicar a la oferta.' });
  }
});

// Delete job (Admin or Docente creator)
app.delete('/api/jobs/:id', authenticateToken, authorizeRoles('administrador', 'docente'), (req, res) => {
  try {
    const deleted = db.deleteJob(req.params.id);
    if (deleted) {
      res.json({ message: 'Oferta de empleo eliminada.' });
    } else {
      res.status(404).json({ error: 'No se encontró la oferta de empleo.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar oferta.' });
  }
});


// ================= INSTANT MESSAGING (CHAT) =================

// Get all messages for current user
app.get('/api/messages', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const allMessages = db.getMessages();
    
    // Filter messages where user is sender OR receiver
    const userMessages = allMessages.filter(
      msg => msg.senderId === userId || msg.receiverId === userId
    );
    
    res.json(userMessages);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mensajes.' });
  }
});

// Send a message
app.post('/api/messages', authenticateToken, (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content || content.trim() === '') {
      return res.status(400).json({ error: 'El destinatario y el mensaje son obligatorios.' });
    }

    const sender = db.getUserById(senderId);
    const receiver = db.getUserById(receiverId);

    if (!receiver) {
      return res.status(404).json({ error: 'Destinatario no encontrado.' });
    }

    const newMsg = db.createMessage({
      senderId,
      senderName: sender.role === 'docente' ? `Instructora ${sender.username}` : sender.username,
      senderRole: sender.role,
      receiverId,
      receiverName: receiver.role === 'docente' ? `Instructora ${receiver.username}` : receiver.username,
      content
    });

    // Create a notification for the receiver
    db.createNotification(
      receiverId,
      `Tienes un nuevo mensaje de ${sender.username}: "${content.length > 30 ? content.substring(0, 30) + '...' : content}"`
    );

    res.status(201).json(newMsg);
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar mensaje.' });
  }
});


// ================= NOTIFICATIONS =================

// Get notifications for current user
app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const userNotifs = db.getNotifications().filter(n => n.userId === req.user.id);
    // Sort by timestamp descending (newest first)
    userNotifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(userNotifs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones.' });
  }
});

// Mark single notification as read
app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
  try {
    const success = db.markNotificationRead(req.params.id);
    if (success) {
      res.json({ message: 'Notificación marcada como leída.' });
    } else {
      res.status(404).json({ error: 'Notificación no encontrada.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar notificación.' });
  }
});

// Mark all as read
app.post('/api/notifications/read-all', authenticateToken, (req, res) => {
  try {
    db.markAllNotificationsRead(req.user.id);
    res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar notificaciones.' });
  }
});


// ================= ADMINISTRATION (ADMIN ONLY) =================

// Get all users (Admin only)
app.get('/api/admin/users', authenticateToken, authorizeRoles('administrador'), (req, res) => {
  try {
    const users = db.getUsers();
    // Strip passwords before sending
    const safeUsers = users.map(({ password, ...u }) => u);
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lista de usuarios.' });
  }
});

// Edit user role/permissions (Admin only)
app.put('/api/admin/users/:id', authenticateToken, authorizeRoles('administrador'), (req, res) => {
  try {
    const userId = req.params.id;
    const { role, permissions, verified } = req.body;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Prevent changing own role (Admin safety guard)
    if (userId === req.user.id && role && role !== 'administrador') {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol de Administrador.' });
    }

    const updates = {};
    if (role) {
      const allowedRoles = ['estudiante', 'docente', 'administrador'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Rol inválido.' });
      }
      updates.role = role;
    }

    if (permissions) {
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Las credenciales de permisos deben ser un arreglo de strings.' });
      }
      updates.permissions = permissions;
    }

    if (verified !== undefined) {
      updates.verified = !!verified;
    }

    const updatedUser = db.updateUser(userId, updates);
    const { password: _, ...safeUser } = updatedUser;

    // Notify the user about the change in role/permissions
    db.createNotification(
      userId,
      `Un administrador ha actualizado tus permisos o tu rol. Nuevo rol: ${safeUser.role}.`
    );

    res.json({
      message: 'Rol y permisos de usuario actualizados exitosamente con máxima confidencialidad.',
      user: safeUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al modificar permisos de usuario.' });
  }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:id', authenticateToken, authorizeRoles('administrador'), (req, res) => {
  try {
    const userId = req.params.id;
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de Administrador.' });
    }

    const success = db.deleteUser(userId);
    if (success) {
      res.json({ message: 'Usuario revocado y eliminado permanentemente del sistema.' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`  Entorno configurado y listo para pruebas locales.`);
  console.log(`==================================================`);
});
