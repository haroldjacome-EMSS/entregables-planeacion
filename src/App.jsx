import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, LabelList, Label
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS EN LA NUBE
// ==========================================
const PROD_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAuYFDbLmSUH2PUf1evsfgYt-bp50iJCiw",
  authDomain: "entregables-planeacion.firebaseapp.com",
  projectId: "entregables-planeacion",
  storageBucket: "entregables-planeacion.firebasestorage.app",
  messagingSenderId: "897578175960",
  appId: "1:897578175960:web:ca685f3211a8403328b6ad"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'emssanar-app';
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : (PROD_FIREBASE_CONFIG.apiKey ? PROD_FIREBASE_CONFIG : null);

let app, db, auth;

if (firebaseConfig) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

const STATUS = {
  ASIGNADO: 'Asignado',
  EN_PROGRESO: 'En progreso',
  EN_REVISION: 'En revisión',
  SOLICITUD_CONTINUIDAD: 'Solicita Continuidad',
  CUMPLIDO: 'Cumplido',
  CON_OBSERVACIONES: 'Ajustes',
  NO_CUMPLIDO: 'No Cumplido',
  CONTINUADO: 'Continuado',
  NO_REPORTADO: 'No Reportado'
};

const STATUS_COLORS = {
  [STATUS.ASIGNADO]: 'bg-gray-100 text-gray-700 border-gray-300',
  [STATUS.EN_PROGRESO]: 'bg-[#eef2f6] text-[#165399] border-[#165399]',
  [STATUS.EN_REVISION]: 'bg-gray-100 text-[#AAB4C2] border-[#AAB4C2]',
  [STATUS.SOLICITUD_CONTINUIDAD]: 'bg-purple-50 text-purple-700 border-purple-200',
  [STATUS.CUMPLIDO]: 'bg-[#f3f9eb] text-[#8CC63F] border-[#8CC63F]',
  [STATUS.CON_OBSERVACIONES]: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  [STATUS.NO_CUMPLIDO]: 'bg-red-100 text-red-800 border-red-500 font-bold',
  [STATUS.CONTINUADO]: 'bg-orange-50 text-orange-700 border-orange-200',
  [STATUS.NO_REPORTADO]: 'bg-red-50 text-red-700 border-red-500 font-bold',
};

const STATUS_HEX_COLORS = {
  [STATUS.ASIGNADO]: '#9CA3AF',
  [STATUS.EN_PROGRESO]: '#165399',
  [STATUS.EN_REVISION]: '#AAB4C2',
  [STATUS.SOLICITUD_CONTINUIDAD]: '#9333EA',
  [STATUS.CUMPLIDO]: '#8CC63F',
  [STATUS.CON_OBSERVACIONES]: '#EAB308',
  [STATUS.NO_CUMPLIDO]: '#f44236', 
  [STATUS.CONTINUADO]: '#F97316',
  [STATUS.NO_REPORTADO]: '#DC2626',
};

// ==========================================
// ⚠️ REVISA Y CORRIGE LOS CORREOS AQUÍ
// Deben coincidir exactamente con los que creaste en Firebase
// ==========================================
const DEFAULT_EMPLOYEES = [
  { id: '1085253822', email: 'johanavallejo@emssanareps.co', name: 'Jhoana Consuelo Vallejo Ramos', role: 'Jefe', canReview: true },
  { id: '1085929260', email: 'haroldjacome@emssanareps.co', name: 'Harold Andres Jacome', role: 'Coordinador', canReview: true },
  { id: '1144210824', email: 'angiechamputiz@emssanareps.co', name: 'Angie Carolina Champutiz Vera', role: 'Especializado', canReview: true },
  { id: '52706231', email: 'julianaruales@emssanareps.co', name: 'Iveth Juliana Ruales Reyes', role: 'Especializado', canReview: true },
  { id: '1085322527', email: 'andreaguzman@emssanareps.co', name: 'Catherine Andrea Guzman Cabrera', role: 'Junior', reviewerId: '52706231' },
  { id: '1085320212', email: 'alexandrasaavedra@emssanareps.co', name: 'Kelinn Alexandra Saavedra Moreno', role: 'Junior', reviewerId: '1144210824' },
  { id: '1085308340', email: 'andreschavez@emssanareps.co', name: 'Andres Giovani Chaves Rosales', role: 'Junior', reviewerId: '1085929260' },
  { id: '1085339480', email: 'angiepolo@emssanareps.co', name: 'Angie Carolina Polo Delgado', role: 'Junior', reviewerId: '1144210824' },
  { id: '1085320251', email: 'dianamarcelarodriguez@emssanareps.co', name: 'Diana Marcela Rodriguez Garcia', role: 'Junior', reviewerId: '1085929260' },
  { id: '1085331161', email: 'jesusyampuezan@emssanareps.co', name: 'Jesus Daniel Yampuezan Benavides', role: 'Junior', reviewerId: '1144210824' },
  { id: '1085318323', email: 'feliperealpe@emssanareps.co', name: 'Andrés Felipe Realpe Pantoja', role: 'Junior', reviewerId: '52706231' },
  { id: '1085324699', email: 'andresdelgado@emssanareps.co', name: 'Andrés Felipe Delgado Riascos', role: 'Junior', reviewerId: '52706231' },
  { id: '1094949915', email: 'jheisondiaz@emssanareps.co', name: 'Jheison Diaz Lopez', role: 'Junior', reviewerId: '1085929260' },
  { id: '1085322996', email: 'andrescabezas@emssanareps.co', name: 'Andrés Francisco Cabezas Dajome', role: 'Junior', reviewerId: '1085253822' },
  { id: '1087643352', email: 'harrisoncastillo@emssanareps.co', name: 'Harrison Hermel Castillo Chicunque', role: 'Aprendiz', reviewerId: '1085929260' }
];

const DEFAULT_CATEGORIES = [
  { 
    id: 1, name: 'Gestión y documentación de procesos', shortName: 'Procesos',
    subcategories: [
      { name: 'Subprocesos', maxWeeks: 4 }, { name: 'Protocolos y Rutas', maxWeeks: 4 },
      { name: 'Procedimientos', maxWeeks: 2 }, { name: 'Manuales', maxWeeks: 2 },
      { name: 'Formatos', maxWeeks: 1 }, { name: 'Indicadores', maxWeeks: 1 },
      { name: 'Socialización', maxWeeks: null }
    ]
  },
  { id: 2, name: 'Medición y análisis del desempeño', shortName: 'Desempeño' },
  { id: 3, name: 'Seguimiento a la gestión institucional', shortName: 'Seguimiento' },
  { id: 4, name: 'Auditoría y gestión de evidencias', shortName: 'Auditoría' },
  { id: 5, name: 'Soporte técnico y metodológico', shortName: 'Soporte' }
];

// MÓDULO NUEVO: INDICADORES POR DEFECTO
const DEFAULT_INDICATORS = [
  {
    id: 'ind-auto-1',
    name: 'Nivel de conformidad de productos asignados',
    formula: '(Entregables cumplidos / Entregables asignados en el mes) * 100',
    numVar: 'Entregables cumplidos en el mes',
    denVar: 'Total entregables asignados en el mes',
    meta: 100,
    isAuto: true // Si es true, el sistema lo calcula solo
  }
];

/* FUNCIONES AUXILIARES */
const getWeekData = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && dateInput.includes('/')) return dateInput; 
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const year = d.getUTCFullYear();
  const monday = new Date(d); monday.setUTCDate(monday.getUTCDate() - 3);
  const friday = new Date(monday); friday.setUTCDate(friday.getUTCDate() + 4);
  const formatDate = (dt) => `${dt.getUTCDate().toString().padStart(2, '0')}/${(dt.getUTCMonth() + 1).toString().padStart(2, '0')}/${dt.getUTCFullYear().toString().slice(-2)}`;
  return `${year}-W${weekNo.toString().padStart(2, '0')} (${formatDate(monday)} al ${formatDate(friday)})`;
};

const getNextWeekData = (weekString) => {
  if (!weekString) return getWeekData(new Date(Date.now() + 7 * 86400000));
  const match = weekString.match(/\((\d{2})\/(\d{2})\/(\d{2})/);
  if (match) {
    const year = parseInt(match[3], 10) + 2000;
    const date = new Date(year, parseInt(match[2], 10) - 1, parseInt(match[1], 10));
    date.setDate(date.getDate() + 7);
    return getWeekData(date);
  }
  return getWeekData(new Date(Date.now() + 7 * 86400000));
};

const getUpcomingWeeksList = () => {
  const weeks = [];
  const now = new Date();
  for (let i = -4; i < 12; i++) {
    weeks.push(getWeekData(new Date(now.getTime() + i * 7 * 86400000)));
  }
  return [...new Set(weeks)];
};

const getCurrentDateFormatted = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
};

const getAssigneeName = (id, employees) => employees.find(e => e.id === id)?.name || 'Desconocido';

const groupTasksByWeek = (tasksList) => {
  const sorted = [...tasksList].sort((a, b) => b.assignedWeek.localeCompare(a.assignedWeek));
  return sorted.reduce((acc, task) => {
    if (!acc[task.assignedWeek]) acc[task.assignedWeek] = [];
    acc[task.assignedWeek].push(task);
    return acc;
  }, {});
};

