import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList, Label 
} from 'recharts';
import { 
  UserCircle, LogOut, PlusCircle, CheckCircle, Clock, AlertCircle, 
  Settings, Download, Edit, Trash2, CalendarClock, ExternalLink
} from 'lucide-react';

// === CONFIGURACIÓN DE BASE DE DATOS HÍBRIDA ===
const PROD_FIREBASE_CONFIG = {
  // Cuando tengas Firebase, pega tus credenciales aquí.
};

// === DATOS INICIALES MOCK (En caso de no haber LocalStorage) ===
const initialUsers = [
  { id: '123456', name: 'Jhoana Consuelo Vallejo Ramos', role: 'Jefe', supervisorId: null },
  { id: '234567', name: 'Harold Andres Jacome', role: 'Coordinador', supervisorId: '123456' },
  { id: '345678', name: 'Profesional Especializado 1', role: 'Especializado', supervisorId: '234567' },
  { id: '456789', name: 'Profesional Junior 1', role: 'Junior', supervisorId: '345678' }
];

const categories = [
  "Gestión y documentación de procesos",
  "Análisis de datos",
  "Desarrollo de proyectos",
  "Soporte técnico",
  "Otro"
];

const documentTypes = ["Procedimiento", "Manual", "Guía", "Formato"];

