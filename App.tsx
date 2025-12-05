import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Users, Calendar, Save, Download, Upload, 
  Plus, Trash2, Edit2, Check, X as XIcon, 
  BarChart3, Settings, ShieldCheck, UserCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { AppData, AttendanceStatus, Student, TOTAL_DAYS } from './types';
import { exportToCSV, exportToJSON } from './utils/export';
import { Mascot } from './components/Mascot';

// --- INITIAL STATE ---
const INITIAL_STATE: AppData = {
  students: [],
  attendance: {},
  trainingTitle: 'JDVP Technical Drafting Training',
  startDate: new Date().toISOString().split('T')[0]
};

const App: React.FC = () => {
  // --- STATE ---
  const [data, setData] = useState<AppData>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'students' | 'settings'>('dashboard');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Persistence: Load on Mount
  useEffect(() => {
    const saved = localStorage.getItem('jdvp_data_v1');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Persistence: Save on Change
  useEffect(() => {
    localStorage.setItem('jdvp_data_v1', JSON.stringify(data));
  }, [data]);

  // --- ACTIONS ---

  const addStudent = (student: Student) => {
    setData(prev => ({
      ...prev,
      students: [...prev.students, student]
    }));
  };

  const removeStudent = (id: string) => {
    if (!confirm("Are you sure? This will remove the student and all their records.")) return;
    setData(prev => {
      const newAttendance = { ...prev.attendance };
      delete newAttendance[id];
      return {
        ...prev,
        students: prev.students.filter(s => s.id !== id),
        attendance: newAttendance
      };
    });
  };

  const updateAttendance = (studentId: string, day: number, status: AttendanceStatus) => {
    setData(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [studentId]: {
          ...(prev.attendance[studentId] || {}),
          [day]: status
        }
      }
    }));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.students && json.attendance) {
          setData(json);
          alert("Data imported successfully!");
        } else {
          throw new Error("Invalid structure");
        }
      } catch (err) {
        alert("Failed to import file. Please ensure it is a valid JDVP backup JSON.");
      }
    };
    reader.readAsText(file);
  };

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    const dailyStats: any[] = [];

    // Initialize daily stats
    for (let i = 1; i <= TOTAL_DAYS; i++) {
      dailyStats.push({ day: `Day ${i}`, present: 0, absent: 0, late: 0 });
    }

    data.students.forEach(s => {
      const record = data.attendance[s.id] || {};
      for (let i = 1; i <= TOTAL_DAYS; i++) {
        const status = record[i];
        if (status === AttendanceStatus.PRESENT) {
          totalPresent++;
          dailyStats[i-1].present++;
        } else if (status === AttendanceStatus.ABSENT) {
          totalAbsent++;
          dailyStats[i-1].absent++;
        } else if (status === AttendanceStatus.LATE) {
          totalLate++;
          dailyStats[i-1].late++;
        }
      }
    });

    return { totalPresent, totalAbsent, totalLate, dailyStats };
  }, [data]);

  // --- SUB-COMPONENTS ---

  const AttendanceGrid = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Calendar size={18} />
          Mark Attendance (Day 1 - {TOTAL_DAYS})
        </h3>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> P</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> A</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> L</div>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 font-medium sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="sticky left-0 bg-gray-100 p-3 min-w-[200px] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Student Name</th>
              {Array.from({ length: TOTAL_DAYS }).map((_, i) => (
                <th key={i} className="p-2 min-w-[50px] text-center border-l border-gray-200">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.students.length === 0 ? (
               <tr>
                 <td colSpan={TOTAL_DAYS + 1} className="p-8 text-center text-gray-400">
                   No students added yet. Go to "Students" tab.
                 </td>
               </tr>
            ) : (
              data.students.map(student => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="sticky left-0 bg-white p-3 font-medium text-gray-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[200px] border-r border-gray-100 z-10">
                    {student.name}
                  </td>
                  {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
                    const dayNum = i + 1;
                    const status = data.attendance[student.id]?.[dayNum] || AttendanceStatus.NONE;
                    
                    let bgClass = "";
                    if (status === AttendanceStatus.PRESENT) bgClass = "bg-green-100 text-green-700 font-bold";
                    if (status === AttendanceStatus.ABSENT) bgClass = "bg-red-100 text-red-700 font-bold";
                    if (status === AttendanceStatus.LATE) bgClass = "bg-yellow-100 text-yellow-700 font-bold";
                    if (status === AttendanceStatus.EXCUSED) bgClass = "bg-blue-100 text-blue-700 font-bold";

                    return (
                      <td 
                        key={dayNum} 
                        className={`p-1 text-center border-l border-gray-100 cursor-pointer hover:brightness-95 transition-all select-none ${bgClass}`}
                        onClick={() => {
                          const cycle = [AttendanceStatus.NONE, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED];
                          const currentIdx = cycle.indexOf(status);
                          const nextStatus = cycle[(currentIdx + 1) % cycle.length];
                          updateAttendance(student.id, dayNum, nextStatus);
                        }}
                        title={`Day ${dayNum}: ${status}`}
                      >
                        {status !== AttendanceStatus.NONE ? status : ''}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Students</p>
              <h4 className="text-3xl font-bold text-gray-800 mt-2">{data.students.length}</h4>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
              <Users size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Attendance Rate</p>
              <h4 className="text-3xl font-bold text-green-600 mt-2">
                {stats.totalPresent + stats.totalAbsent + stats.totalLate > 0 
                  ? Math.round((stats.totalPresent / (stats.totalPresent + stats.totalAbsent + stats.totalLate)) * 100)
                  : 0}%
              </h4>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-green-600">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Absences</p>
              <h4 className="text-3xl font-bold text-red-500 mt-2">{stats.totalAbsent}</h4>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-red-500">
              <UserCheck size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Training Day</p>
              <h4 className="text-3xl font-bold text-orange-500 mt-2">40 Days</h4>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-orange-500">
              <Calendar size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" />
          Attendance Overview (First 20 Days vs Last 20 Days)
        </h3>
        <div className="h-80 w-full">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dailyStats.filter((_, i) => i % 5 === 0)}> {/* Sample every 5 days for clarity */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{fontSize: 12}} />
              <YAxis />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend />
              <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" name="Late" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">*Chart sampled every 5 days for readability</p>
      </div>
    </div>
  );

  const StudentManager = () => {
    const [newStudent, setNewStudent] = useState({ name: '', schoolId: '', strand: '' });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newStudent.name) return;
      addStudent({
        id: crypto.randomUUID(),
        name: newStudent.name,
        schoolId: newStudent.schoolId,
        strand: newStudent.strand
      });
      setNewStudent({ name: '', schoolId: '', strand: '' });
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-5 duration-500">
        {/* Add Student Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="bg-indigo-100 text-indigo-600 p-1 rounded-md" size={24} />
              Add New Student
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Juan Dela Cruz"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School ID</label>
                <input 
                  type="text" 
                  value={newStudent.schoolId}
                  onChange={e => setNewStudent({...newStudent, schoolId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. 123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strand/Section</label>
                <input 
                  type="text" 
                  value={newStudent.strand}
                  onChange={e => setNewStudent({...newStudent, strand: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. ICT - A"
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition shadow-md">
                Add Student
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 bg-gray-50 border-b border-gray-100">
               <h3 className="font-semibold text-gray-700">Enrolled Students ({data.students.length})</h3>
             </div>
             <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
               {data.students.length === 0 && (
                 <div className="p-10 text-center text-gray-400">
                   No students found. Add one on the left!
                 </div>
               )}
               {data.students.map(s => (
                 <div key={s.id} className="p-4 flex justify-between items-center hover:bg-gray-50 group">
                   <div>
                     <h4 className="font-medium text-gray-900">{s.name}</h4>
                     <p className="text-sm text-gray-500">{s.schoolId} • {s.strand}</p>
                   </div>
                   <button 
                     onClick={() => removeStudent(s.id)}
                     className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                   >
                     <Trash2 size={18} />
                   </button>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const SettingsPanel = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Download size={20} className="text-green-600"/>
          Export & Collaboration
        </h3>
        <p className="text-gray-600 mb-6 text-sm">
          Since this app runs offline, you can share data by exporting a file and sending it to your colleagues to import.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => exportToCSV(data)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition shadow-sm"
          >
            <Download size={18} />
            Export to Excel (CSV)
          </button>
          
          <button 
             onClick={() => exportToJSON(data)}
             className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-medium transition shadow-sm"
          >
            <Save size={18} />
            Backup Data (JSON)
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Upload size={18} className="text-blue-600"/>
            Import Backup
          </h4>
          <div className="relative">
             <input 
              type="file" 
              accept=".json" 
              onChange={handleImport}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-dashed border-gray-300 rounded-lg p-4"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
        <strong>Note:</strong> Data is automatically saved to this browser. If you clear your cache, you will lose data unless you export a backup.
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Calendar size={20} strokeWidth={2.5} />
              </div>
              <div>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={data.trainingTitle}
                      onChange={(e) => setData({...data, trainingTitle: e.target.value})}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                      className="text-lg font-bold text-gray-900 border-b-2 border-indigo-500 focus:outline-none"
                    />
                    <button onClick={() => setIsEditingTitle(false)} className="text-green-600"><Check size={18}/></button>
                  </div>
                ) : (
                  <h1 
                    className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {data.trainingTitle}
                    <Edit2 size={14} className="text-gray-400" />
                  </h1>
                )}
                <p className="text-xs text-gray-500">40-Day JDVP Training Tracker</p>
              </div>
            </div>
            
            {/* Desktop Tabs */}
            <div className="hidden md:flex items-center space-x-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'students', label: 'Students', icon: Users },
                { id: 'attendance', label: 'Attendance', icon: Calendar },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === tab.id 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex justify-around border-t border-gray-200 bg-white">
          {[
              { id: 'dashboard', icon: BarChart3 },
              { id: 'students', icon: Users },
              { id: 'attendance', icon: Calendar },
              { id: 'settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 flex justify-center items-center ${
                  activeTab === tab.id ? 'text-indigo-600 border-t-2 border-indigo-600' : 'text-gray-400'
                }`}
              >
                <tab.icon size={20} />
              </button>
            ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'students' && <StudentManager />}
        {activeTab === 'attendance' && (
           <div className="h-[calc(100vh-12rem)] animate-in fade-in duration-500">
             <AttendanceGrid />
           </div>
        )}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>

      {/* AI Mascot */}
      <Mascot data={data} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