// Función para extraer "YYYY-MM" (ej. "2026-08") desde la cadena de semana asignada
const getTaskMonthYear = (assignedWeek) => {
  const match = assignedWeek.match(/\((\d{2})\/(\d{2})\/(\d{2})/);
  if (match) {
    const year = "20" + match[3];
    const month = match[2];
    return `${year}-${month}`;
  }
  return null;
};

/* COMPONENTES DE UI */
const Icon = ({ name, className }) => {
  const icons = {
    user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    users: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    clock: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    edit: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>,
    link: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>,
    pie: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
    alert: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
    download: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
    upload: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
    settings: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    trash: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
    target: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>,
    activity: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
  };
  return icons[name] || null;
};

const Badge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
    {status}
  </span>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#165399] bg-opacity-40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-[#165399]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-[#165399]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

/* --- MÓDULO DE LOGIN SEGURO CON FIREBASE AUTH --- */
const LoginScreen = ({ onLogin, authError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border-t-8 border-[#165399]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#165399] tracking-tight mb-1">Sistema de Gestión de Entregables</h1>
          <p className="text-[#8CC63F] font-bold text-sm tracking-widest uppercase">Planeación y Calidad</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#165399] mb-2">Correo Institucional</label>
            <input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@emssanar.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none transition-shadow bg-gray-50 text-gray-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#165399] mb-2">Contraseña</label>
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none transition-shadow bg-gray-50 text-gray-800 font-medium"
            />
          </div>

          {authError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 font-bold shadow-sm text-center">
              {authError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={!email || !password || loading}
            className="w-full bg-[#8CC63F] hover:bg-[#78b030] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 shadow-md"
          >
            {loading ? 'Verificando credenciales...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* --- MÓDULO DE DASHBOARD / MÉTRICAS --- */
const DashboardMetrics = ({ tasks, employees }) => {
  const total = tasks.length;
  
  const cumplidos = tasks.filter(t => t.status === STATUS.CUMPLIDO).length;
  const noCumplidos = tasks.filter(t => t.status === STATUS.NO_CUMPLIDO || t.status === STATUS.NO_REPORTADO).length;
  const enRevisionYOtros = total - cumplidos - noCumplidos;

  const groupedStatusCounts = {
    'Cumplidos': cumplidos,
    'En Revisión / Pendientes': enRevisionYOtros,
    'No Cumplido': noCumplidos
  };

  const pieData = [
    { name: 'Cumplidos', value: groupedStatusCounts['Cumplidos'], fill: STATUS_HEX_COLORS[STATUS.CUMPLIDO] },
    { name: 'En Revisión / Pendientes', value: groupedStatusCounts['En Revisión / Pendientes'], fill: STATUS_HEX_COLORS[STATUS.EN_REVISION] },
    { name: 'No Cumplido', value: groupedStatusCounts['No Cumplido'], fill: STATUS_HEX_COLORS[STATUS.NO_CUMPLIDO] }
  ].filter(item => item.value > 0);

  const assigneeStats = tasks.reduce((acc, task) => {
    const empId = task.assigneeId; 

    if (!acc[empId]) {
      const fullName = getAssigneeName(empId, employees);
      const parts = fullName.trim().split(' ');
      let displayName = parts[0];
      
      if (parts.length >= 4) displayName = `${parts[0]} ${parts[2]}`;
      else if (parts.length === 3) displayName = `${parts[0]} ${parts[1]}`;
      else if (parts.length === 2) displayName = `${parts[0]} ${parts[1]}`;

      acc[empId] = { profesional: displayName, 'Cumplido': 0, 'En Revisión': 0, 'No Cumplido': 0, total: 0 };
    }
    
    if (task.status === STATUS.CUMPLIDO) acc[empId]['Cumplido'] += 1;
    else if (task.status === STATUS.NO_CUMPLIDO || task.status === STATUS.NO_REPORTADO) acc[empId]['No Cumplido'] += 1;
    else acc[empId]['En Revisión'] += 1;
    
    acc[empId].total += 1;
    return acc;
  }, {});

  const barData = Object.values(assigneeStats).sort((a, b) => b.total - a.total);

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }) => {
    if (value === 0) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    return (
      <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="mb-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#165399] p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute opacity-10 right-[-10px] top-[-10px]"><Icon name="pie" className="w-24 h-24" /></div>
          <span className="text-4xl font-black relative z-10">{total}</span>
          <span className="text-[10px] font-bold uppercase mt-1 text-center opacity-90 relative z-10 tracking-widest">Total Entregables</span>
        </div>
        <div className="bg-[#8CC63F] p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute opacity-20 right-[-10px] top-[-10px]"><Icon name="check" className="w-24 h-24" /></div>
          <span className="text-4xl font-black relative z-10">{cumplidos}</span>
          <span className="text-[10px] font-bold uppercase mt-1 text-center opacity-90 relative z-10 tracking-widest">Cumplidos</span>
        </div>
        <div className="bg-[#AAB4C2] p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-white relative overflow-hidden">
           <div className="absolute opacity-20 right-[-10px] top-[-10px]"><Icon name="clock" className="w-24 h-24" /></div>
          <span className="text-4xl font-black relative z-10">{enRevisionYOtros}</span>
          <span className="text-[10px] font-bold uppercase mt-1 text-center opacity-90 relative z-10 tracking-widest">En Revisión / Pendientes</span>
        </div>
        <div className="bg-red-600 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-white relative overflow-hidden">
           <div className="absolute opacity-20 right-[-10px] top-[-10px]"><Icon name="alert" className="w-24 h-24" /></div>
          <span className="text-4xl font-black relative z-10">{noCumplidos}</span>
          <span className="text-[10px] font-bold uppercase mt-1 text-center opacity-90 relative z-10 tracking-widest">No Cumplidos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-sm font-black text-[#165399] mb-4 text-center uppercase tracking-wide">Estado General</h3>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" labelLine={false} label={renderPieLabel}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '11px'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col">
          <h3 className="text-sm font-black text-[#165399] mb-4 text-center uppercase tracking-wide">Desempeño por Profesional y Apellido</h3>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="profesional" tick={{fontSize: 11, fill: '#6B7280'}} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={40} wrapperStyle={{fontSize: '11px'}}/>
                
                <Bar dataKey="Cumplido" name="Cumplidos" stackId="a" fill={STATUS_HEX_COLORS[STATUS.CUMPLIDO]}>
                  <LabelList dataKey="Cumplido" position="center" fill="white" fontSize={11} fontWeight="bold" formatter={v => v > 0 ? v : ''} />
                </Bar>
                <Bar dataKey="En Revisión" name="En Revisión / Pendientes" stackId="a" fill={STATUS_HEX_COLORS[STATUS.EN_REVISION]}>
                  <LabelList dataKey="En Revisión" position="center" fill="white" fontSize={11} fontWeight="bold" formatter={v => v > 0 ? v : ''} />
                </Bar>
                <Bar dataKey="No Cumplido" name="No Cumplido" stackId="a" fill={STATUS_HEX_COLORS[STATUS.NO_CUMPLIDO]}>
                  <LabelList dataKey="No Cumplido" position="center" fill="white" fontSize={11} fontWeight="bold" formatter={v => v > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- PANEL DE ADMINISTRACIÓN --- */
const AdminPanel = ({ config, onUpdateConfig, tasks, currentUser, onUpdateTaskData, onDeleteTask, onImportTasks, onClearAllTasks }) => {
  const [activeTab, setActiveTab] = useState('USERS');
  const [newUser, setNewUser] = useState({ id: '', email: '', name: '', role: 'Junior', reviewerId: '' });
  const [categoriesState, setCategoriesState] = useState(config.categories || []);
  const [indicatorsState, setIndicatorsState] = useState(config.indicators || DEFAULT_INDICATORS);
  
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  
  const [editDbModal, setEditDbModal] = useState(false);
  const [dbTaskEdit, setDbTaskEdit] = useState(null);

  // Estados para nuevo Indicador
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [newIndicator, setNewIndicator] = useState({ id: '', name: '', formula: '', numVar: '', denVar: '', meta: 100, isAuto: false });

  const handleAddUser = (e) => {
    e.preventDefault();
    if(config.employees.find(emp => emp.id === newUser.id)) { alert("Ya existe un usuario con esta cédula."); return; }
    const updatedEmployees = [...config.employees, { ...newUser, canReview: ['Jefe', 'Coordinador', 'Especializado'].includes(newUser.role) }];
    onUpdateConfig({ ...config, employees: updatedEmployees });
    setNewUser({ id: '', email: '', name: '', role: 'Junior', reviewerId: '' });
  };

  const handleDeleteUser = (id) => {
    if(window.confirm("¿Seguro que desea eliminar a este profesional?")) {
      onUpdateConfig({ ...config, employees: config.employees.filter(emp => emp.id !== id) });
    }
  };

  const openEditUser = (emp) => { setEditingUser({ ...emp, reviewerId: emp.reviewerId || '' }); setIsEditUserModalOpen(true); };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    const updatedEmployees = config.employees.map(emp => 
      emp.id === editingUser.id ? { ...editingUser, canReview: ['Jefe', 'Coordinador', 'Especializado'].includes(editingUser.role) } : emp
    );
    onUpdateConfig({ ...config, employees: updatedEmployees });
    setIsEditUserModalOpen(false); setEditingUser(null);
  };

  const saveCategories = () => { onUpdateConfig({ ...config, categories: categoriesState }); alert("Tiempos actualizados exitosamente."); };

  const handleAddIndicator = (e) => {
    e.preventDefault();
    const indToAdd = { ...newIndicator, id: newIndicator.id || `ind-man-${Date.now()}` };
    const updatedInds = [...indicatorsState, indToAdd];
    setIndicatorsState(updatedInds);
    onUpdateConfig({ ...config, indicators: updatedInds });
    setIsIndicatorModalOpen(false);
    setNewIndicator({ id: '', name: '', formula: '', numVar: '', denVar: '', meta: 100, isAuto: false });
  };

  const handleDeleteIndicator = (indId) => {
    if (indId === 'ind-auto-1') { alert("Este indicador está bloqueado por el sistema y no puede eliminarse."); return; }
    if(window.confirm("¿Eliminar este indicador de la parametrización?")) {
      const updatedInds = indicatorsState.filter(i => i.id !== indId);
      setIndicatorsState(updatedInds);
      onUpdateConfig({ ...config, indicators: updatedInds });
    }
  };

  const exportToCSV = () => {
    const headers = ['ID Tarea', 'Semana de Ejecución', 'Profesional Asignado', 'Categoría', 'Tipo de Documento', 'Título del Entregable', 'Estado Actual', 'Fecha de Asignación', 'Descripción de Gestión', 'Link de Evidencias'];
    const csvRows = [headers.join(',')];
    tasks.forEach(task => {
      csvRows.push([task.id, `"${task.assignedWeek}"`, `"${getAssigneeName(task.assigneeId, config.employees)}"`, `"${task.category}"`, `"${task.subcategory || 'N/A'}"`, `"${(task.title || '').replace(/"/g, '""')}"`, `"${task.status}"`, `"${task.createdAt}"`, `"${(task.managementDescription || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`, `"${task.evidenceLink || 'N/A'}"`].join(','));
    });
    const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n')); link.download = `Reporte_General_PYC_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    document.body.appendChild(link); link.click(); link.remove();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 flex-wrap">
          <button onClick={() => setActiveTab('USERS')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'USERS' ? 'bg-white border-b-2 border-[#165399] text-[#165399]' : 'text-gray-500 hover:text-gray-800'}`}>Miembros del Equipo</button>
          <button onClick={() => setActiveTab('CATEGORIES')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'CATEGORIES' ? 'bg-white border-b-2 border-[#165399] text-[#165399]' : 'text-gray-500 hover:text-gray-800'}`}>Tiempos de Gestión</button>
          {currentUser.role === 'Coordinador' && (
             <button onClick={() => setActiveTab('INDICATORS_CFG')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'INDICATORS_CFG' ? 'bg-white border-b-2 border-[#8CC63F] text-[#8CC63F]' : 'text-gray-500 hover:text-gray-800'}`}>Indicadores (KPIs)</button>
          )}
          <button onClick={() => setActiveTab('REPORTS')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'REPORTS' ? 'bg-white border-b-2 border-[#165399] text-[#165399]' : 'text-gray-500 hover:text-gray-800'}`}>Exportar Reportes</button>
          {currentUser.role === 'Coordinador' && (
            <button onClick={() => setActiveTab('DATABASE')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'DATABASE' ? 'bg-white border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}>Base de Datos (Cruda)</button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'USERS' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-[#165399] mb-3">Agregar Nuevo Profesional</h3>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Cédula</label><input required type="text" value={newUser.id} onChange={e=>setNewUser({...newUser, id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#165399] outline-none text-sm"/></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label><input required type="text" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#165399] outline-none text-sm"/></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Correo (Auth)</label><input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#165399] outline-none text-sm"/></div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Rol</label>
                    <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#165399] outline-none text-sm">
                      <option value="Junior">Junior</option><option value="Aprendiz">Aprendiz</option><option value="Especializado">Especializado</option><option value="Coordinador">Coordinador</option><option value="Jefe">Jefe</option>
                    </select>
                  </div>
                  {(newUser.role === 'Junior' || newUser.role === 'Aprendiz') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Supervisor</label>
                      <select required value={newUser.reviewerId} onChange={e=>setNewUser({...newUser, reviewerId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#165399] outline-none text-sm">
                        <option value="">Seleccione...</option>
                        {config.employees.filter(e => e.canReview).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  )}
                  <button type="submit" className="bg-[#8CC63F] hover:bg-[#78b030] text-white font-bold py-2 px-4 rounded text-sm transition-colors shadow-sm h-10 w-full">Agregar</button>
                </form>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cédula</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Correo</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rol</th><th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th></tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {config.employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.id}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{emp.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-[#165399] font-bold">{emp.email || 'SIN CORREO'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"><span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{emp.role}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => openEditUser(emp)} className="text-[#165399] hover:text-[#114078] bg-blue-50 p-2 rounded-lg mr-2"><Icon name="edit" className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteUser(emp.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg"><Icon name="trash" className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'CATEGORIES' && (
            <div className="max-w-2xl">
              <h3 className="font-bold text-[#165399] mb-4">Tiempos Máximos (Categoría 1: Gestión y documentación de procesos)</h3>
              <div className="space-y-4 mb-6">
                {(categoriesState.find(c => c.id === 1)?.subcategories || []).map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <span className="text-sm font-bold text-gray-700">{sub.name}</span>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" value={sub.maxWeeks || ''} onChange={(e) => handleUpdateCategoryTime(sub.name, e.target.value)} placeholder="Sin límite" className="w-24 px-3 py-1 border border-gray-300 rounded text-sm text-center" />
                      <span className="text-xs text-gray-500 font-bold uppercase">Semanas</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={saveCategories} className="bg-[#165399] hover:bg-[#114078] text-white font-bold py-2 px-6 rounded shadow-sm transition-colors">Guardar Tiempos</button>
            </div>
          )}

          {activeTab === 'INDICATORS_CFG' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-gray-50 p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h3 className="font-black text-[#8CC63F] text-lg">Parametrización de Indicadores</h3>
                    <p className="text-sm text-gray-600 font-medium">Configure los KPIs que los supervisores medirán para sus equipos.</p>
                  </div>
                  <button onClick={() => setIsIndicatorModalOpen(true)} className="bg-[#8CC63F] hover:bg-[#78b030] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm">
                    <Icon name="plus" className="w-4 h-4"/> Nuevo Indicador
                  </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {indicatorsState.map(ind => (
                    <div key={ind.id} className={`p-4 border rounded-xl shadow-sm flex flex-col ${ind.isAuto ? 'border-[#165399] bg-blue-50' : 'border-gray-200 bg-white'}`}>
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-800 text-sm leading-tight pr-4">{ind.name}</h4>
                          {ind.isAuto && <span className="bg-[#165399] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Auto</span>}
                       </div>
                       <p className="text-[10px] text-gray-500 font-mono bg-gray-100 p-1.5 rounded mb-3 truncate" title={ind.formula}>Fórmula: {ind.formula}</p>
                       <div className="mt-auto space-y-1">
                          <p className="text-xs text-gray-600"><span className="font-bold text-[#165399]">Num:</span> {ind.numVar}</p>
                          <p className="text-xs text-gray-600"><span className="font-bold text-[#165399]">Den:</span> {ind.denVar}</p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                             <span className="text-xs font-black text-[#8CC63F]">Meta: {ind.meta}%</span>
                             {!ind.isAuto && (
                                <button onClick={() => handleDeleteIndicator(ind.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><Icon name="trash" className="w-3 h-3"/></button>
                             )}
                          </div>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'REPORTS' && (
            <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
              <Icon name="download" className="w-16 h-16 text-[#8CC63F] mb-4" />
              <h3 className="text-lg font-bold text-[#165399] mb-2">Exportar Reportes</h3>
              <p className="text-sm text-gray-500 mb-6 text-center max-w-md">Descargue un reporte de gestión en formato CSV para procesarlo visualmente en Excel.</p>
              <button onClick={exportToCSV} className="bg-[#8CC63F] hover:bg-[#78b030] text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors flex items-center gap-2">
                Descargar Reporte General
              </button>
            </div>
          )}

          {activeTab === 'DATABASE' && currentUser.role === 'Coordinador' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 items-center justify-between">
                 {/* BOTONES BD CRUDA */}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isEditUserModalOpen} onClose={() => setIsEditUserModalOpen(false)} title="Editar Miembro del Equipo">
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div><label className="block text-sm font-bold text-[#165399] mb-1">Cédula / Documento</label><input type="text" value={editingUser.id} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-bold outline-none cursor-not-allowed" /></div>
            <div><label className="block text-sm font-bold text-[#165399] mb-1">Correo Institucional (Auth)</label><input required type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" /></div>
            <div><label className="block text-sm font-bold text-[#165399] mb-1">Nombre Completo</label><input required type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#165399] mb-1">Rol</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value, reviewerId: ['Junior', 'Aprendiz'].includes(e.target.value) ? editingUser.reviewerId : ''})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none">
                  <option value="Junior">Junior</option><option value="Aprendiz">Aprendiz</option><option value="Especializado">Especializado</option><option value="Coordinador">Coordinador</option><option value="Jefe">Jefe</option>
                </select>
              </div>
              {(editingUser.role === 'Junior' || editingUser.role === 'Aprendiz') && (
                <div>
                  <label className="block text-sm font-bold text-[#165399] mb-1">Supervisor a Cargo</label>
                  <select required value={editingUser.reviewerId} onChange={e => setEditingUser({...editingUser, reviewerId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none">
                    <option value="">Seleccione...</option>
                    {config.employees.filter(e => e.canReview && e.id !== editingUser.id).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded-lg hover:bg-[#114078] font-bold">Guardar Cambios</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Nuevo Indicador */}
      <Modal isOpen={isIndicatorModalOpen} onClose={() => setIsIndicatorModalOpen(false)} title="Crear Nuevo Indicador (KPI)">
        <form onSubmit={handleAddIndicator} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 font-bold mb-4">
            Todos los indicadores que parametrice aquí serán calculados como un porcentaje: <br/><code>(Numerador / Denominador) * 100</code>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Nombre del Indicador <span className="text-red-500">*</span></label>
            <input required type="text" value={newIndicator.name} onChange={e => setNewIndicator({...newIndicator, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Fórmula (Solo referencia textual)</label>
            <input type="text" value={newIndicator.formula} onChange={e => setNewIndicator({...newIndicator, formula: e.target.value})} placeholder="Ej: (Total X / Total Y) * 100" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#165399] mb-1">Nombre Variable Numerador <span className="text-red-500">*</span></label>
              <input required type="text" value={newIndicator.numVar} onChange={e => setNewIndicator({...newIndicator, numVar: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#165399] mb-1">Nombre Variable Denominador <span className="text-red-500">*</span></label>
              <input required type="text" value={newIndicator.denVar} onChange={e => setNewIndicator({...newIndicator, denVar: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Meta Esperada (%) <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2">
               <input required type="number" min="0" max="100" value={newIndicator.meta} onChange={e => setNewIndicator({...newIndicator, meta: parseInt(e.target.value)})} className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" />
               <span className="font-black text-gray-500">%</span>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={() => setIsIndicatorModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#8CC63F] text-white rounded-lg hover:bg-[#78b030] font-bold">Crear Indicador</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* --- MÓDULO FLUJO JUNIOR --- */
const JuniorDashboard = ({ user, tasks, categories, onAddTask, onUpdateTaskStatus, onUpdateTaskData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [reportData, setReportData] = useState({ description: '', link: '' });
  const [requestContinuation, setRequestContinuation] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleWeek, setRescheduleWeek] = useState('');

  const [formData, setFormData] = useState({ title: '', categoryId: '', subcategory: '', description: '', week: getWeekData(new Date()) });
  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const upcomingWeeks = getUpcomingWeeksList();

  const handleCreateTask = (e) => {
    e.preventDefault();
    const taskSubcategoryObj = selectedCategory?.subcategories?.find(s => s.name === formData.subcategory);
    const deadlineInfo = (formData.categoryId === 1 && taskSubcategoryObj?.maxWeeks) ? `Máximo ${taskSubcategoryObj.maxWeeks} semana(s)` : 'Sin límite estricto';

    onAddTask({
      id: Date.now().toString(), title: formData.title, description: formData.description,
      category: selectedCategory.name, subcategory: formData.categoryId === 1 ? formData.subcategory : '',
      deadlineInfo, assignedWeek: formData.week, assigneeId: user.id, reviewerId: user.reviewerId,
      status: STATUS.ASIGNADO, createdAt: getCurrentDateFormatted(), comments: [], managementDescription: '', evidenceLink: '', continuedCount: 0, allowExtraTime: false
    });
    setIsModalOpen(false); setFormData({ title: '', categoryId: '', subcategory: '', description: '', week: getWeekData(new Date()) });
  };

  const openReportModal = (task) => {
    setActiveTask(task); setReportData({ description: task.managementDescription || '', link: task.evidenceLink || '' });
    setRequestContinuation(task.status === STATUS.SOLICITUD_CONTINUIDAD); setErrorMsg(''); setReportModalOpen(true);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault(); setErrorMsg('');
    if (!reportData.description.trim() || !reportData.link.trim()) { setErrorMsg('Complete descripción y enlace.'); return; }
    onUpdateTaskData(activeTask.id, { managementDescription: reportData.description, evidenceLink: reportData.link, status: requestContinuation ? STATUS.SOLICITUD_CONTINUIDAD : STATUS.EN_REVISION });
    setReportModalOpen(false); setActiveTask(null);
  };

  const myTasks = tasks.filter(t => t.assigneeId === user.id);
  const groupedTasks = groupTasksByWeek(myTasks);
  
  const totalTasks = myTasks.length;
  const cumplidosCount = myTasks.filter(t => t.status === STATUS.CUMPLIDO).length;
  const pendientesCount = totalTasks - cumplidosCount;
  const complianceRate = totalTasks > 0 ? Math.round((cumplidosCount / totalTasks) * 100) : 0;

  const pieData = [{ name: 'Cumplidos', value: cumplidosCount, fill: STATUS_HEX_COLORS[STATUS.CUMPLIDO] }, { name: 'Pendientes', value: pendientesCount, fill: '#E5E7EB' }];

  const taskSubcategoryObj = categories.find(c => c.name === activeTask?.category)?.subcategories?.find(s => s.name === activeTask?.subcategory);
  const canRequestContinuation = activeTask && (!((activeTask.category === categories[0].name && taskSubcategoryObj?.maxWeeks) ? (activeTask.continuedCount + 1) >= taskSubcategoryObj.maxWeeks : false) || activeTask.allowExtraTime);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-t-8 border-t-[#8CC63F] flex flex-col md:flex-row gap-6 items-center">
         <div className="flex-1 w-full">
            <h3 className="text-lg font-black text-[#165399] mb-4">Mi Nivel de Cumplimiento</h3>
            <div className="grid grid-cols-3 gap-4">
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center"><p className="text-3xl font-black text-gray-700">{totalTasks}</p><p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Asignados</p></div>
               <div className="bg-[#f3f9eb] p-4 rounded-lg border border-[#8CC63F] text-center"><p className="text-3xl font-black text-[#8CC63F]">{cumplidosCount}</p><p className="text-[10px] font-bold text-[#8CC63F] uppercase mt-1">Cumplidos</p></div>
               <div className="bg-[#165399] p-4 rounded-lg border border-[#114078] text-center text-white"><p className="text-3xl font-black">{complianceRate}%</p><p className="text-[10px] font-bold uppercase opacity-80 mt-1">Efectividad</p></div>
            </div>
         </div>
         <div className="w-full md:w-1/3 h-[180px] flex items-center justify-center relative">
            {totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={50} outerRadius={80} dataKey="value" stroke="none">{pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}<Label value={`${complianceRate}%`} position="center" fill="#165399" fontSize={24} fontWeight="black" /></Pie><RechartsTooltip /></PieChart></ResponsiveContainer>
            ) : (<p className="text-sm text-gray-400 font-bold italic">No hay entregables</p>)}
         </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-[#165399] border-l-8 gap-4">
        <div><h2 className="text-xl font-black text-[#165399]">Mis Entregables Asignados</h2><p className="text-sm text-gray-500 font-medium">Gestione el reporte y revisión.</p></div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#8CC63F] hover:bg-[#78b030] text-white px-4 py-2 rounded-lg font-bold"><Icon name="plus" className="w-5 h-5" /> Auto-Asignar</button>
      </div>

      {Object.entries(groupedTasks).map(([weekLabel, weekTasks]) => (
        <div key={weekLabel} className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-black text-[#165399] mb-4 border-b border-gray-100 pb-3 flex items-center gap-2"><Icon name="clock" className="w-5 h-5 text-[#8CC63F]" /> {weekLabel}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekTasks.map(task => (
              <div key={task.id} className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2"><Badge status={task.status} /><span className="text-[10px] font-black text-[#165399] bg-blue-50 px-2 py-1 rounded truncate max-w-[120px]">{task.category}</span></div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{task.title}</h4>
                  {task.subcategory && <p className="text-xs text-[#8CC63F] font-bold mb-3">{task.subcategory}</p>}
                  {task.comments && task.comments.length > 0 && (
                     (() => {
                        const style = task.status === STATUS.CUMPLIDO ? { bg: "bg-[#f3f9eb]", border: "border-[#8CC63F]", title: "text-[#8CC63F]", icon: "text-[#8CC63F]", text: "text-green-800" } : (task.status === STATUS.NO_CUMPLIDO || task.status === STATUS.NO_REPORTADO) ? { bg: "bg-red-50", border: "border-red-200", title: "text-red-700", icon: "text-red-600", text: "text-red-800" } : { bg: "bg-yellow-50", border: "border-yellow-200", title: "text-yellow-700", icon: "text-yellow-600", text: "text-yellow-800" };
                        return (
                           <div className={`mt-2 mb-3 ${style.bg} p-3 rounded-lg border ${style.border}`}>
                              <p className={`text-[10px] font-black ${style.title} uppercase mb-1 flex items-center gap-1`}><Icon name="alert" className={`w-3 h-3 ${style.icon}`}/> Feedback de {task.comments[task.comments.length - 1].author}:</p>
                              <p className={`text-xs ${style.text} font-medium line-clamp-2`}>{task.comments[task.comments.length - 1].text}</p>
                           </div>
                        );
                     })()
                  )}
                  <div className="flex items-center text-xs text-gray-500 font-medium gap-1 mt-auto pt-3 border-t border-gray-50"><Icon name="clock" className="w-4 h-4 text-[#AAB4C2]" /> Límite: {task.deadlineInfo}{(task.continuedCount > 0) && <span className="ml-2 font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">Sem. {task.continuedCount + 1}</span>}</div>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-col gap-2">
                  <div className="flex gap-2 w-full">
                    {(task.status === STATUS.ASIGNADO || task.status === STATUS.NO_REPORTADO) && (<button onClick={() => onUpdateTaskStatus(task.id, STATUS.EN_PROGRESO)} className="text-xs w-full bg-white border border-[#165399] text-[#165399] px-3 py-2 rounded-lg font-bold">{task.status === STATUS.NO_REPORTADO ? 'Iniciar Atrasado' : 'Iniciar Trabajo'}</button>)}
                    {(task.status === STATUS.EN_PROGRESO || task.status === STATUS.CON_OBSERVACIONES) && (<button onClick={() => openReportModal(task)} className="text-xs w-full bg-[#165399] text-white px-3 py-2 rounded-lg font-bold">Redactar Reporte</button>)}
                    {(task.status === STATUS.EN_REVISION || task.status === STATUS.SOLICITUD_CONTINUIDAD) && (<button onClick={() => openReportModal(task)} className="text-xs w-full bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-bold flex justify-center gap-1"><Icon name="edit" className="w-3 h-3" /> Modificar Reporte</button>)}
                  </div>
                  <div className="flex gap-2 w-full">
                    {task.status !== STATUS.CUMPLIDO && (<button onClick={() => { setActiveTask(task); setRescheduleWeek(task.assignedWeek); setIsRescheduleModalOpen(true); }} className="text-xs flex-1 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-bold flex justify-center gap-1"><Icon name="clock" className="w-3 h-3" /> Reprogramar</button>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modales Junior (Autoasignar, Reportar, Reprogramar) - Mismas funciones que antes */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Auto-Asignar Nuevo Entregable">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Título <span className="text-red-500">*</span></label><input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-[#165399] mb-1">Categoría <span className="text-red-500">*</span></label><select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value ? parseInt(e.target.value) : '', subcategory: ''})} className="w-full px-3 py-2 border rounded-lg outline-none"><option value="">Seleccione...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            {formData.categoryId === 1 && (<div><label className="block text-sm font-bold text-[#165399] mb-1">Tipo <span className="text-red-500">*</span></label><select required value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none"><option value="">Seleccione...</option>{selectedCategory?.subcategories?.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}</select></div>)}
          </div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Semana Ejecución <span className="text-red-500">*</span></label><input type="text" value={formData.week} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 font-bold outline-none" /></div>
          <div className="pt-4 border-t flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#8CC63F] text-white rounded-lg font-bold">Asignar</button></div>
        </form>
      </Modal>

      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Reportar Gestión">
        <form onSubmit={handleSubmitReport} className="space-y-4">
          {errorMsg && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-bold">{errorMsg}</div>}
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Descripción <span className="text-red-500">*</span></label><textarea required rows="4" value={reportData.description} onChange={e => setReportData({...reportData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none"></textarea></div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Enlace Evidencias <span className="text-red-500">*</span></label><input required type="url" value={reportData.link} onChange={e => setReportData({...reportData, link: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" /></div>
          <div className={`p-4 rounded-xl border ${!canRequestContinuation ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
             <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={requestContinuation} onChange={(e) => setRequestContinuation(e.target.checked)} disabled={!canRequestContinuation} className="w-4 h-4 text-[#165399] rounded" /><span className={`text-sm font-bold ${!canRequestContinuation ? 'text-red-700' : 'text-gray-700'}`}>Solicitar continuar entregable próxima semana</span></label>
             {!canRequestContinuation && (<p className="text-xs text-red-600 mt-2 ml-6 font-medium">Límite alcanzado.</p>)}
          </div>
          <div className="pt-4 flex justify-end gap-2"><button type="button" onClick={() => setReportModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded-lg font-bold">Enviar</button></div>
        </form>
      </Modal>

      <Modal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} title="Reprogramar">
        <form onSubmit={(e) => { e.preventDefault(); onUpdateTaskData(activeTask.id, { assignedWeek: rescheduleWeek }); setIsRescheduleModalOpen(false); setActiveTask(null); }} className="space-y-4">
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Nueva semana <span className="text-red-500">*</span></label><select required value={rescheduleWeek} onChange={e => setRescheduleWeek(e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccione...</option>{upcomingWeeks.map(w => <option key={w} value={w}>{w}</option>)}</select></div>
          <div className="pt-4 flex justify-end gap-2"><button type="button" onClick={() => setIsRescheduleModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded-lg font-bold">Reprogramar</button></div>
        </form>
      </Modal>
    </div>
  );
};

/* --- MÓDULO NUEVO: GESTIÓN DE INDICADORES EN SUPERVISOR --- */
const IndicatorsManager = ({ user, tasks, employees, config, measurements, onSaveMeasurement }) => {
  const currentMonthValue = new Date().toISOString().slice(0,7); // YYYY-MM
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonthValue);

  // Filtrar Juniors que pertenecen al equipo del supervisor (o todos si es Jefe/Coordinador)
  const canSeeAll = user.role === 'Jefe' || user.role === 'Coordinador';
  const myTeamMembers = canSeeAll 
     ? employees.filter(e => e.role === 'Junior' || e.role === 'Aprendiz') 
     : employees.filter(emp => emp.reviewerId === user.id && (emp.role === 'Junior' || emp.role === 'Aprendiz'));

  const indicators = config.indicators || DEFAULT_INDICATORS;

  // Manejar el cambio manual de un valor
  const handleValChange = (empId, indId, field, value) => {
     const numVal = parseInt(value, 10);
     if (isNaN(numVal) && value !== '') return;

     const measId = `${indId}_${empId}_${selectedPeriod}`;
     const existing = measurements.find(m => m.id === measId) || { id: measId, indicatorId: indId, assigneeId: empId, period: selectedPeriod, numerator: 0, denominator: 0 };
     
     const updated = { ...existing, [field]: value === '' ? 0 : numVal };
     onSaveMeasurement(updated);
  };

  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-t-8 border-t-[#8CC63F]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-100 pb-4">
             <div>
               <h2 className="text-xl font-black text-[#8CC63F] flex items-center gap-2"><Icon name="target" className="w-6 h-6"/> Medición de Indicadores de Gestión</h2>
               <p className="text-sm text-gray-500 font-medium">Evalúe el desempeño mensual de los miembros de su equipo.</p>
             </div>
             <div className="mt-4 md:mt-0 flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
               <label className="text-sm font-bold text-[#165399]">Mes a evaluar:</label>
               <input type="month" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm font-bold text-gray-700"/>
             </div>
          </div>

          <div className="space-y-8">
             {myTeamMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-10 font-bold">No tiene profesionales Junior asignados para evaluar.</p>
             ) : (
                myTeamMembers.map(emp => {
                   return (
                      <div key={emp.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                         <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#165399] rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm">{emp.name.charAt(0)}</div>
                            <div>
                               <h3 className="font-bold text-[#165399] text-base leading-tight">{emp.name}</h3>
                               <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">C.C. {emp.id}</span>
                            </div>
                         </div>
                         <div className="p-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                               <thead>
                                  <tr>
                                     <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase">Indicador</th>
                                     <th className="px-2 py-2 text-center text-xs font-bold text-[#165399] uppercase bg-blue-50 rounded-tl-md">Numerador</th>
                                     <th className="px-2 py-2 text-center text-xs font-bold text-[#165399] uppercase bg-blue-50">Denominador</th>
                                     <th className="px-2 py-2 text-center text-xs font-bold text-[#8CC63F] uppercase bg-green-50 rounded-tr-md">Resultado</th>
                                     <th className="px-2 py-2 text-center text-xs font-bold text-gray-500 uppercase">Meta</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-100">
                                  {indicators.map(ind => {
                                     let num = 0; let den = 0; let isCalc = ind.isAuto;

                                     if (ind.isAuto) {
                                        // Cálculo Automático Nivel de Conformidad
                                        const tasksInMonth = tasks.filter(t => t.assigneeId === emp.id && getTaskMonthYear(t.assignedWeek) === selectedPeriod);
                                        den = tasksInMonth.length;
                                        num = tasksInMonth.filter(t => t.status === STATUS.CUMPLIDO).length;
                                     } else {
                                        // Búsqueda Manual
                                        const measId = `${ind.id}_${emp.id}_${selectedPeriod}`;
                                        const rec = measurements.find(m => m.id === measId);
                                        if (rec) { num = rec.numerator || 0; den = rec.denominator || 0; }
                                     }

                                     const result = den === 0 ? 0 : Math.round((num / den) * 100);
                                     const cumpleMeta = result >= ind.meta;

                                     return (
                                        <tr key={ind.id} className="hover:bg-gray-50">
                                           <td className="px-2 py-3">
                                              <p className="text-sm font-bold text-gray-800">{ind.name}</p>
                                              <p className="text-[9px] text-gray-400 font-mono mt-0.5" title={ind.formula}>Fórmula: {ind.formula}</p>
                                           </td>
                                           <td className="px-2 py-3 text-center bg-blue-50/30">
                                              {isCalc ? <span className="font-bold text-[#165399] text-sm">{num}</span> : 
                                                 <input type="number" min="0" value={num || ''} onChange={(e) => handleValChange(emp.id, ind.id, 'numerator', e.target.value)} className="w-16 px-2 py-1 text-center border border-blue-300 rounded text-sm font-bold text-[#165399] focus:ring-1 focus:ring-[#165399] outline-none" title={ind.numVar}/>
                                              }
                                           </td>
                                           <td className="px-2 py-3 text-center bg-blue-50/30">
                                              {isCalc ? <span className="font-bold text-[#165399] text-sm">{den}</span> : 
                                                 <input type="number" min="0" value={den || ''} onChange={(e) => handleValChange(emp.id, ind.id, 'denominator', e.target.value)} className="w-16 px-2 py-1 text-center border border-blue-300 rounded text-sm font-bold text-[#165399] focus:ring-1 focus:ring-[#165399] outline-none" title={ind.denVar}/>
                                              }
                                           </td>
                                           <td className="px-2 py-3 text-center bg-green-50/30">
                                              <span className={`text-base font-black px-2 py-1 rounded ${cumpleMeta ? 'text-[#8CC63F] bg-[#f3f9eb]' : 'text-orange-500 bg-orange-50'}`}>{result}%</span>
                                           </td>
                                           <td className="px-2 py-3 text-center">
                                              <span className="text-xs font-black text-gray-500">{ind.meta}%</span>
                                           </td>
                                        </tr>
                                     );
                                  })}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   )
                })
             )}
          </div>
       </div>
    </div>
  );
};

/* --- MÓDULO FLUJO SUPERVISOR --- */
const ReviewerDashboard = ({ user, tasks, categories, config, employees, measurements, onAddTask, onUpdateTaskStatus, onAddComment, onUpdateTaskData, onDeleteTask, onSaveMeasurement }) => {
  const [activeTab, setActiveTab] = useState('TASKS'); // TASKS | INDICATORS
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [authorizeContinuation, setAuthorizeContinuation] = useState(false);
  
  const [isGroupAssignModalOpen, setIsGroupAssignModalOpen] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ title: '', categoryId: '', subcategory: '', description: '', week: getWeekData(new Date()), assigneeIds: [] });
  
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleWeek, setRescheduleWeek] = useState('');
  const upcomingWeeks = getUpcomingWeeksList();
  
  const [formData, setFormData] = useState({ title: '', categoryId: '', subcategory: '', description: '', assigneeId: '', week: getWeekData(new Date()) });

  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const groupSelectedCategory = categories.find(c => c.id === groupFormData.categoryId);

  const [filterWeek, setFilterWeek] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterAssignee, setFilterAssignee] = useState('ALL');
  const [viewScope, setViewScope] = useState('MY_TEAM');

  const canSeeAll = user.role === 'Jefe' || user.role === 'Coordinador';
  const myTeamMembers = employees.filter(emp => emp.reviewerId === user.id);
  const myTeamIds = myTeamMembers.map(emp => emp.id);

  const availableJuniors = employees.filter(e => e.role === 'Junior' || e.role === 'Aprendiz');

  const visibleTasks = tasks.filter(task => {
    if (canSeeAll && viewScope === 'ALL') return true;
    return myTeamIds.includes(task.assigneeId);
  });

  const filteredTasks = visibleTasks.filter(task => {
    if (filterWeek !== 'ALL' && task.assignedWeek !== filterWeek) return false;
    if (filterCategory !== 'ALL' && task.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
    if (filterAssignee !== 'ALL' && task.assigneeId !== filterAssignee) return false;
    return true;
  });

  const uniqueWeeks = [...new Set(visibleTasks.map(t => t.assignedWeek))].sort().reverse();
  const uniqueCategories = [...new Set(visibleTasks.map(t => t.category))].sort();

  const getSupervisorButtonClass = (status) => {
    if (status === STATUS.EN_REVISION || status === STATUS.SOLICITUD_CONTINUIDAD) return "bg-[#165399] hover:bg-[#114078] text-white border border-[#165399]";
    if (status === STATUS.CUMPLIDO) return "bg-[#8CC63F] hover:bg-[#78b030] text-white border border-[#8CC63F]";
    if (status === STATUS.CON_OBSERVACIONES) return "bg-yellow-500 hover:bg-yellow-600 text-white border border-yellow-500";
    if (status === STATUS.NO_CUMPLIDO) return "bg-red-600 hover:bg-red-700 text-white border border-red-600";
    return "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300";
  };

  const handleReview = (decisionStatus) => {
    if ((decisionStatus === STATUS.CON_OBSERVACIONES || decisionStatus === STATUS.NO_CUMPLIDO) && !reviewComments.trim()) {
      setErrorMsg('Debe ingresar observaciones obligatoriamente si solicita ajustes o rechaza el entregable.'); return;
    }
    setErrorMsg('');
    if (reviewComments.trim()) {
      onAddComment(activeTask.id, { id: Date.now().toString(), author: user.name, text: reviewComments, date: getCurrentDateFormatted() });
    }

    if (authorizeContinuation && !activeTask.continuationSpawned) {
      const nextWeek = getNextWeekData(activeTask.assignedWeek);
      const continuationTask = { ...activeTask, id: Date.now().toString() + '-cont', assignedWeek: nextWeek, status: STATUS.ASIGNADO, continuedCount: (activeTask.continuedCount || 0) + 1, comments: [], managementDescription: '', evidenceLink: '', continuationSpawned: false };
      onAddTask(continuationTask);
      onUpdateTaskData(activeTask.id, { status: decisionStatus, continuationSpawned: true });
    } else {
       onUpdateTaskStatus(activeTask.id, decisionStatus);
    }
    setIsReviewModalOpen(false); setActiveTask(null); setReviewComments('');
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    const taskSubcategoryObj = selectedCategory?.subcategories?.find(s => s.name === formData.subcategory);
    const deadlineInfo = (formData.categoryId === 1 && taskSubcategoryObj?.maxWeeks) ? `Máximo ${taskSubcategoryObj.maxWeeks} semana(s)` : 'Sin límite estricto';
    onAddTask({ id: Date.now().toString(), title: formData.title, description: formData.description, category: selectedCategory.name, subcategory: formData.categoryId === 1 ? formData.subcategory : '', deadlineInfo, assignedWeek: formData.week, assigneeId: formData.assigneeId, reviewerId: employees.find(emp => emp.id === formData.assigneeId)?.reviewerId || user.id, status: STATUS.ASIGNADO, createdAt: getCurrentDateFormatted(), comments: [], managementDescription: '', evidenceLink: '', continuedCount: 0, allowExtraTime: false });
    setIsAssignModalOpen(false); setFormData({ title: '', categoryId: '', subcategory: '', description: '', assigneeId: '', week: getWeekData(new Date()) });
  };

  const handleCreateGroupTask = (e) => {
    e.preventDefault();
    if (groupFormData.assigneeIds.length === 0) { alert("Seleccione al menos un profesional."); return; }
    const taskSubcategoryObj = groupSelectedCategory?.subcategories?.find(s => s.name === groupFormData.subcategory);
    const deadlineInfo = (groupFormData.categoryId === 1 && taskSubcategoryObj?.maxWeeks) ? `Máximo ${taskSubcategoryObj.maxWeeks} semana(s)` : 'Sin límite estricto';

    groupFormData.assigneeIds.forEach((assigneeId, index) => {
      onAddTask({ id: Date.now().toString() + '-' + index, title: groupFormData.title, description: groupFormData.description, category: groupSelectedCategory.name, subcategory: groupFormData.categoryId === 1 ? groupFormData.subcategory : '', deadlineInfo, assignedWeek: groupFormData.week, assigneeId: assigneeId, reviewerId: employees.find(emp => emp.id === assigneeId)?.reviewerId || user.id, status: STATUS.ASIGNADO, createdAt: getCurrentDateFormatted(), comments: [], managementDescription: '', evidenceLink: '', continuedCount: 0, allowExtraTime: false });
    });
    setIsGroupAssignModalOpen(false); setGroupFormData({ title: '', categoryId: '', subcategory: '', description: '', week: getWeekData(new Date()), assigneeIds: [] });
    alert(`Asignados ${groupFormData.assigneeIds.length} entregables.`);
  };

  const openEditModal = (task) => {
    setActiveTask(task); const cat = categories.find(c => c.name === task.category);
    setFormData({ title: task.title || '', categoryId: cat ? cat.id : '', subcategory: task.subcategory || '', description: task.description || '', assigneeId: task.assigneeId || '', week: task.assignedWeek || '' });
    setIsEditModalOpen(true);
  };

  const handleUpdateTaskDetails = (e) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === formData.categoryId);
    const taskSubcategoryObj = cat?.subcategories?.find(s => s.name === formData.subcategory);
    const deadlineInfo = (formData.categoryId === 1 && taskSubcategoryObj?.maxWeeks) ? `Máximo ${taskSubcategoryObj.maxWeeks} semana(s)` : 'Sin límite estricto';
    onUpdateTaskData(activeTask.id, { title: formData.title, category: cat.name, subcategory: formData.categoryId === 1 ? formData.subcategory : '', description: formData.description, assigneeId: formData.assigneeId, reviewerId: employees.find(emp => emp.id === formData.assigneeId)?.reviewerId || user.id, assignedWeek: formData.week, deadlineInfo });
    setIsEditModalOpen(false); setActiveTask(null); setFormData({ title: '', categoryId: '', subcategory: '', description: '', assigneeId: '', week: getWeekData(new Date()) });
  };

  const groupedTasks = groupTasksByWeek(filteredTasks);
  const isPendingReviewAction = activeTask && (activeTask.status === STATUS.ASIGNADO || activeTask.status === STATUS.EN_PROGRESO || activeTask.status === STATUS.NO_REPORTADO);

  return (
    <div className="space-y-6">
      <DashboardMetrics tasks={filteredTasks} employees={employees} />

      {/* PESTAÑAS PRINCIPALES DEL DASHBOARD */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
         <button onClick={() => setActiveTab('TASKS')} className={`flex-1 py-4 font-black text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'TASKS' ? 'bg-[#165399] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Icon name="activity" className="w-5 h-5"/> Seguimiento a Entregables
         </button>
         <button onClick={() => setActiveTab('INDICATORS')} className={`flex-1 py-4 font-black text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'INDICATORS' ? 'bg-[#8CC63F] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Icon name="target" className="w-5 h-5"/> Medición de Indicadores
         </button>
      </div>

      {activeTab === 'INDICATORS' ? (
         <IndicatorsManager user={user} tasks={tasks} employees={employees} config={config} measurements={measurements} onSaveMeasurement={onSaveMeasurement} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-t-8 border-t-[#165399] mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-[#165399]">Gestión de Productos</h2>
                <p className="text-sm text-gray-500 font-medium">Revise y gestione los productos asignados a su equipo.</p>
              </div>
              <div className="flex gap-2 flex-wrap lg:flex-nowrap">
                {canSeeAll && (
                  <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button onClick={() => setViewScope('MY_TEAM')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${viewScope === 'MY_TEAM' ? 'bg-white text-[#165399] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Mi Equipo Directo</button>
                    <button onClick={() => setViewScope('ALL')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${viewScope === 'ALL' ? 'bg-white text-[#165399] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Todo el Equipo</button>
                  </div>
                )}
                <button onClick={() => { setGroupFormData(prev => ({...prev, assigneeIds: availableJuniors.map(e=>e.id)})); setIsGroupAssignModalOpen(true); }} className="flex items-center gap-2 bg-[#165399] hover:bg-[#114078] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
                  <Icon name="users" className="w-5 h-5" /> Asignación Grupal
                </button>
                <button onClick={() => setIsAssignModalOpen(true)} className="flex items-center gap-2 bg-[#8CC63F] hover:bg-[#78b030] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
                  <Icon name="plus" className="w-5 h-5" /> Individual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-[10px] font-black text-[#165399] uppercase tracking-widest mb-1">Semana</label>
                <select value={filterWeek} onChange={e => setFilterWeek(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] font-medium bg-gray-50 px-3 py-2 outline-none">
                  <option value="ALL">Todas las semanas</option>
                  {uniqueWeeks.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#165399] uppercase tracking-widest mb-1">Profesional</label>
                <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] font-medium bg-gray-50 px-3 py-2 outline-none">
                  <option value="ALL">Todos los profesionales</option>
                  <optgroup label="Mi Equipo Directo">
                    {employees.filter(e => myTeamIds.includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </optgroup>
                  {canSeeAll && viewScope === 'ALL' && (
                    <optgroup label="Otros Profesionales">
                      {employees.filter(e => !myTeamIds.includes(e.id) && (e.role === 'Junior' || e.role === 'Aprendiz')).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#165399] uppercase tracking-widest mb-1">Categoría</label>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] font-medium bg-gray-50 px-3 py-2 outline-none">
                  <option value="ALL">Todas las categorías</option>
                  {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#165399] uppercase tracking-widest mb-1">Estado</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] font-medium bg-gray-50 px-3 py-2 outline-none">
                  <option value="ALL">Todos los estados</option>
                  {Object.values(STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {Object.entries(groupedTasks).map(([weekLabel, weekTasks]) => (
            <div key={weekLabel} className="mb-8">
              <h3 className="text-lg font-black text-[#165399] mb-4 border-b-2 border-gray-200 pb-2 flex items-center gap-2">
                <Icon name="clock" className="w-6 h-6 text-[#8CC63F]" /> {weekLabel}
              </h3>
              {Object.entries(weekTasks.reduce((acc, t) => { acc[t.assigneeId] = acc[t.assigneeId] || []; acc[t.assigneeId].push(t); return acc; }, {})).map(([assigneeId, assigneeTasks]) => {
                 const assignee = getAssigneeName(assigneeId, employees);
                 return (
                   <div key={assigneeId} className="mb-6 ml-4 border-l-4 border-[#8CC63F] pl-4">
                     <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                       <Icon name="user" className="w-5 h-5 text-[#8CC63F]" /> {assignee}
                       <span className="text-xs font-bold text-white bg-[#AAB4C2] px-2 py-0.5 rounded-full shadow-sm">{assigneeTasks.length} tareas</span>
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assigneeTasks.map(task => (
                          <div key={task.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-2">
                                <Badge status={task.status} />
                                <span className="text-[10px] font-black text-[#165399] bg-blue-50 px-2 py-1 rounded truncate max-w-[120px] border border-blue-100" title={task.category}>{task.category}</span>
                              </div>
                              <h4 className="font-bold text-gray-800 text-sm mb-1">{task.title}</h4>
                              {task.subcategory && <p className="text-xs text-[#8CC63F] font-bold mb-3">{task.subcategory}</p>}
                              <div className="flex items-center text-xs text-gray-500 font-medium gap-1 mt-auto pt-3 border-t border-gray-50">
                                <Icon name="clock" className="w-4 h-4 text-[#AAB4C2]" />
                                Límite: {task.deadlineInfo}
                                {(task.continuedCount > 0) && <span className="ml-2 font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">Semana {task.continuedCount + 1}</span>}
                              </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-wrap gap-2">
                              <button onClick={() => { setActiveTask(task); setIsReviewModalOpen(true); setReviewComments(''); setErrorMsg(''); setAuthorizeContinuation(task.status === STATUS.SOLICITUD_CONTINUIDAD); }} className={`text-[11px] flex-1 min-w-[100px] px-2 py-2 rounded-lg font-bold flex items-center justify-center gap-1 shadow-sm transition-colors ${getSupervisorButtonClass(task.status)}`}>
                                 <Icon name="check" className="w-3 h-3" /> {(task.status === STATUS.EN_REVISION || task.status === STATUS.SOLICITUD_CONTINUIDAD) ? 'Evaluar Entregable' : (task.status === STATUS.ASIGNADO || task.status === STATUS.EN_PROGRESO || task.status === STATUS.NO_REPORTADO) ? 'Ver Estado' : 'Modificar Revisión'}
                              </button>
                              <button onClick={() => openEditModal(task)} className="text-[11px] flex-1 min-w-[70px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-2 py-2 rounded-lg font-bold flex items-center justify-center gap-1 shadow-sm transition-colors">
                                <Icon name="edit" className="w-3 h-3" /> Editar
                              </button>
                              <button onClick={() => { setActiveTask(task); setRescheduleWeek(task.assignedWeek); setIsRescheduleModalOpen(true); }} className="text-[11px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-2 py-2 rounded-lg font-bold flex items-center justify-center shadow-sm transition-colors" title="Reprogramar Semana">
                                <Icon name="clock" className="w-4 h-4" />
                              </button>
                              {(task.status === STATUS.ASIGNADO || task.status === STATUS.EN_PROGRESO || task.status === STATUS.NO_REPORTADO) && (
                                <button onClick={() => { if(window.confirm('¿Seguro que desea eliminar este entregable? Esta acción es irreversible.')) onDeleteTask(task.id); }} className="text-[11px] bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-2 py-2 rounded-lg font-bold flex items-center justify-center shadow-sm transition-colors" title="Eliminar Entregable">
                                  <Icon name="trash" className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                     </div>
                   </div>
                 );
              })}
            </div>
          ))}
        </div>
      )}

      {/* --- MODALES DEL SUPERVISOR --- */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Evaluación de Entregable">
        {activeTask && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="font-black text-[#165399] text-lg mb-1">{activeTask.title}</h4>
                <div className="text-xs text-gray-700 mb-2 font-medium">Categoría: {activeTask.category} {activeTask.subcategory && `(${activeTask.subcategory})`}</div>
                <div className="text-xs text-gray-700 font-bold text-[#165399]">Profesional a cargo: {getAssigneeName(activeTask.assigneeId, employees)}</div>
              </div>
              <div className="flex-shrink-0"><Badge status={activeTask.status} /></div>
            </div>
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <h5 className="font-black text-[#165399] mb-3 text-sm uppercase tracking-widest border-b border-gray-200 pb-2">Reporte de Gestión del Profesional</h5>
              {activeTask.managementDescription ? (
                <div className="flex-1 flex flex-col">
                  <p className="text-sm text-gray-800 mb-5 whitespace-pre-wrap font-medium flex-1">{activeTask.managementDescription}</p>
                  {activeTask.evidenceLink && (<a href={activeTask.evidenceLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#8CC63F] hover:bg-[#78b030] text-white font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors w-full sm:w-auto self-start"><Icon name="link" className="w-5 h-5" /> Abrir Soportes / Evidencias</a>)}
                </div>
              ) : (<p className="text-sm text-gray-500 italic font-medium flex-1 flex items-center justify-center py-6 bg-white rounded-lg border border-dashed border-gray-300">No se ha registrado reporte de gestión.</p>)}
            </div>
            {errorMsg && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 font-bold shadow-sm">{errorMsg}</div>}
            {isPendingReviewAction ? (
              <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-xl text-yellow-800 text-sm font-bold flex items-start gap-3 shadow-sm"><Icon name="alert" className="w-6 h-6 flex-shrink-0 text-yellow-600" />No puede evaluar este entregable porque el profesional aún no lo ha enviado a revisión. (Estado: {activeTask.status})</div>
            ) : (
              <div className="pt-4 border-t border-gray-200">
                <div className="mb-4">
                  <label className="block text-sm font-bold text-[#165399] mb-2">Observaciones / Feedback de Revisión</label>
                  <textarea rows="3" value={reviewComments} onChange={e => setReviewComments(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none text-sm" placeholder="Ingrese sus observaciones (Obligatorio si solicita ajustes o rechaza)..."></textarea>
                </div>
                {!activeTask.continuationSpawned && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={authorizeContinuation} onChange={(e) => setAuthorizeContinuation(e.target.checked)} className="w-4 h-4 text-[#165399] rounded border-gray-300 focus:ring-[#165399]" />
                      <span className="text-sm font-bold text-[#165399]">{activeTask?.status === STATUS.SOLICITUD_CONTINUIDAD ? "📌 El profesional solicitó continuidad. " : ""} Autorizar y crear entregable para la próxima semana</span>
                    </label>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button type="button" onClick={() => setIsReviewModalOpen(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-sm transition-colors text-center order-last sm:order-first">Cancelar</button>
                  <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                    <button onClick={() => handleReview(STATUS.NO_CUMPLIDO)} className="px-4 py-2.5 border border-red-500 bg-red-50 text-red-700 rounded-lg font-bold text-sm">Rechazar (No Cumplido)</button>
                    <button onClick={() => handleReview(STATUS.CON_OBSERVACIONES)} className="px-4 py-2.5 border border-yellow-500 bg-yellow-50 text-yellow-700 rounded-lg font-bold text-sm">Solicitar Ajustes</button>
                    <button onClick={() => handleReview(STATUS.CUMPLIDO)} className="px-6 py-2.5 bg-[#8CC63F] text-white rounded-lg font-bold text-sm">Aprobar (Cumplido)</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Asignar Entregable a Profesional">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Profesional <span className="text-red-500">*</span></label>
            <select required value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#165399] outline-none">
              <option value="">Seleccione a quién asignar...</option>
              {canSeeAll ? (<><optgroup label="Mi Equipo Directo">{employees.filter(e => myTeamIds.includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup><optgroup label="Otros Profesionales">{employees.filter(e => !myTeamIds.includes(e.id) && (e.role === 'Junior' || e.role === 'Aprendiz')).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup></>) : employees.filter(e => myTeamIds.includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Título <span className="text-red-500">*</span></label><input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-[#165399] mb-1">Categoría <span className="text-red-500">*</span></label><select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value ? parseInt(e.target.value) : '', subcategory: ''})} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccione...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            {formData.categoryId === 1 && (<div><label className="block text-sm font-bold text-[#165399] mb-1">Tipo <span className="text-red-500">*</span></label><select required value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccione...</option>{selectedCategory?.subcategories?.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}</select></div>)}
          </div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Semana de Ejecución <span className="text-red-500">*</span></label><input required type="text" value={formData.week} onChange={e => setFormData({...formData, week: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Descripción</label><textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg"></textarea></div>
          <div className="pt-4 border-t flex justify-end gap-2"><button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#8CC63F] text-white rounded-lg font-bold">Asignar Entregable</button></div>
        </form>
      </Modal>

      <Modal isOpen={isGroupAssignModalOpen} onClose={() => setIsGroupAssignModalOpen(false)} title="Asignación Grupal de Entregable (Colaboración)">
        <form onSubmit={handleCreateGroupTask} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-[#165399]">Seleccione los profesionales <span className="text-red-500">*</span></label>
              <button type="button" onClick={() => { groupFormData.assigneeIds.length === availableJuniors.length ? setGroupFormData({...groupFormData, assigneeIds: []}) : setGroupFormData({...groupFormData, assigneeIds: availableJuniors.map(e=>e.id)}); }} className="text-xs text-[#165399] font-bold bg-white px-2 py-1 rounded shadow-sm">{groupFormData.assigneeIds.length === availableJuniors.length ? 'Deseleccionar todos' : 'Seleccionar todos'}</button>
            </div>
            <div className="max-h-32 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 bg-white p-2 rounded">
              {availableJuniors.map(emp => (
                 <label key={emp.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={groupFormData.assigneeIds.includes(emp.id)} onChange={(e) => { e.target.checked ? setGroupFormData({...groupFormData, assigneeIds: [...groupFormData.assigneeIds, emp.id]}) : setGroupFormData({...groupFormData, assigneeIds: groupFormData.assigneeIds.filter(id => id !== emp.id)}); }} className="rounded text-[#165399]" />{emp.name}</label>
              ))}
            </div>
          </div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Título <span className="text-red-500">*</span></label><input required type="text" value={groupFormData.title} onChange={e => setGroupFormData({...groupFormData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-[#165399] mb-1">Categoría <span className="text-red-500">*</span></label><select required value={groupFormData.categoryId} onChange={e => setGroupFormData({...groupFormData, categoryId: e.target.value ? parseInt(e.target.value) : '', subcategory: ''})} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccione...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            {groupFormData.categoryId === 1 && (<div><label className="block text-sm font-bold text-[#165399] mb-1">Tipo <span className="text-red-500">*</span></label><select required value={groupFormData.subcategory} onChange={e => setGroupFormData({...groupFormData, subcategory: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccione...</option>{groupSelectedCategory?.subcategories?.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}</select></div>)}
          </div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Semana <span className="text-red-500">*</span></label><input required type="text" value={groupFormData.week} onChange={e => setGroupFormData({...groupFormData, week: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Descripción</label><textarea rows="3" value={groupFormData.description} onChange={e => setGroupFormData({...groupFormData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg"></textarea></div>
          <div className="pt-4 border-t flex justify-end gap-2"><button type="button" onClick={() => setIsGroupAssignModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded-lg font-bold">Asignar a Grupo</button></div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Datos del Entregable">
        <form onSubmit={handleUpdateTaskDetails} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Profesional <span className="text-red-500">*</span></label>
            <select required value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Seleccione a quién asignar...</option>
              {canSeeAll ? (<><optgroup label="Mi Equipo Directo">{employees.filter(e => myTeamIds.includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup><optgroup label="Otros Profesionales">{employees.filter(e => !myTeamIds.includes(e.id) && (e.role === 'Junior' || e.role === 'Aprendiz')).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup></>) : employees.filter(e => myTeamIds.includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Título <span className="text-red-500">*</span></label><input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-[#165399] mb-1">Categoría <span className="text-red-500">*</span></label><select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value ? parseInt(e.target.value) : '', subcategory: ''})} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccione...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            {formData.categoryId === 1 && (<div><label className="block text-sm font-bold text-[#165399] mb-1">Tipo <span className="text-red-500">*</span></label><select required value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccione...</option>{selectedCategory?.subcategories?.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}</select></div>)}
          </div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Semana <span className="text-red-500">*</span></label><input required type="text" value={formData.week} onChange={e => setFormData({...formData, week: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Descripción</label><textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg"></textarea></div>
          <div className="pt-4 border-t flex justify-end gap-2"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded-lg font-bold">Guardar</button></div>
        </form>
      </Modal>

      <Modal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} title="Reprogramar Entregable">
        <form onSubmit={handleReschedule} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm mb-4"><p className="text-sm font-black text-[#165399]">{activeTask?.title}</p><p className="text-xs font-bold text-gray-600 mt-1">Semana actual: {activeTask?.assignedWeek}</p></div>
          <div><label className="block text-sm font-bold text-[#165399] mb-1">Nueva semana <span className="text-red-500">*</span></label><select required value={rescheduleWeek} onChange={e => setRescheduleWeek(e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccione...</option>{upcomingWeeks.map(w => <option key={w} value={w}>{w}</option>)}</select></div>
          <div className="pt-4 border-t flex justify-end gap-2"><button type="button" onClick={() => setIsRescheduleModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded-lg font-bold">Reprogramar</button></div>
        </form>
      </Modal>
    </div>
  );
};

/* --- APLICACIÓN PRINCIPAL CON FLUJO SEGURO --- */
const App = () => {
  const [firebaseUser, setFirebaseUser] = useState(null); 
  const [authError, setAuthError] = useState('');
  
  const [tasks, setTasks] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [appConfig, setAppConfig] = useState({ employees: DEFAULT_EMPLOYEES, categories: DEFAULT_CATEGORIES, indicators: DEFAULT_INDICATORS });
  const [isDbReady, setIsDbReady] = useState(false);
  const [dashboardMode, setDashboardMode] = useState('TRACKING'); 

  // 1. Escuchar la sesión de Firebase Auth
  useEffect(() => {
    if (!auth) { setIsDbReady(true); return; }
    const unsub = onAuthStateChanged(auth, (user) => { setFirebaseUser(user); setIsDbReady(true); });
    return () => unsub();
  }, []);

  // 2. Suscripciones a la Base de Datos (Solo si está logueado)
  useEffect(() => {
    if (!isDbReady || !firebaseUser || !db) return;
    
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'emssanar_tasks');
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const data = []; snapshot.forEach(doc => data.push(doc.data())); setTasks(data);
    }, (err) => console.error(err));

    // NUEVO: Escuchar Indicadores Mensuales
    const measRef = collection(db, 'artifacts', appId, 'public', 'data', 'emssanar_measurements');
    const unsubMeas = onSnapshot(measRef, (snapshot) => {
      const data = []; snapshot.forEach(doc => data.push(doc.data())); setMeasurements(data);
    }, (err) => console.error(err));

    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_settings', 'main_config');
    const unsubConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const dbData = docSnap.data();
        const mergedEmployees = dbData.employees.map(dbEmp => {
           if (!dbEmp.email) {
              const defEmp = DEFAULT_EMPLOYEES.find(d => d.id === dbEmp.id);
              return { ...dbEmp, email: defEmp ? defEmp.email : '' };
           }
           return dbEmp;
        });
        const mergedIndicators = dbData.indicators && dbData.indicators.length > 0 ? dbData.indicators : DEFAULT_INDICATORS;
        setAppConfig({ ...dbData, employees: mergedEmployees, indicators: mergedIndicators });
      } else {
        setDoc(configRef, { employees: DEFAULT_EMPLOYEES, categories: DEFAULT_CATEGORIES, indicators: DEFAULT_INDICATORS });
        setAppConfig({ employees: DEFAULT_EMPLOYEES, categories: DEFAULT_CATEGORIES, indicators: DEFAULT_INDICATORS });
      }
    }, (err) => console.error(err));

    return () => { unsubTasks(); unsubConfig(); unsubMeas(); };
  }, [isDbReady, firebaseUser]);

  // 3. Vincular el correo logueado con el perfil interno
  const currentUser = useMemo(() => {
    if (!firebaseUser || !appConfig.employees) return null;
    return appConfig.employees.find(emp => emp.email?.toLowerCase() === firebaseUser.email?.toLowerCase());
  }, [firebaseUser, appConfig]);

  // Regla Viernes (Auto Atrasado)
  useEffect(() => {
    if (tasks.length === 0 || !isDbReady || !currentUser) return;
    const checkOverdue = async () => {
      const now = new Date();
      const myOverdueTasks = tasks.filter(t => t.assigneeId === currentUser.id && (t.status === STATUS.ASIGNADO || t.status === STATUS.EN_PROGRESO) && t.assignedWeek);
      
      for (const t of myOverdueTasks) {
        const match = t.assignedWeek.match(/al (\d{2})\/(\d{2})\/(\d{2})/);
        if (match) {
           const day = parseInt(match[1], 10); const month = parseInt(match[2], 10) - 1; const year = parseInt(match[3], 10) + 2000;
           const friday = new Date(year, month, day, 23, 59, 59);
           if (now > friday && db) {
               try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_tasks', t.id), { status: STATUS.NO_REPORTADO }); } catch (e) {}
           }
        }
      }
    };
    const timer = setInterval(checkOverdue, 60000);
    return () => clearInterval(timer);
  }, [tasks, isDbReady, currentUser]);

  const pendingReviewsCount = useMemo(() => {
    if (!currentUser || !currentUser.canReview) return 0;
    return tasks.filter(t => t.reviewerId === currentUser.id && (t.status === STATUS.EN_REVISION || t.status === STATUS.SOLICITUD_CONTINUIDAD)).length;
  }, [tasks, currentUser]);

  // Funciones de Auth
  const handleLogin = async (email, password) => {
    if (!auth) return;
    try {
      setAuthError(''); await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setAuthError('Correo o contraseña incorrectos.');
      } else { setAuthError('Error: ' + error.message); }
    }
  };

  const handleLogout = async () => { if (auth) await signOut(auth); setFirebaseUser(null); };

  // Pantallas de Carga y Bloqueo
  if (!isDbReady) return <div className="min-h-screen bg-gray-100 flex items-center justify-center font-bold text-[#165399]">Cargando plataforma segura...</div>;
  if (!firebaseUser) return <LoginScreen onLogin={handleLogin} authError={authError} />;
  if (!currentUser) {
    return (
       <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 text-center">
         <div className="bg-white p-8 rounded-xl shadow-lg border-t-8 border-red-600 max-w-md w-full">
           <Icon name="alert" className="w-16 h-16 text-red-600 mx-auto mb-4" />
           <h2 className="text-xl font-black text-red-700 mb-2">Usuario no autorizado</h2>
           <p className="mb-6 text-sm text-gray-600 font-medium">El correo <span className="font-bold text-[#165399]">{firebaseUser.email}</span> no está vinculado a ningún profesional en la base de datos de esta plataforma.</p>
           <button onClick={handleLogout} className="w-full bg-[#165399] hover:bg-[#114078] text-white font-bold px-4 py-3 rounded-lg transition-colors">Cerrar Sesión e intentar de nuevo</button>
         </div>
       </div>
    );
  }

  // Controladores BD
  const handleUpdateConfig = async (newConfig) => {
    if (db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_settings', 'main_config'), newConfig); } catch (e) {} }
  };

  const handleAddTask = async (t) => { if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_tasks', t.id), t); };
  const handleUpdateTaskStatus = async (id, s) => { if (db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_tasks', id), { status: s }); };
  const handleUpdateTaskData = async (id, d) => { if (db) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_tasks', id), d); };
  
  const handleAddComment = async (id, c) => {
    if (db) { const task = tasks.find(t => t.id === id); if (task) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_tasks', id), { comments: [...(task.comments || []), c] }); }
  };
  
  const handleDeleteTask = async (id) => { if (db) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_tasks', id)); } catch (error) {} } };

  // Controladores Mediciones
  const handleSaveMeasurement = async (measurementData) => {
     if (db) {
        try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_measurements', measurementData.id), measurementData); } catch (e) { console.error("Error guardando medición", e) }
     }
  };

  const handleImportTasks = async (importedTasks) => {
    if (!Array.isArray(importedTasks) || !db) return;
    for (const t of importedTasks) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_tasks', t.id), t); } catch (e) {} }
  };

  const handleClearAllTasks = async () => {
    if (!db) return;
    for (const t of tasks) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'emssanar_tasks', t.id)); } catch (e) {} }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="bg-[#165399] text-white shadow-lg sticky top-0 z-40 border-b-4 border-[#8CC63F]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight leading-tight uppercase">Sistema de Gestión de Entregables</h1>
            <h2 className="text-xs font-bold text-[#8CC63F] uppercase tracking-widest">Planeación y Calidad</h2>
          </div>
          
          {(currentUser.role === 'Coordinador' || currentUser.role === 'Jefe') && (
            <div className="flex bg-[#114078] p-1 rounded-lg border border-blue-800 shadow-inner overflow-hidden mx-auto md:mx-0">
              <button onClick={() => setDashboardMode('TRACKING')} className={`px-4 py-1.5 text-sm font-bold transition-colors ${dashboardMode === 'TRACKING' ? 'bg-[#8CC63F] text-white rounded' : 'text-blue-200 hover:text-white'}`}>Seguimiento</button>
              <button onClick={() => setDashboardMode('ADMIN')} className={`px-4 py-1.5 text-sm font-bold flex items-center gap-1 transition-colors ${dashboardMode === 'ADMIN' ? 'bg-[#8CC63F] text-white rounded' : 'text-blue-200 hover:text-white'}`}>
                <Icon name="settings" className="w-4 h-4"/> Configuración
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 bg-[#114078] px-4 py-2 rounded-xl shadow-inner border border-blue-800">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{currentUser.name}</p>
              <p className="text-[10px] text-[#AAB4C2] font-black uppercase tracking-wider">{currentUser.role}</p>
            </div>
            <div className="w-10 h-10 bg-[#8CC63F] rounded-full flex items-center justify-center text-white font-black text-lg shadow-md border-2 border-white">
              {currentUser.name.charAt(0)}
            </div>
            <button onClick={handleLogout} className="ml-2 text-xs bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg font-bold transition-colors shadow-sm">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {dashboardMode === 'ADMIN' ? (
          <AdminPanel 
            config={appConfig} onUpdateConfig={handleUpdateConfig} tasks={tasks} currentUser={currentUser}
            onUpdateTaskData={handleUpdateTaskData} onDeleteTask={handleDeleteTask} onImportTasks={handleImportTasks} onClearAllTasks={handleClearAllTasks}
          />
        ) : (
          <>
            <div className="mb-6 flex gap-4">
              <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100"><Icon name="user" className="w-6 h-6 text-[#165399]" /></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Perfil Actual</p><p className="text-lg font-black text-[#165399]">{currentUser.role}</p></div>
              </div>
              {currentUser.canReview && (
                <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100"><Icon name="clock" className="w-6 h-6 text-[#8CC63F]" /></div>
                  <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendientes de Revisión</p><p className="text-lg font-black text-[#8CC63F]">{pendingReviewsCount} Entregables</p></div>
                </div>
              )}
            </div>

            {currentUser.canReview ? (
              <ReviewerDashboard user={currentUser} tasks={tasks} categories={appConfig.categories} config={appConfig} employees={appConfig.employees} measurements={measurements} onAddTask={handleAddTask} onUpdateTaskStatus={handleUpdateTaskStatus} onAddComment={handleAddComment} onUpdateTaskData={handleUpdateTaskData} onDeleteTask={handleDeleteTask} onSaveMeasurement={handleSaveMeasurement} />
            ) : (
              <JuniorDashboard user={currentUser} tasks={tasks} categories={appConfig.categories} onAddTask={handleAddTask} onUpdateTaskStatus={handleUpdateTaskStatus} onUpdateTaskData={handleUpdateTaskData} onDeleteTask={handleDeleteTask} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;