const COLORS = {
  'Cumplido': '#8CC63F',      // Verde Institucional
  'No Cumplido': '#E11D48',   // Rojo
  'Ajustes': '#F59E0B',       // Naranja
  'En Revisión': '#3B82F6',   // Azul claro
  'En progreso': '#165399',   // Azul Institucional
  'Asignado': '#64748B',      // Gris
  'No Reportado': '#7F1D1D',  // Rojo Oscuro
  'Continuado': '#10B981'     // Esmeralda
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function EmssanarPlataforma() {
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('emss_users')) || initialUsers);
  const [deliverables, setDeliverables] = useState(() => JSON.parse(localStorage.getItem('emss_deliverables')) || []);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginId, setLoginId] = useState('');
  
  // Vistas
  const [view, setView] = useState('dashboard'); // dashboard | admin
  
  // Efecto para persistencia LocalStorage
  useEffect(() => {
    localStorage.setItem('emss_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('emss_deliverables', JSON.stringify(deliverables));
  }, [deliverables]);

  // Efecto: Regla del Viernes (No Reportado)
  useEffect(() => {
    const checkFridays = () => {
      const now = new Date();
      // Si es Viernes (5) después de las 23:59, o Sábado/Domingo, marcar no reportados de la semana actual.
      // (Por simplicidad en demo, esto evalúa la fecha. En producción se usaría la fecha límite de la semana objetivo).
      const updated = deliverables.map(d => {
        if ((d.status === 'Asignado' || d.status === 'En progreso') && new Date(d.deadline) < now) {
          return { ...d, status: 'No Reportado' };
        }
        return d;
      });
      if (JSON.stringify(updated) !== JSON.stringify(deliverables)) {
        setDeliverables(updated);
      }
    };
    const interval = setInterval(checkFridays, 3600000); // Revisar cada hora
    return () => clearInterval(interval);
  }, [deliverables]);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.id === loginId);
    if (user) {
      setCurrentUser(user);
    } else {
      alert("Cédula no encontrada en el sistema.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginId('');
    setView('dashboard');
  };

  // Función global para Exportar a CSV
  const exportToCSV = () => {
    const headers = ["ID", "Título", "Categoría", "Asignado A", "Semana", "Estado", "Reporte Junior"];
    const rows = deliverables.map(d => [
      d.id,
      `"${d.title}"`,
      `"${d.category}"`,
      `"${users.find(u => u.id === d.assigneeId)?.name || ''}"`,
      d.targetWeek,
      d.status,
      `"${d.juniorReport || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_entregables_emssanar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Si no hay usuario, mostrar Login
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-[#165399] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">EMSSANAR</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-[#165399] mb-6">Plataforma PYC</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Documento (Cédula)</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#8CC63F] focus:border-[#8CC63F]"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-[#165399] text-white py-2 rounded hover:bg-blue-800 transition">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Corporativo */}
      <header className="bg-[#165399] text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#165399] font-bold">PYC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">EMSSANAR EPS</h1>
              <p className="text-xs text-blue-200">Planeación y Calidad</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Menú Jefe/Coordinador */}
            {(currentUser.role === 'Jefe' || currentUser.role === 'Coordinador') && (
              <div className="flex gap-4">
                <button onClick={() => setView('dashboard')} className={`hover:text-[#8CC63F] transition ${view === 'dashboard' ? 'text-[#8CC63F] font-bold' : ''}`}>Dashboard</button>
                {currentUser.role === 'Coordinador' && (
                  <button onClick={() => setView('admin')} className={`hover:text-[#8CC63F] transition ${view === 'admin' ? 'text-[#8CC63F] font-bold' : ''}`}>Administración</button>
                )}
                <button onClick={exportToCSV} className="flex items-center gap-1 hover:text-[#8CC63F] transition">
                  <Download size={18}/> Exportar
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2 border-l border-blue-400 pl-6">
              <UserCircle size={24} />
              <div className="text-right">
                <p className="text-sm font-bold">{currentUser.name}</p>
                <p className="text-xs text-blue-200">{currentUser.role}</p>
              </div>
              <button onClick={handleLogout} className="ml-4 text-red-300 hover:text-red-100">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {view === 'admin' && currentUser.role === 'Coordinador' ? (
          <AdminPanel users={users} setUsers={setUsers} />
        ) : (
          <>
            {['Jefe', 'Coordinador', 'Especializado'].includes(currentUser.role) ? (
              <SupervisorDashboard 
                currentUser={currentUser} 
                users={users} 
                deliverables={deliverables} 
                setDeliverables={setDeliverables} 
              />
            ) : (
              <JuniorDashboard 
                currentUser={currentUser} 
                deliverables={deliverables} 
                setDeliverables={setDeliverables} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ==========================================
// COMPONENTE: SUPERVISOR DASHBOARD
// ==========================================
function SupervisorDashboard({ currentUser, users, deliverables, setDeliverables }) {
  const teamMembers = users.filter(u => u.supervisorId === currentUser.id || currentUser.role === 'Jefe' || currentUser.role === 'Coordinador');
  const teamIds = teamMembers.map(u => u.id);
  
  // Entregables del equipo
  const teamDeliverables = deliverables.filter(d => teamIds.includes(d.assigneeId));

  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Modals de acciones
  const [isEvaluateModalOpen, setEvaluateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isRescheduleModalOpen, setRescheduleModalOpen] = useState(false);

  // Estados de formularios
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDocType, setNewDocType] = useState('');
  const [newTargetWeek, setNewTargetWeek] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [supervisorComment, setSupervisorComment] = useState('');

  // Eliminar
  const handleDelete = (id) => {
    if(window.confirm("¿Está seguro de eliminar este entregable? Esta acción no se puede deshacer.")) {
      setDeliverables(prev => prev.filter(d => d.id !== id));
    }
  };

  // Reprogramar
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setDeliverables(prev => prev.map(d => 
      d.id === selectedTask.id ? { ...d, targetWeek: newTargetWeek } : d
    ));
    setRescheduleModalOpen(false);
    setSelectedTask(null);
  };

  // Evaluar (Aprobar/Rechazar)
  const handleEvaluateSubmit = (e, status) => {
    e.preventDefault();
    setDeliverables(prev => prev.map(d => 
      d.id === selectedTask.id ? { 
        ...d, 
        status: status, 
        supervisorComment: supervisorComment 
      } : d
    ));
    setEvaluateModalOpen(false);
    setSelectedTask(null);
  };

  // Asignar o Editar Guardar
  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!newCategory) {
      alert("Debe seleccionar una categoría.");
      return;
    }
    
    if (selectedTask && isEditModalOpen) {
      // Editar
      setDeliverables(prev => prev.map(d => d.id === selectedTask.id ? {
        ...d,
        title: newTitle,
        category: newCategory,
        docType: newCategory === 'Gestión y documentación de procesos' ? newDocType : '',
        targetWeek: newTargetWeek,
        assigneeId: newAssignee
      } : d));
      setEditModalOpen(false);
    } else {
      // Nuevo
      const newTask = {
        id: Date.now().toString(),
        title: newTitle,
        category: newCategory,
        docType: newCategory === 'Gestión y documentación de procesos' ? newDocType : '',
        targetWeek: newTargetWeek,
        assigneeId: newAssignee,
        status: 'Asignado',
        deadline: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString() // Lógica simple 7 días
      };
      setDeliverables([...deliverables, newTask]);
      setAssignModalOpen(false);
    }
    setSelectedTask(null);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setNewTitle(task.title);
    setNewCategory(task.category);
    setNewDocType(task.docType || '');
    setNewTargetWeek(task.targetWeek);
    setNewAssignee(task.assigneeId);
    setEditModalOpen(true);
  };

  const openRescheduleModal = (task) => {
    setSelectedTask(task);
    setNewTargetWeek(task.targetWeek);
    setRescheduleModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Seguimiento de Equipo</h2>
        <button 
          onClick={() => {
            setSelectedTask(null);
            setNewTitle(''); setNewCategory(''); setNewTargetWeek(''); setNewAssignee('');
            setAssignModalOpen(true);
          }}
          className="bg-[#8CC63F] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-green-600 transition"
        >
          <PlusCircle size={20} />
          Asignar Entregable
        </button>
      </div>

      <DashboardMetrics data={teamDeliverables} />

      {/* Lista de Entregables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamDeliverables.map(task => {
          const assigneeName = users.find(u => u.id === task.assigneeId)?.name || 'Desconocido';
          const canEvaluate = ['En Revisión', 'Ajustes', 'Cumplido', 'No Cumplido', 'Continuado'].includes(task.status);
          
          return (
            <div key={task.id} className="bg-white p-5 rounded-xl shadow border-l-4" style={{ borderColor: COLORS[task.status] }}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: `${COLORS[task.status]}20`, color: COLORS[task.status] }}>
                  {task.status}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openRescheduleModal(task)} className="text-blue-500 hover:text-blue-700" title="Reprogramar">
                    <CalendarClock size={18} />
                  </button>
                  <button onClick={() => openEditModal(task)} className="text-gray-500 hover:text-gray-700" title="Editar">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-700" title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-800">{task.title}</h3>
              <p className="text-sm text-gray-600 mt-1"><strong>Asignado a:</strong> {assigneeName}</p>
              <p className="text-sm text-gray-600"><strong>Semana:</strong> {task.targetWeek}</p>
              
              <button 
                onClick={() => {
                  setSelectedTask(task);
                  setSupervisorComment(task.supervisorComment || '');
                  setEvaluateModalOpen(true);
                }}
                className={`mt-4 w-full py-2 rounded text-sm font-bold transition ${canEvaluate ? 'bg-[#165399] text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {canEvaluate ? (task.status === 'En Revisión' ? 'Evaluar Entregable' : 'Modificar Evaluación') : 'Ver Estado'}
              </button>
            </div>
          );
        })}
        {teamDeliverables.length === 0 && (
           <p className="text-gray-500 col-span-full text-center py-8">No hay entregables asignados al equipo.</p>
        )}
      </div>

      {/* Modal Asignar / Editar */}
      {(isAssignModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#165399] p-4 text-white">
              <h3 className="font-bold text-lg">{isEditModalOpen ? 'Editar Entregable' : 'Nueva Asignación'}</h3>
            </div>
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Responsable</label>
                <select required value={newAssignee} onChange={e => setNewAssignee(e.target.value)} className="w-full border rounded p-2">
                  <option value="">Seleccione un profesional...</option>
                  {teamMembers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Título del Entregable</label>
                <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semana de Ejecución</label>
                <input required type="week" value={newTargetWeek} onChange={e => setNewTargetWeek(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select required value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full border rounded p-2">
                  <option value="">Seleccione una categoría...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {newCategory === 'Gestión y documentación de procesos' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Documento</label>
                  <select required value={newDocType} onChange={e => setNewDocType(e.target.value)} className="w-full border rounded p-2">
                    <option value="">Seleccione...</option>
                    {documentTypes.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setAssignModalOpen(false); setEditModalOpen(false); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#8CC63F] text-white rounded hover:bg-green-600 font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Evaluar */}
      {isEvaluateModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#165399] p-4 text-white">
              <h3 className="font-bold text-lg">Revisión de Entregable</h3>
            </div>
            <div className="p-6 space-y-4">
              
              {!['En Revisión', 'Ajustes', 'Cumplido', 'No Cumplido', 'Continuado'].includes(selectedTask.status) ? (
                <div className="text-center py-6">
                  <AlertCircle size={48} className="mx-auto text-yellow-500 mb-3"/>
                  <h4 className="text-lg font-bold text-gray-800">No disponible para revisión</h4>
                  <p className="text-gray-600 mt-2">El profesional aún no ha reportado la gestión de este entregable.</p>
                  <button onClick={() => setEvaluateModalOpen(false)} className="mt-6 px-4 py-2 bg-gray-200 rounded text-gray-800">Cerrar</button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 p-4 rounded border">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Reporte del Profesional:</h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedTask.juniorReport || 'Sin comentarios.'}</p>
                    
                    {selectedTask.evidenceLink && (
                      <a href={selectedTask.evidenceLink} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 bg-green-100 text-green-700 p-2 rounded border border-green-300 hover:bg-green-200 transition">
                        <ExternalLink size={18} /> Abrir Soportes / Evidencias
                      </a>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Comentarios del Supervisor (Requerido para Ajustes/Rechazo)</label>
                    <textarea 
                      className="w-full border rounded p-2" 
                      rows="3" 
                      value={supervisorComment} 
                      onChange={e => setSupervisorComment(e.target.value)}
                      placeholder="Escriba el feedback..."
                    ></textarea>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-4 justify-end">
                    <button onClick={() => setEvaluateModalOpen(false)} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                    <button onClick={(e) => handleEvaluateSubmit(e, 'Ajustes')} className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Solicitar Ajustes</button>
                    <button onClick={(e) => handleEvaluateSubmit(e, 'No Cumplido')} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">No Cumplido</button>
                    <button onClick={(e) => handleEvaluateSubmit(e, 'Cumplido')} className="px-3 py-2 bg-[#8CC63F] text-white rounded hover:bg-green-600 font-bold">Aprobar (Cumplido)</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Reprogramar */}
      {isRescheduleModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-blue-600 p-4 text-white flex gap-2 items-center">
              <CalendarClock size={20} />
              <h3 className="font-bold">Reprogramar Entregable</h3>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-2">Seleccione la nueva semana para: <strong>{selectedTask.title}</strong></p>
              <div>
                <label className="block text-sm font-medium mb-1">Nueva Semana</label>
                <input required type="week" value={newTargetWeek} onChange={e => setNewTargetWeek(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setRescheduleModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Mover</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: JUNIOR DASHBOARD
// ==========================================
function JuniorDashboard({ currentUser, deliverables, setDeliverables }) {
  const myTasks = deliverables.filter(d => d.assigneeId === currentUser.id);
  
  const [isSelfAssignModalOpen, setSelfAssignModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isRescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Estados Formularios
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [docType, setDocType] = useState('');
  const [targetWeek, setTargetWeek] = useState('');
  const [reportText, setReportText] = useState('');
  const [evidence, setEvidence] = useState('');
  const [requestContinuity, setRequestContinuity] = useState(false);

  const handleSelfAssign = (e) => {
    e.preventDefault();
    if(!category) { alert("Seleccione categoría"); return; }
    const newTask = {
      id: Date.now().toString(),
      title, category,
      docType: category === 'Gestión y documentación de procesos' ? docType : '',
      targetWeek,
      assigneeId: currentUser.id,
      status: 'Asignado',
      deadline: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
    };
    setDeliverables([...deliverables, newTask]);
    setSelfAssignModalOpen(false);
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setDeliverables(prev => prev.map(d => 
      d.id === selectedTask.id ? { 
        ...d, 
        status: requestContinuity ? 'Solicita Continuidad' : 'En Revisión',
        juniorReport: reportText,
        evidenceLink: evidence
      } : d
    ));
    setReportModalOpen(false);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setDeliverables(prev => prev.map(d => 
      d.id === selectedTask.id ? { ...d, targetWeek: targetWeek } : d
    ));
    setRescheduleModalOpen(false);
    setSelectedTask(null);
  };

  const openReportModal = (task) => {
    setSelectedTask(task);
    setReportText(task.juniorReport || '');
    setEvidence(task.evidenceLink || '');
    setRequestContinuity(false);
    setReportModalOpen(true);
  };

  const openRescheduleModal = (task) => {
    setSelectedTask(task);
    setTargetWeek(task.targetWeek);
    setRescheduleModalOpen(true);
  };

  // KPIs Junior
  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter(t => t.status === 'Cumplido').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const pieData = [
    { name: 'Cumplidos', value: completedTasks, fill: COLORS['Cumplido'] },
    { name: 'Pendientes', value: totalTasks - completedTasks, fill: '#E5E7EB' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Mi Panel de Trabajo</h2>
        <button 
          onClick={() => {
            setTitle(''); setCategory(''); setTargetWeek('');
            setSelfAssignModalOpen(true);
          }}
          className="bg-[#165399] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-800 transition"
        >
          <PlusCircle size={20} /> Auto-asignar
        </button>
      </div>

      {/* KPI Junior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center justify-center border-t-4 border-[#165399]">
          <p className="text-gray-500 text-sm font-bold">Total Entregables</p>
          <p className="text-4xl font-black text-[#165399] mt-2">{totalTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center justify-center border-t-4 border-[#8CC63F]">
          <p className="text-gray-500 text-sm font-bold">Cumplidos</p>
          <p className="text-4xl font-black text-[#8CC63F] mt-2">{completedTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow flex items-center justify-center">
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={40} outerRadius={60} dataKey="value" stroke="none">
                  <Label value={`${completionRate}%`} position="center" fill="#374151" className="font-bold text-lg" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myTasks.map(task => (
          <div key={task.id} className="bg-white p-5 rounded-xl shadow border-l-4" style={{ borderColor: COLORS[task.status] }}>
            <div className="flex justify-between items-start mb-2">
               <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: `${COLORS[task.status]}20`, color: COLORS[task.status] }}>
                {task.status}
              </span>
              <button onClick={() => openRescheduleModal(task)} className="text-blue-500 hover:text-blue-700" title="Reprogramar">
                <CalendarClock size={18} />
              </button>
            </div>
            
            <h3 className="font-bold text-lg text-gray-800">{task.title}</h3>
            <p className="text-sm text-gray-600 mt-1"><strong>Semana:</strong> {task.targetWeek}</p>
            <p className="text-xs text-gray-500 mt-1">{task.category}</p>

            {task.status === 'Ajustes' && task.supervisorComment && (
              <div className="mt-3 bg-yellow-50 p-3 rounded border border-yellow-200 text-sm">
                <strong>Comentario del Supervisor:</strong> <br/>{task.supervisorComment}
              </div>
            )}

            <button 
              onClick={() => openReportModal(task)}
              disabled={['Cumplido', 'No Cumplido', 'Continuado'].includes(task.status)}
              className="mt-4 w-full py-2 rounded text-sm font-bold transition bg-[#8CC63F] text-white hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {['Asignado', 'En progreso', 'Ajustes', 'No Reportado'].includes(task.status) ? 'Reportar Gestión' : 
               (['En Revisión'].includes(task.status) ? 'Modificar Reporte' : 'Evaluado')}
            </button>
          </div>
        ))}
      </div>

      {/* Modals Junior */}
      {isSelfAssignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#165399] p-4 text-white">
              <h3 className="font-bold text-lg">Auto-asignar Entregable</h3>
            </div>
            <form onSubmit={handleSelfAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semana</label>
                <input required type="week" value={targetWeek} onChange={e => setTargetWeek(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded p-2">
                  <option value="">Seleccione una categoría...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {category === 'Gestión y documentación de procesos' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo Documento</label>
                  <select required value={docType} onChange={e => setDocType(e.target.value)} className="w-full border rounded p-2">
                    <option value="">Seleccione...</option>
                    {documentTypes.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setSelfAssignModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#8CC63F] text-white rounded font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReportModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#8CC63F] p-4 text-white">
              <h3 className="font-bold text-lg">Reportar Gestión</h3>
            </div>
            <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descripción de la Gestión Realizada</label>
                <textarea required rows="4" value={reportText} onChange={e => setReportText(e.target.value)} className="w-full border rounded p-2"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link de Soportes / Evidencia</label>
                <input type="url" value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="https://..." className="w-full border rounded p-2" />
              </div>
              <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded border">
                <input type="checkbox" id="cont" checked={requestContinuity} onChange={e => setRequestContinuity(e.target.checked)} />
                <label htmlFor="cont" className="text-sm font-medium text-gray-700">Solicitar continuidad para la próxima semana</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setReportModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded font-bold">Enviar Reporte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRescheduleModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#165399] p-4 text-white flex gap-2 items-center">
              <CalendarClock size={20} />
              <h3 className="font-bold">Reprogramar Entregable</h3>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-2">Seleccione la nueva semana para: <strong>{selectedTask.title}</strong></p>
              <div>
                <label className="block text-sm font-medium mb-1">Nueva Semana</label>
                <input required type="week" value={targetWeek} onChange={e => setTargetWeek(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setRescheduleModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#165399] text-white rounded font-bold">Mover</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: DASHBOARD METRICS (Gráficas)
// ==========================================
function DashboardMetrics({ data }) {
  if (data.length === 0) return null;

  // Procesamiento para gráfica de barras apiladas
  const metricsByWeek = data.reduce((acc, task) => {
    const week = task.targetWeek;
    if (!acc[week]) {
      acc[week] = { week, 'Asignado': 0, 'En progreso': 0, 'No Reportado': 0, 'En Revisión': 0, 'Ajustes': 0, 'Cumplido': 0, 'No Cumplido': 0, 'Continuado': 0 };
    }
    acc[week][task.status]++;
    return acc;
  }, {});

  const chartData = Object.values(metricsByWeek).sort((a, b) => a.week.localeCompare(b.week));

  const renderCustomLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (value === 0) return null;
    return (
      <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight="bold">
        {value}
      </text>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Progreso de Entregables por Semana</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(COLORS).map(status => (
              <Bar key={status} dataKey={status} stackId="a" fill={COLORS[status]}>
                <LabelList dataKey={status} content={renderCustomLabel} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: ADMIN PANEL
// ==========================================
function AdminPanel({ users, setUsers }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  
  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      id: formData.get('id'),
      name: formData.get('name'),
      role: formData.get('role'),
      supervisorId: formData.get('supervisorId') || null
    };

    if (editUser) {
      setUsers(users.map(u => u.id === userData.id ? userData : u));
    } else {
      setUsers([...users, userData]);
    }
    setModalOpen(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-[#165399]">Administración del Sistema</h2>
        <button onClick={() => { setEditUser(null); setModalOpen(true); }} className="bg-[#8CC63F] text-white px-4 py-2 rounded font-bold flex items-center gap-2">
          <PlusCircle size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 border">Cédula (ID)</th>
              <th className="p-3 border">Nombre Completo</th>
              <th className="p-3 border">Rol</th>
              <th className="p-3 border">Supervisor</th>
              <th className="p-3 border text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-3 border font-mono">{user.id}</td>
                <td className="p-3 border font-medium">{user.name}</td>
                <td className="p-3 border">{user.role}</td>
                <td className="p-3 border">{users.find(u => u.id === user.supervisorId)?.name || 'N/A'}</td>
                <td className="p-3 border text-center">
                  <button onClick={() => { setEditUser(user); setModalOpen(true); }} className="text-[#165399] hover:text-blue-800">
                    <Edit size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Cédula</label>
                <input required name="id" defaultValue={editUser?.id} readOnly={!!editUser} className="w-full border rounded p-2 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium">Nombre</label>
                <input required name="name" defaultValue={editUser?.name} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Rol</label>
                <select required name="role" defaultValue={editUser?.role || ''} className="w-full border rounded p-2">
                  <option value="">Seleccione...</option>
                  <option value="Jefe">Jefe</option>
                  <option value="Coordinador">Coordinador</option>
                  <option value="Especializado">Especializado</option>
                  <option value="Junior">Junior</option>
                  <option value="Aprendiz SENA">Aprendiz SENA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Supervisor</label>
                <select name="supervisorId" defaultValue={editUser?.supervisorId || ''} className="w-full border rounded p-2">
                  <option value="">Ninguno</option>
                  {users.filter(u => ['Jefe', 'Coordinador', 'Especializado'].includes(u.role)).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#8CC63F] text-white rounded font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}