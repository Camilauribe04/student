const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'db.json');

// Initial seed data
const initialData = {
  users: [
    {
      id: "u1",
      username: "admin_sena",
      email: "admin@sena.edu.co",
      password: "", // Will be hashed below
      role: "administrador",
      permissions: ["lectura", "escritura", "eliminacion", "actualizacion", "administracion"],
      program: "Administración de Sistemas",
      progress: 100,
      verified: true,
      bio: "Administrador de la plataforma de recursos académicos del SENA.",
      created_at: new Date().toISOString()
    },
    {
      id: "u2",
      username: "docente_maria",
      email: "maria.gomez@sena.edu.co",
      password: "", // Will be hashed below
      role: "docente",
      permissions: ["lectura", "escritura", "actualizacion"],
      program: "Análisis y Desarrollo de Software (ADSO)",
      progress: 85,
      verified: true,
      bio: "Docente del programa de Tecnología en Análisis y Desarrollo de Software.",
      created_at: new Date().toISOString()
    },
    {
      id: "u3",
      username: "estudiante_carlos",
      email: "carlos.sanchez@misena.edu.co",
      password: "", // Will be hashed below
      role: "estudiante",
      permissions: ["lectura"],
      program: "Análisis y Desarrollo de Software (ADSO)",
      progress: 45,
      verified: true,
      bio: "Aprendiz apasionado por el desarrollo web frontend y backend.",
      created_at: new Date().toISOString()
    }
  ],
  documents: [
    {
      id: "d1",
      title: "Guía de React 19 y Hooks",
      program: "Análisis y Desarrollo de Software (ADSO)",
      url: "https://react.dev",
      description: "Aprende los conceptos fundamentales de React 19, incluyendo useState, useEffect y los nuevos hooks.",
      suggestedBy: "docente_maria",
      recommended: true,
      status: "aprobado",
      created_at: new Date().toISOString()
    },
    {
      id: "d2",
      title: "Manual de PostgreSQL Avanzado",
      program: "Análisis y Desarrollo de Software (ADSO)",
      url: "https://www.postgresql.org/docs/",
      description: "Manual detallado para diseño de bases de datos relacionales, optimización de consultas e indexación.",
      suggestedBy: "docente_maria",
      recommended: true,
      status: "aprobado",
      created_at: new Date().toISOString()
    },
    {
      id: "d3",
      title: "Guía de Estilos CSS Moderno",
      program: "Multimedia y Diseño",
      url: "https://developer.mozilla.org/es/docs/Web/CSS",
      description: "Técnicas modernas de CSS Grid, Flexbox, y Custom Properties para crear layouts espectaculares.",
      suggestedBy: "docente_maria",
      recommended: false,
      status: "aprobado",
      created_at: new Date().toISOString()
    }
  ],
  jobs: [
    {
      id: "j1",
      title: "Desarrollador Junior React & Node",
      company: "Globant Colombia",
      description: "Buscamos aprendiz egresado del SENA para el rol de Desarrollador Junior Fullstack. Oportunidad de crecimiento y plan de carrera.",
      requirements: "Conocimientos básicos de React, Express y bases de datos relacionales. Proactivo y con ganas de aprender.",
      salary: "$ 2.200.000 COP",
      location: "Bogotá / Remoto",
      applicants: ["u3"],
      created_at: new Date().toISOString()
    },
    {
      id: "j2",
      title: "Diseñador Web / Multimedia UI-UX",
      company: "MercadoLibre",
      description: "Buscamos egresados de programas de multimedia o diseño de software para integrarse a nuestro equipo de diseño de producto.",
      requirements: "Figma, CSS3 moderno, bases de accesibilidad web y portafolio de proyectos.",
      salary: "$ 2.500.000 COP",
      location: "Medellín / Híbrido",
      applicants: [],
      created_at: new Date().toISOString()
    },
    {
      id: "j3",
      title: "Analista de Base de Datos SQL",
      company: "Bancolombia",
      description: "Apoyo en la gestión, mantenimiento y migración de bases de datos PostgreSQL y Oracle.",
      requirements: "Conocimientos en consultas SQL complejas, optimización y diseño de esquemas relacionales.",
      salary: "$ 2.800.000 COP",
      location: "Medellín",
      applicants: [],
      created_at: new Date().toISOString()
    }
  ],
  messages: [
    {
      id: "m1",
      senderId: "u2",
      senderName: "Docente María",
      senderRole: "docente",
      receiverId: "u3",
      receiverName: "Estudiante Carlos",
      content: "Hola Carlos, ¿cómo vas con el proyecto de software? Recuerda que debes subir la documentación a la plataforma.",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
    },
    {
      id: "m2",
      senderId: "u3",
      senderName: "Estudiante Carlos",
      senderRole: "estudiante",
      receiverId: "u2",
      receiverName: "Docente María",
      content: "Hola instructora María! Voy muy bien, ya subí el documento de la guía de React que me recomendó. Estoy terminando el backend.",
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }
  ],
  notifications: [
    {
      id: "n1",
      userId: "u3",
      message: "La instructora María Gómez te ha recomendado el documento 'Guía de React 19 y Hooks'.",
      read: false,
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: "n2",
      userId: "u3",
      message: "Nueva oferta de empleo publicada: Desarrollador Junior React & Node en Globant.",
      read: false,
      timestamp: new Date().toISOString()
    }
  ]
};

