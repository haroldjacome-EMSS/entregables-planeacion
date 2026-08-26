import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, LabelList, Label
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
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
  [STATUS.NO_CUMPLIDO]: '#991B1B', 
  [STATUS.CONTINUADO]: '#F97316',
  [STATUS.NO_REPORTADO]: '#DC2626',
};

const DEFAULT_CATEGORIES = [
  { 
    id: 1, 
    name: 'Gestión y documentación de procesos',
    shortName: 'Procesos',
    subcategories: [
      { name: 'Subprocesos', maxWeeks: 4 },
      { name: 'Protocolos y Rutas', maxWeeks: 4 },
      { name: 'Procedimientos', maxWeeks: 2 },
      { name: 'Manuales', maxWeeks: 2 },
      { name: 'Formatos', maxWeeks: 1 },
      { name: 'Indicadores', maxWeeks: 1 },
      { name: 'Socialización', maxWeeks: null }
    ]
  },
  { id: 2, name: 'Medición y análisis del desempeño', shortName: 'Desempeño' },
  { id: 3, name: 'Seguimiento a la gestión institucional', shortName: 'Seguimiento' },
  { id: 4, name: 'Auditoría y gestión de evidencias', shortName: 'Auditoría' },
  { id: 5, name: 'Soporte técnico y metodológico', shortName: 'Soporte' }
];

const DEFAULT_EMPLOYEES = [
  { id: '1085253822', name: 'Jhoana Consuelo Vallejo Ramos', role: 'Jefe', canReview: true },
  { id: '1085929260', name: 'Harold Andres Jacome', role: 'Coordinador', canReview: true },
  { id: '1144210824', name: 'Angie Carolina Champutiz Vera', role: 'Especializado', canReview: true },
  { id: '52706231', name: 'Iveth Juliana Ruales Reyes', role: 'Especializado', canReview: true },
  { id: '1085322527', name: 'Catherine Andrea Guzman Cabrera', role: 'Junior', reviewerId: '52706231' },
  { id: '1085320212', name: 'Kelinn Alexandra Saavedra Moreno', role: 'Junior', reviewerId: '1144210824' },
  { id: '1085308340', name: 'Andres Giovani Chaves Rosales', role: 'Junior', reviewerId: '1085929260' },
  { id: '1085339480', name: 'Angie Carolina Polo Delgado', role: 'Junior', reviewerId: '1144210824' },
  { id: '1085320251', name: 'Diana Marcela Rodriguez Garcia', role: 'Junior', reviewerId: '1085929260' },
  { id: '1085331161', name: 'Jesus Daniel Yampuezan Benavides', role: 'Junior', reviewerId: '1144210824' },
  { id: '1085318323', name: 'Andrés Felipe Realpe Pantoja', role: 'Junior', reviewerId: '52706231' },
  { id: '1085324699', name: 'Andrés Felipe Delgado Riascos', role: 'Junior', reviewerId: '52706231' },
  { id: '1094949915', name: 'Jheison Diaz Lopez', role: 'Junior', reviewerId: '1085929260' },
  { id: '1085322996', name: 'Andrés Francisco Cabezas Dajome', role: 'Junior', reviewerId: '1085253822' },
  { id: '1087643352', name: 'Harrison Hermel Castillo Chicunque', role: 'Aprendiz', reviewerId: '1085929260' }
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

  const monday = new Date(d);
  monday.setUTCDate(monday.getUTCDate() - 3);
  const friday = new Date(monday);
  friday.setUTCDate(friday.getUTCDate() + 4);

  const formatDate = (dt) => `${dt.getUTCDate().toString().padStart(2, '0')}/${(dt.getUTCMonth() + 1).toString().padStart(2, '0')}/${dt.getUTCFullYear().toString().slice(-2)}`;
  
  return `${year}-W${weekNo.toString().padStart(2, '0')} (${formatDate(monday)} al ${formatDate(friday)})`;
};

const getNextWeekData = (weekString) => {
  if (!weekString) return getWeekData(new Date(Date.now() + 7 * 86400000));
  const match = weekString.match(/\((\d{2})\/(\d{2})\/(\d{2})/);
  if (match) {
    const [_, day, month, yearStr] = match;
    const year = parseInt(yearStr, 10) + 2000;
    const date = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10));
    date.setDate(date.getDate() + 7);
    return getWeekData(date);
  }
  return getWeekData(new Date(Date.now() + 7 * 86400000));
};

const getUpcomingWeeksList = () => {
  const weeks = [];
  const now = new Date();
  for (let i = -4; i < 12; i++) {
    const d = new Date(now.getTime() + i * 7 * 86400000);
    weeks.push(getWeekData(d));
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
    trash: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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

/* --- MÓDULO DE LOGIN --- */
const LoginScreen = ({ onLogin, employees }) => {
  const [selectedRole, setSelectedRole] = useState('Junior');
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (selectedUser) {
      const user = employees.find(emp => emp.id === selectedUser);
      if (password === user.id) {
        onLogin(user);
      } else {
        setErrorMsg('Contraseña incorrecta. Recuerde que su contraseña es su número de cédula.');
      }
    }
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
            <label className="block text-sm font-semibold text-[#165399] mb-2">Seleccione su Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {['Jefe', 'Coordinador', 'Especializado', 'Junior'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setSelectedRole(role); setSelectedUser(''); setPassword(''); setErrorMsg(''); }}
                  className={`py-2 px-3 text-sm font-bold rounded-lg border transition-colors ${
                    selectedRole === role ? 'bg-[#165399] text-white border-[#165399] shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-[#165399] mb-2">Seleccione el Usuario</label>
            <select 
              required
              value={selectedUser}
              onChange={(e) => { setSelectedUser(e.target.value); setErrorMsg(''); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none transition-shadow bg-gray-50 text-gray-800 font-medium"
            >
              <option value="">Seleccione...</option>
              {employees.filter(emp => selectedRole === 'Junior' ? (emp.role === 'Junior' || emp.role === 'Aprendiz') : emp.role === selectedRole).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#165399] mb-2">Contraseña</label>
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
              placeholder="Número de cédula"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none transition-shadow bg-gray-50 text-gray-800 font-medium"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 font-bold shadow-sm text-center">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={!selectedUser || !password}
            className="w-full bg-[#8CC63F] hover:bg-[#78b030] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 shadow-md"
          >
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

/* --- MÓDULO DE DASHBOARD / MÉTRICAS --- */
const DashboardMetrics = ({ tasks, employees }) => {
  const total = tasks.length;
  
  // Agrupación estricta en 3 estados
  const cumplidos = tasks.filter(t => t.status === STATUS.CUMPLIDO).length;
  const noCumplidos = tasks.filter(t => t.status === STATUS.NO_CUMPLIDO || t.status === STATUS.NO_REPORTADO).length;
  const enRevisionYOtros = total - cumplidos - noCumplidos;

  // Agrupación de 3 estados para la gráfica circular (PieChart)
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

  // Agrupación de 3 estados para la gráfica de barras (BarChart) - CON NOMBRES Y APELLIDOS
  const assigneeStats = tasks.reduce((acc, task) => {
    const empId = task.assigneeId; // Usamos el ID de usuario como llave única para no mezclar Andrèses o Angies

    if (!acc[empId]) {
      const fullName = getAssigneeName(empId, employees);
      const parts = fullName.trim().split(' ');
      let displayName = parts[0];
      
      // Extraer Primer Nombre y Primer Apellido
      if (parts.length >= 4) {
        displayName = `${parts[0]} ${parts[2]}`; // ej. Andrés Felipe Realpe Pantoja -> Andrés Realpe
      } else if (parts.length === 3) {
        displayName = `${parts[0]} ${parts[1]}`; // ej. Jheison Diaz Lopez -> Jheison Diaz
      } else if (parts.length === 2) {
        displayName = `${parts[0]} ${parts[1]}`;
      }

      acc[empId] = { 
        profesional: displayName, 
        'Cumplido': 0, 
        'En Revisión': 0, 
        'No Cumplido': 0,
        total: 0 
      };
    }
    
    if (task.status === STATUS.CUMPLIDO) {
      acc[empId]['Cumplido'] += 1;
    } else if (task.status === STATUS.NO_CUMPLIDO || task.status === STATUS.NO_REPORTADO) {
      acc[empId]['No Cumplido'] += 1;
    } else {
      acc[empId]['En Revisión'] += 1;
    }
    
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
        {/* Total */}
        <div className="bg-[#165399] p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute opacity-10 right-[-10px] top-[-10px]"><Icon name="pie" className="w-24 h-24" /></div>
          <span className="text-4xl font-black relative z-10">{total}</span>
          <span className="text-[10px] font-bold uppercase mt-1 text-center opacity-90 relative z-10 tracking-widest">Total Entregables</span>
        </div>
        
        {/* Cumplidos */}
        <div className="bg-[#8CC63F] p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute opacity-20 right-[-10px] top-[-10px]"><Icon name="check" className="w-24 h-24" /></div>
          <span className="text-4xl font-black relative z-10">{cumplidos}</span>
          <span className="text-[10px] font-bold uppercase mt-1 text-center opacity-90 relative z-10 tracking-widest">Cumplidos</span>
        </div>
        
        {/* En Revisión / Pendientes */}
        <div className="bg-[#AAB4C2] p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-white relative overflow-hidden">
           <div className="absolute opacity-20 right-[-10px] top-[-10px]"><Icon name="clock" className="w-24 h-24" /></div>
          <span className="text-4xl font-black relative z-10">{enRevisionYOtros}</span>
          <span className="text-[10px] font-bold uppercase mt-1 text-center opacity-90 relative z-10 tracking-widest">En Revisión / Pendientes</span>
        </div>
        
        {/* No Cumplidos */}
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
          {/* TÍTULO CAMBIADO A "Y APELLIDO" PARA VERIFICAR QUE SE ACTUALIZÓ EN EL NAVEGADOR */}
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
  const [newUser, setNewUser] = useState({ id: '', name: '', role: 'Junior', reviewerId: '' });
  const [categoriesState, setCategoriesState] = useState(config.categories);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

  // Estados BD Cruda
  const [editDbModal, setEditDbModal] = useState(false);
  const [dbTaskEdit, setDbTaskEdit] = useState(null);

  const handleAddUser = (e) => {
    e.preventDefault();
    if(config.employees.find(emp => emp.id === newUser.id)) {
      alert("Ya existe un usuario con esta cédula.");
      return;
    }
    const updatedEmployees = [...config.employees, { ...newUser, canReview: ['Jefe', 'Coordinador', 'Especializado'].includes(newUser.role) }];
    onUpdateConfig({ ...config, employees: updatedEmployees });
    setNewUser({ id: '', name: '', role: 'Junior', reviewerId: '' });
  };

  const handleDeleteUser = (id) => {
    if(window.confirm("¿Seguro que desea eliminar a este profesional del equipo?")) {
      onUpdateConfig({ ...config, employees: config.employees.filter(emp => emp.id !== id) });
    }
  };

  const openEditUser = (emp) => {
    setEditingUser({ ...emp, reviewerId: emp.reviewerId || '' });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    const updatedEmployees = config.employees.map(emp => 
      emp.id === editingUser.id 
        ? { ...editingUser, canReview: ['Jefe', 'Coordinador', 'Especializado'].includes(editingUser.role) }
        : emp
    );
    onUpdateConfig({ ...config, employees: updatedEmployees });
    setIsEditUserModalOpen(false);
    setEditingUser(null);
  };

  const handleUpdateCategoryTime = (subcategoryName, newValue) => {
    const updated = [...categoriesState];
    const cat1 = updated.find(c => c.id === 1);
    const sub = cat1.subcategories.find(s => s.name === subcategoryName);
    if (sub) sub.maxWeeks = newValue === '' ? null : parseInt(newValue, 10);
    setCategoriesState(updated);
  };

  const saveCategories = () => {
    onUpdateConfig({ ...config, categories: categoriesState });
    alert("Tiempos de gestión actualizados exitosamente.");
  };

  const exportToCSV = () => {
    const headers = ['ID Tarea', 'Semana de Ejecución', 'Profesional Asignado', 'Categoría', 'Tipo de Documento', 'Título del Entregable', 'Estado Actual', 'Fecha de Asignación', 'Descripción de Gestión', 'Link de Evidencias'];
    const csvRows = [headers.join(',')];
    
    tasks.forEach(task => {
      const row = [
        task.id, `"${task.assignedWeek}"`, `"${getAssigneeName(task.assigneeId, config.employees)}"`,
        `"${task.category}"`, `"${task.subcategory || 'N/A'}"`, `"${(task.title || '').replace(/"/g, '""')}"`,
        `"${task.status}"`, `"${task.createdAt}"`, `"${(task.managementDescription || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${task.evidenceLink || 'N/A'}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Reporte_General_PYC_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funciones BD Cruda
  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Backup_Entregables_Crudo_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (Array.isArray(json)) {
          if(window.confirm(`Se encontraron ${json.length} registros. ¿Desea importarlos a la base de datos?`)) {
            onImportTasks(json);
            alert(`Se inició la importación de ${json.length} registros.`);
          }
        } else {
          alert("El archivo no tiene el formato correcto (debe ser un array JSON).");
        }
      } catch (err) {
        alert("Error al leer el archivo. Asegúrese de que sea un JSON válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const saveDbTaskEdit = (e) => {
    e.preventDefault();
    onUpdateTaskData(dbTaskEdit.id, dbTaskEdit);
    setEditDbModal(false);
    setDbTaskEdit(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 flex-wrap">
          <button onClick={() => setActiveTab('USERS')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'USERS' ? 'bg-white border-b-2 border-[#165399] text-[#165399]' : 'text-gray-500 hover:text-gray-800'}`}>Miembros del Equipo</button>
          <button onClick={() => setActiveTab('CATEGORIES')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'CATEGORIES' ? 'bg-white border-b-2 border-[#165399] text-[#165399]' : 'text-gray-500 hover:text-gray-800'}`}>Tiempos de Gestión</button>
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
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cédula / Documento</label>
                    <input required type="text" value={newUser.id} onChange={e=>setNewUser({...newUser, id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#165399] outline-none text-sm"/>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
                    <input required type="text" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#165399] outline-none text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Rol</label>
                    <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#165399] outline-none text-sm">
                      <option value="Junior">Junior</option>
                      <option value="Aprendiz">Aprendiz</option>
                      <option value="Especializado">Especializado</option>
                      <option value="Coordinador">Coordinador</option>
                      <option value="Jefe">Jefe</option>
                    </select>
                  </div>
                  {(newUser.role === 'Junior' || newUser.role === 'Aprendiz') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Supervisor a Cargo</label>
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
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cédula</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Supervisor Asignado</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {config.employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{emp.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"><span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{emp.role}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.reviewerId ? getAssigneeName(emp.reviewerId, config.employees) : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => openEditUser(emp)} className="text-[#165399] hover:text-[#114078] bg-blue-50 p-2 rounded-lg mr-2" title="Editar"><Icon name="edit" className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteUser(emp.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg" title="Eliminar"><Icon name="trash" className="w-4 h-4" /></button>
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
                {categoriesState.find(c => c.id === 1).subcategories.map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <span className="text-sm font-bold text-gray-700">{sub.name}</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1"
                        value={sub.maxWeeks || ''} 
                        onChange={(e) => handleUpdateCategoryTime(sub.name, e.target.value)}
                        placeholder="Sin límite"
                        className="w-24 px-3 py-1 border border-gray-300 rounded text-sm text-center"
                      />
                      <span className="text-xs text-gray-500 font-bold uppercase">Semanas</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={saveCategories} className="bg-[#165399] hover:bg-[#114078] text-white font-bold py-2 px-6 rounded shadow-sm transition-colors">Guardar Tiempos</button>
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
                <div className="flex gap-2">
                  <button onClick={exportToJSON} className="bg-[#165399] hover:bg-[#114078] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-1">
                    <Icon name="download" className="w-4 h-4"/> Backup (Exportar JSON)
                  </button>
                  <label className="bg-[#8CC63F] hover:bg-[#78b030] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm cursor-pointer flex items-center gap-1">
                    <Icon name="upload" className="w-4 h-4"/> Restaurar (Importar JSON)
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <button 
                  onClick={() => {
                    if(window.confirm('🚨 ¡PELIGRO! ¿Está absolutamente seguro de querer ELIMINAR TODOS los entregables de la base de datos? Esta acción es destructiva y no se puede deshacer.')) {
                      onClearAllTasks();
                    }
                  }} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-1"
                >
                  <Icon name="trash" className="w-4 h-4"/> Vaciar Base de Datos Completa
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[500px]">
                <table className="min-w-full divide-y divide-gray-200 relative">
                  <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">ID / Fecha</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Título del Entregable</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Profesional (Cédula)</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Semana</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-right text-[10px] font-black text-gray-500 uppercase tracking-wider">Acción Cruda</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map(task => (
                      <tr key={task.id} className="hover:bg-orange-50 transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                          <span className="font-mono text-[9px] block text-gray-400">{task.id}</span>
                          {task.createdAt}
                        </td>
                        <td className="px-4 py-2 text-xs font-bold text-gray-900 max-w-xs truncate" title={task.title}>{task.title}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">{task.assigneeId}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">{task.assignedWeek}</td>
                        <td className="px-4 py-2 whitespace-nowrap"><Badge status={task.status} /></td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                          <button onClick={() => { setDbTaskEdit(task); setEditDbModal(true); }} className="text-[#165399] hover:text-[#114078] bg-blue-50 p-1.5 rounded mr-2" title="Edición Cruda"><Icon name="edit" className="w-4 h-4" /></button>
                          <button onClick={() => { if(window.confirm('¿Borrar registro de la base de datos?')) onDeleteTask(task.id); }} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded" title="Forzar Eliminado"><Icon name="trash" className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                    {tasks.length === 0 && (
                      <tr><td colSpan="6" className="text-center py-8 text-sm text-gray-500 font-bold">La base de datos está vacía.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal de edición de usuarios */}
      <Modal isOpen={isEditUserModalOpen} onClose={() => setIsEditUserModalOpen(false)} title="Editar Miembro del Equipo">
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#165399] mb-1">Cédula / Documento</label>
              <input type="text" value={editingUser.id} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-bold outline-none cursor-not-allowed" title="No se puede cambiar la cédula" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#165399] mb-1">Nombre Completo</label>
              <input required type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#165399] mb-1">Rol</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value, reviewerId: ['Junior', 'Aprendiz'].includes(e.target.value) ? editingUser.reviewerId : ''})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none">
                  <option value="Junior">Junior</option>
                  <option value="Aprendiz">Aprendiz</option>
                  <option value="Especializado">Especializado</option>
                  <option value="Coordinador">Coordinador</option>
                  <option value="Jefe">Jefe</option>
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
              <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded-lg hover:bg-[#114078] font-bold transition-colors shadow-sm">Guardar Cambios</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Edición Cruda de BD */}
      <Modal isOpen={editDbModal} onClose={() => setEditDbModal(false)} title="Edición Cruda de Registro">
        {dbTaskEdit && (
          <form onSubmit={saveDbTaskEdit} className="space-y-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800 font-bold mb-4">
              ⚠️ ATENCIÓN: Está editando directamente los valores crudos de la base de datos. Modificar estados o IDs sin cuidado puede romper la lógica del sistema.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ID (No editable)</label>
                <input type="text" value={dbTaskEdit.id} readOnly className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-100 text-xs text-gray-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cédula Asignado (assigneeId)</label>
                <input type="text" value={dbTaskEdit.assigneeId} onChange={e => setDbTaskEdit({...dbTaskEdit, assigneeId: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Título</label>
                <input type="text" value={dbTaskEdit.title} onChange={e => setDbTaskEdit({...dbTaskEdit, title: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Semana Asignada</label>
                <input type="text" value={dbTaskEdit.assignedWeek} onChange={e => setDbTaskEdit({...dbTaskEdit, assignedWeek: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Estado (Debe coincidir exacto)</label>
                <select value={dbTaskEdit.status} onChange={e => setDbTaskEdit({...dbTaskEdit, status: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs">
                  {Object.values(STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
              <button type="button" onClick={() => setEditDbModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-bold text-sm">Forzar Guardado en BD</button>
            </div>
          </form>
        )}
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

  const [formData, setFormData] = useState({
    title: '', categoryId: '', subcategory: '', description: '', week: getWeekData(new Date())
  });

  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const upcomingWeeks = getUpcomingWeeksList();

  const handleCreateTask = (e) => {
    e.preventDefault();
    const taskSubcategoryObj = selectedCategory?.subcategories?.find(s => s.name === formData.subcategory);
    const deadlineInfo = (formData.categoryId === 1 && taskSubcategoryObj?.maxWeeks)
        ? `Máximo ${taskSubcategoryObj.maxWeeks} semana(s)` : 'Sin límite estricto';

    const newTask = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: selectedCategory.name,
      subcategory: formData.categoryId === 1 ? formData.subcategory : '',
      deadlineInfo,
      assignedWeek: formData.week,
      assigneeId: user.id,
      reviewerId: user.reviewerId,
      status: STATUS.ASIGNADO,
      createdAt: getCurrentDateFormatted(),
      comments: [],
      managementDescription: '',
      evidenceLink: '',
      continuedCount: 0,
      allowExtraTime: false
    };

    onAddTask(newTask);
    setIsModalOpen(false);
    setFormData({ title: '', categoryId: '', subcategory: '', description: '', week: getWeekData(new Date()) });
  };

  const openReportModal = (task) => {
    setActiveTask(task);
    setReportData({ description: task.managementDescription || '', link: task.evidenceLink || '' });
    setRequestContinuation(task.status === STATUS.SOLICITUD_CONTINUIDAD);
    setErrorMsg('');
    setReportModalOpen(true);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!reportData.description.trim() || !reportData.link.trim()) {
      setErrorMsg('Por favor complete la descripción y agregue el enlace de las evidencias.');
      return;
    }
    
    const statusUpdate = requestContinuation ? STATUS.SOLICITUD_CONTINUIDAD : STATUS.EN_REVISION;

    onUpdateTaskData(activeTask.id, {
      managementDescription: reportData.description,
      evidenceLink: reportData.link,
      status: statusUpdate
    });
    
    setReportModalOpen(false);
    setActiveTask(null);
  };

  const handleReschedule = (e) => {
    e.preventDefault();
    onUpdateTaskData(activeTask.id, { assignedWeek: rescheduleWeek });
    setIsRescheduleModalOpen(false);
    setActiveTask(null);
  };

  const myTasks = tasks.filter(t => t.assigneeId === user.id);
  const groupedTasks = groupTasksByWeek(myTasks);
  
  const totalTasks = myTasks.length;
  const cumplidosCount = myTasks.filter(t => t.status === STATUS.CUMPLIDO).length;
  const pendientesCount = totalTasks - cumplidosCount;
  const complianceRate = totalTasks > 0 ? Math.round((cumplidosCount / totalTasks) * 100) : 0;

  const pieData = [
    { name: 'Cumplidos', value: cumplidosCount, fill: STATUS_HEX_COLORS[STATUS.CUMPLIDO] },
    { name: 'Pendientes', value: pendientesCount, fill: '#E5E7EB' }
  ];

  const taskCategoryObj = categories.find(c => c.name === activeTask?.category);
  const taskSubcategoryObj = taskCategoryObj?.subcategories?.find(s => s.name === activeTask?.subcategory);
  const currentWeeks = (activeTask?.continuedCount || 0) + 1;
  const isLimitReached = (activeTask?.category === categories[0].name && taskSubcategoryObj?.maxWeeks) ? currentWeeks >= taskSubcategoryObj.maxWeeks : false;
  const canRequestContinuation = !isLimitReached || activeTask?.allowExtraTime;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-t-8 border-t-[#8CC63F] flex flex-col md:flex-row gap-6 items-center">
         <div className="flex-1 w-full">
            <h3 className="text-lg font-black text-[#165399] mb-4">Mi Nivel de Cumplimiento</h3>
            <div className="grid grid-cols-3 gap-4">
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center flex flex-col justify-center">
                 <p className="text-3xl font-black text-gray-700">{totalTasks}</p>
                 <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Total Asignados</p>
               </div>
               <div className="bg-[#f3f9eb] p-4 rounded-lg border border-[#8CC63F] text-center flex flex-col justify-center">
                 <p className="text-3xl font-black text-[#8CC63F]">{cumplidosCount}</p>
                 <p className="text-[10px] font-bold text-[#8CC63F] uppercase mt-1">Cumplidos</p>
               </div>
               <div className="bg-[#165399] p-4 rounded-lg border border-[#114078] text-center text-white flex flex-col justify-center shadow-inner">
                 <p className="text-3xl font-black">{complianceRate}%</p>
                 <p className="text-[10px] font-bold uppercase opacity-80 mt-1">Efectividad</p>
               </div>
            </div>
         </div>
         <div className="w-full md:w-1/3 h-[180px] flex items-center justify-center relative">
            {totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    <Label 
                      value={`${complianceRate}%`} position="center" 
                      fill="#165399" fontSize={24} fontWeight="black" 
                    />
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 font-bold italic">No hay entregables asignados</p>
            )}
         </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-[#165399] border-l-8 gap-4">
        <div>
          <h2 className="text-xl font-black text-[#165399]">Mis Entregables Asignados</h2>
          <p className="text-sm text-gray-500 font-medium">Gestione el reporte y envío a revisión de sus productos.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#8CC63F] hover:bg-[#78b030] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-md">
          <Icon name="plus" className="w-5 h-5" /> Auto-Asignar Entregable
        </button>
      </div>

      {Object.entries(groupedTasks).map(([weekLabel, weekTasks]) => (
        <div key={weekLabel} className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-black text-[#165399] mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Icon name="clock" className="w-5 h-5 text-[#8CC63F]" /> {weekLabel}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekTasks.map(task => (
              <div key={task.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <Badge status={task.status} />
                    <span className="text-[10px] font-black text-[#165399] bg-blue-50 px-2 py-1 rounded truncate max-w-[120px] border border-blue-100" title={task.category}>{task.category}</span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{task.title}</h4>
                  {task.subcategory && <p className="text-xs text-[#8CC63F] font-bold mb-3">{task.subcategory}</p>}
                  
                  {task.comments && task.comments.length > 0 && (
                     (() => {
                        const style = task.status === STATUS.CUMPLIDO 
                           ? { bg: "bg-[#f3f9eb]", border: "border-[#8CC63F]", title: "text-[#8CC63F]", icon: "text-[#8CC63F]", text: "text-green-800" }
                           : (task.status === STATUS.NO_CUMPLIDO || task.status === STATUS.NO_REPORTADO)
                           ? { bg: "bg-red-50", border: "border-red-200", title: "text-red-700", icon: "text-red-600", text: "text-red-800" }
                           : { bg: "bg-yellow-50", border: "border-yellow-200", title: "text-yellow-700", icon: "text-yellow-600", text: "text-yellow-800" };

                        return (
                           <div className={`mt-2 mb-3 ${style.bg} p-3 rounded-lg border ${style.border}`}>
                              <p className={`text-[10px] font-black ${style.title} uppercase mb-1 flex items-center gap-1`}>
                                 <Icon name="alert" className={`w-3 h-3 ${style.icon}`}/> Feedback de {task.comments[task.comments.length - 1].author}:
                              </p>
                              <p className={`text-xs ${style.text} font-medium line-clamp-2`}>{task.comments[task.comments.length - 1].text}</p>
                           </div>
                        );
                     })()
                  )}

                  <div className="flex items-center text-xs text-gray-500 font-medium gap-1 mt-auto pt-3 border-t border-gray-50">
                    <Icon name="clock" className="w-4 h-4 text-[#AAB4C2]" />
                    Límite: {task.deadlineInfo}
                    {(task.continuedCount > 0) && <span className="ml-2 font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">Semana {task.continuedCount + 1}</span>}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-col gap-2">
                  <div className="flex gap-2 w-full">
                    {(task.status === STATUS.ASIGNADO || task.status === STATUS.NO_REPORTADO) && (
                      <button onClick={() => onUpdateTaskStatus(task.id, STATUS.EN_PROGRESO)} className="text-xs w-full bg-white border border-[#165399] text-[#165399] hover:bg-blue-50 px-3 py-2 rounded-lg font-bold shadow-sm transition-colors">
                        {task.status === STATUS.NO_REPORTADO ? 'Iniciar Atrasado' : 'Iniciar Trabajo'}
                      </button>
                    )}
                    {(task.status === STATUS.EN_PROGRESO || task.status === STATUS.CON_OBSERVACIONES) && (
                      <button onClick={() => openReportModal(task)} className="text-xs w-full bg-[#165399] hover:bg-[#114078] text-white px-3 py-2 rounded-lg font-bold shadow-sm transition-colors">
                        Redactar Reporte y Enviar
                      </button>
                    )}
                    {(task.status === STATUS.EN_REVISION || task.status === STATUS.SOLICITUD_CONTINUIDAD) && (
                      <button onClick={() => openReportModal(task)} className="text-xs w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-1 shadow-sm transition-colors">
                        <Icon name="edit" className="w-3 h-3" /> Modificar Reporte Enviado
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 w-full">
                    {task.status !== STATUS.CUMPLIDO && (
                      <button onClick={() => { setActiveTask(task); setRescheduleWeek(task.assignedWeek); setIsRescheduleModalOpen(true); }} className="text-xs flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-1 shadow-sm transition-colors">
                        <Icon name="clock" className="w-3 h-3" /> Reprogramar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Auto-Asignar Nuevo Entregable">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Título del Producto / Entregable <span className="text-red-500">*</span></label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#165399] mb-1">Categoría <span className="text-red-500">*</span></label>
              <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value ? parseInt(e.target.value) : '', subcategory: ''})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none">
                <option value="">Seleccione una categoría...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            {formData.categoryId === 1 && (
              <div>
                <label className="block text-sm font-bold text-[#165399] mb-1">Tipo de Documento <span className="text-red-500">*</span></label>
                <select required value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none">
                  <option value="">Seleccione...</option>
                  {selectedCategory?.subcategories?.map((s, idx) => <option key={idx} value={s.name}>{s.name} {s.maxWeeks ? `(Máx. ${s.maxWeeks} sem)` : ''}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Semana de Ejecución <span className="text-red-500">*</span></label>
            <input type="text" value={formData.week} onChange={e => setFormData({...formData, week: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-bold outline-none" readOnly />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Descripción / Objetivos Específicos</label>
            <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none"></textarea>
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#8CC63F] text-white rounded-lg hover:bg-[#78b030] font-bold transition-colors shadow-sm">Asignar Entregable</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Reportar Gestión del Entregable">
        <form onSubmit={handleSubmitReport} className="space-y-4">
          {errorMsg && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 font-bold shadow-sm">{errorMsg}</div>}
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
            <p className="text-sm font-black text-[#165399]">{activeTask?.title}</p>
            {activeTask?.subcategory && <p className="text-xs text-[#8CC63F] font-bold mt-1">{activeTask?.subcategory}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Descripción de la Gestión Realizada <span className="text-red-500">*</span></label>
            <textarea required rows="4" value={reportData.description} onChange={e => setReportData({...reportData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" placeholder="Detalle las actividades realizadas para este entregable..."></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Enlace de Soportes/Evidencias <span className="text-red-500">*</span></label>
            <input required type="url" value={reportData.link} onChange={e => setReportData({...reportData, link: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none" placeholder="Ej. https://emssanar.sharepoint.com/..." />
          </div>

          <div className={`p-4 rounded-xl border ${!canRequestContinuation ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
             <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={requestContinuation} onChange={(e) => setRequestContinuation(e.target.checked)} disabled={!canRequestContinuation} className="w-4 h-4 text-[#165399] rounded border-gray-300 focus:ring-[#165399]" />
               <span className={`text-sm font-bold ${!canRequestContinuation ? 'text-red-700' : 'text-gray-700'}`}>Solicitar continuar con el entregable la próxima semana</span>
             </label>
             {!canRequestContinuation && (
               <p className="text-xs text-red-600 mt-2 ml-6 font-medium">No es posible solicitar continuidad automáticamente. Ha alcanzado el tiempo límite de {taskSubcategoryObj?.maxWeeks} semana(s) para este tipo de documento. Requiere autorización del supervisor.</p>
             )}
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={() => setReportModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded-lg hover:bg-[#114078] font-bold transition-colors shadow-sm">Guardar y Enviar a Revisión</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} title="Reprogramar Entregable">
        <form onSubmit={handleReschedule} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm mb-4">
            <p className="text-sm font-black text-[#165399]">{activeTask?.title}</p>
            <p className="text-xs font-bold text-gray-600 mt-1">Semana actual: {activeTask?.assignedWeek}</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#165399] mb-1">Seleccione la nueva semana de ejecución <span className="text-red-500">*</span></label>
            <select required value={rescheduleWeek} onChange={e => setRescheduleWeek(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165399] outline-none">
              <option value="">Seleccione...</option>
              {upcomingWeeks.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={() => setIsRescheduleModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded-lg hover:bg-[#114078] font-bold transition-colors shadow-sm">Guardar Reprogramación</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default App;