// Ensure database file exists and is populated
function initDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      console.log("Initializing database with seed data...");
      
      // Hash default passwords
      initialData.users[0].password = bcrypt.hashSync("Admin123!", 10);
      initialData.users[1].password = bcrypt.hashSync("Docente123!", 10);
      initialData.users[2].password = bcrypt.hashSync("Estudiante123!", 10);
      
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
      console.log("Database initialized successfully!");
    } else {
      // Validate that DB content is proper JSON
      const content = fs.readFileSync(dbPath, 'utf-8');
      JSON.parse(content);
    }
  } catch (error) {
    console.error("Error initializing database, recreating...", error);
    initialData.users[0].password = bcrypt.hashSync("Admin123!", 10);
    initialData.users[1].password = bcrypt.hashSync("Docente123!", 10);
    initialData.users[2].password = bcrypt.hashSync("Estudiante123!", 10);
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

// Read database helper
function readDB() {
  try {
    initDB();
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return initialData;
  }
}

// Write database helper
function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error("Error writing database:", error);
    return false;
  }
}

// Database methods
const db = {
  // Users
  getUsers: () => readDB().users,
  getUserById: (id) => readDB().users.find(u => u.id === id),
  getUserByEmail: (email) => readDB().users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  getUserByUsername: (username) => readDB().users.find(u => u.username.toLowerCase() === username.toLowerCase()),
  createUser: (user) => {
    const data = readDB();
    const newUser = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      verified: user.email.endsWith('@sena.edu.co') || user.email.endsWith('@misena.edu.co'),
      progress: user.role === 'estudiante' ? 0 : 100,
      permissions: user.role === 'administrador' 
        ? ["lectura", "escritura", "eliminacion", "actualizacion", "administracion"]
        : user.role === 'docente' 
          ? ["lectura", "escritura", "actualizacion"] 
          : ["lectura"],
      bio: "Soy un miembro de la comunidad SENA.",
      created_at: new Date().toISOString(),
      ...user
    };
    // Hash password
    newUser.password = bcrypt.hashSync(user.password, 10);
    data.users.push(newUser);
    writeDB(data);
    return newUser;
  },
  updateUser: (id, updates) => {
    const data = readDB();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    
    // Don't allow changing sensitive fields directly if not admin, but handle normal updates
    const current = data.users[idx];
    if (updates.password) {
      updates.password = bcrypt.hashSync(updates.password, 10);
    }
    
    data.users[idx] = { ...current, ...updates };
    writeDB(data);
    return data.users[idx];
  },
  deleteUser: (id) => {
    const data = readDB();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    data.users.splice(idx, 1);
    writeDB(data);
    return true;
  },

  // Documents
  getDocuments: () => readDB().documents,
  createDocument: (doc) => {
    const data = readDB();
    const newDoc = {
      id: 'd_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      status: "aprobado",
      recommended: doc.recommended || false,
      ...doc
    };
    data.documents.push(newDoc);
    writeDB(data);
    return newDoc;
  },
  updateDocument: (id, updates) => {
    const data = readDB();
    const idx = data.documents.findIndex(d => d.id === id);
    if (idx === -1) return null;
    data.documents[idx] = { ...data.documents[idx], ...updates };
    writeDB(data);
    return data.documents[idx];
  },
  deleteDocument: (id) => {
    const data = readDB();
    const idx = data.documents.findIndex(d => d.id === id);
    if (idx === -1) return false;
    data.documents.splice(idx, 1);
    writeDB(data);
    return true;
  },

  // Jobs
  getJobs: () => readDB().jobs,
  createJob: (job) => {
    const data = readDB();
    const newJob = {
      id: 'j_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      applicants: [],
      ...job
    };
    data.jobs.push(newJob);
    writeDB(data);
    return newJob;
  },
  applyToJob: (jobId, userId) => {
    const data = readDB();
    const idx = data.jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return null;
    if (!data.jobs[idx].applicants.includes(userId)) {
      data.jobs[idx].applicants.push(userId);
      // Increment student progress when applying for jobs (as learning activity/professional step)
      const uidx = data.users.findIndex(u => u.id === userId);
      if (uidx !== -1 && data.users[uidx].role === 'estudiante') {
        data.users[uidx].progress = Math.min(100, (data.users[uidx].progress || 0) + 10);
      }
      writeDB(data);
    }
    return data.jobs[idx];
  },
  deleteJob: (id) => {
    const data = readDB();
    const idx = data.jobs.findIndex(j => j.id === id);
    if (idx === -1) return false;
    data.jobs.splice(idx, 1);
    writeDB(data);
    return true;
  },

  // Messages
  getMessages: () => readDB().messages,
  createMessage: (msg) => {
    const data = readDB();
    const newMsg = {
      id: 'm_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...msg
    };
    data.messages.push(newMsg);
    writeDB(data);
    return newMsg;
  },

  // Notifications
  getNotifications: () => readDB().notifications,
  createNotification: (userId, message) => {
    const data = readDB();
    const newNotif = {
      id: 'n_' + Math.random().toString(36).substr(2, 9),
      userId,
      message,
      read: false,
      timestamp: new Date().toISOString()
    };
    data.notifications.push(newNotif);
    writeDB(data);
    return newNotif;
  },
  markNotificationRead: (id) => {
    const data = readDB();
    const idx = data.notifications.findIndex(n => n.id === id);
    if (idx === -1) return false;
    data.notifications[idx].read = true;
    writeDB(data);
    return true;
  },
  markAllNotificationsRead: (userId) => {
    const data = readDB();
    data.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    writeDB(data);
    return true;
  }
};

// Trigger database seed check
initDB();

module.exports = db;
