import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle, Circle, AlertCircle, Search, Edit, Trash2 } from 'lucide-react';
import { getProjects, getTasks, createTask, updateTask, deleteTask } from './api';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [newTask, setNewTask] = useState({
    title: '', description: '', project: '', deadline: '', priority: 'medium', status: 'pending', assignee: ''
  });

  useEffect(() => {
    (async () => {
      const [p, t] = await Promise.all([getProjects(), getTasks()]);
      setProjects(p.map(x => x.name));
      setTasks(t);
    })();
  }, []);

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };
  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };

  const getStatusIcon = (status) => status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-600"/> : status === 'in-progress' ? <Clock className="w-4 h-4 text-blue-600"/> : <Circle className="w-4 h-4 text-gray-400"/>;
  const getPriorityIcon = (priority) => <AlertCircle className={`w-4 h-4 ${priority==='high'?'text-red-500':priority==='medium'?'text-yellow-500':'text-green-500'}`}/>;

  const isOverdue = (deadline) => {
    const d = new Date(deadline);
    const now = new Date();
    return d < now && d.toDateString() !== now.toDateString();
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = task.title.toLowerCase().includes(s) || (task.description||'').toLowerCase().includes(s) || (task.assignee||'').toLowerCase().includes(s);
      const matchesProject = filterProject === 'all' || task.project === filterProject;
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesProject && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, filterProject, filterStatus, filterPriority]);

  const refresh = async () => setTasks(await getTasks());

  const handleAddTask = async () => {
    if (newTask.title && newTask.project && newTask.deadline) {
      await createTask(newTask);
      setShowAddForm(false);
      setNewTask({ title: '', description: '', project: '', deadline: '', priority: 'medium', status: 'pending', assignee: '' });
      await refresh();
    }
  };
  const handleUpdateTask = async () => {
    if (!editingTask) return;
    await updateTask(editingTask.id, editingTask);
    setEditingTask(null);
    await refresh();
  };
  const handleDeleteTask = async (id) => { await deleteTask(id); await refresh(); };
  const toggleTaskStatus = async (id) => {
    const statusOrder = ['pending','in-progress','completed'];
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const next = statusOrder[(statusOrder.indexOf(t.status)+1)%statusOrder.length];
    await updateTask(id, { status: next });
    await refresh();
  };
  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');
  const getDaysUntilDeadline = (deadline) => {
    const today = new Date(); const dd = new Date(deadline); const diff = dd - today; return Math.ceil(diff/ (1000*60*60*24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Task Tracker</h1>
          <p className="text-gray-600">Quản lý công việc hiệu quả và theo dõi tiến độ dự án</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Clock className="w-6 h-6 text-blue-600"/>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Tổng Task</p>
                <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <AlertCircle className="w-6 h-6 text-yellow-600"/>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Đang thực hiện</p>
                <p className="text-2xl font-bold text-gray-800">{tasks.filter(t=>t.status==='in-progress').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600"/>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-gray-800">{tasks.filter(t=>t.status==='completed').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <Calendar className="w-6 h-6 text-red-600"/>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Quá hạn</p>
                <p className="text-2xl font-bold text-gray-800">{tasks.filter(t=>isOverdue(t.deadline)).length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm task..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  value={searchTerm} 
                  onChange={e=>setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                value={filterProject} 
                onChange={e=>setFilterProject(e.target.value)}
              >
                <option value="all">Tất cả dự án</option>
                {projects.map(p=> <option key={p} value={p}>{p}</option>)}
              </select>
              <select 
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                value={filterStatus} 
                onChange={e=>setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ thực hiện</option>
                <option value="in-progress">Đang thực hiện</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
              <select 
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                value={filterPriority} 
                onChange={e=>setFilterPriority(e.target.value)}
              >
                <option value="all">Tất cả mức độ</option>
                <option value="high">Ưu tiên cao</option>
                <option value="medium">Ưu tiên trung bình</option>
                <option value="low">Ưu tiên thấp</option>
              </select>
            </div>
            <button 
              onClick={()=>setShowAddForm(true)} 
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4"/>
              Thêm Task
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Thêm Task Mới</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={newTask.title} 
                    onChange={e=>setNewTask({...newTask, title: e.target.value})} 
                    placeholder="Nhập tiêu đề task"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    rows="3" 
                    value={newTask.description} 
                    onChange={e=>setNewTask({...newTask, description: e.target.value})} 
                    placeholder="Nhập mô tả chi tiết"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={newTask.project} 
                      onChange={e=>setNewTask({...newTask, project: e.target.value})}
                    >
                      <option value="">Chọn dự án</option>
                      {projects.map(p=> <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={newTask.assignee} 
                      onChange={e=>setNewTask({...newTask, assignee: e.target.value})} 
                      placeholder="Tên người phụ trách"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={newTask.deadline} 
                      onChange={e=>setNewTask({...newTask, deadline: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={newTask.priority} 
                      onChange={e=>setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={newTask.status} 
                      onChange={e=>setNewTask({...newTask, status: e.target.value})}
                    >
                      <option value="pending">Chờ thực hiện</option>
                      <option value="in-progress">Đang thực hiện</option>
                      <option value="completed">Đã hoàn thành</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button 
                  onClick={()=>setShowAddForm(false)} 
                  className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleAddTask} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Thêm Task
                </button>
              </div>
            </div>
          </div>
        )}

        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Chỉnh sửa Task</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={editingTask.title} 
                    onChange={e=>setEditingTask({...editingTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    rows="3" 
                    value={editingTask.description||''} 
                    onChange={e=>setEditingTask({...editingTask, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editingTask.project} 
                      onChange={e=>setEditingTask({...editingTask, project: e.target.value})}
                    >
                      {projects.map(p=> <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editingTask.assignee||''} 
                      onChange={e=>setEditingTask({...editingTask, assignee: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editingTask.deadline} 
                      onChange={e=>setEditingTask({...editingTask, deadline: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editingTask.priority} 
                      onChange={e=>setEditingTask({...editingTask, priority: e.target.value})}
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      value={editingTask.status} 
                      onChange={e=>setEditingTask({...editingTask, status: e.target.value})}
                    >
                      <option value="pending">Chờ thực hiện</option>
                      <option value="in-progress">Đang thực hiện</option>
                      <option value="completed">Đã hoàn thành</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button 
                  onClick={()=>setEditingTask(null)} 
                  className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleUpdateTask} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Không có task nào</h3>
              <p className="text-gray-500">Hãy thêm task mới để bắt đầu quản lý công việc</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className={`bg-white rounded-xl shadow-sm border-l-4 ${task.priority==='high'?'border-l-red-500':task.priority==='medium'?'border-l-yellow-500':'border-l-green-500'} hover:shadow-md transition-shadow`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button onClick={()=>toggleTaskStatus(task.id)} className="mt-1">
                        {getStatusIcon(task.status)}
                      </button>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{task.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400"/>
                            <span className={`${isOverdue(task.deadline)?'text-red-600 font-medium':'text-gray-600'}`}>
                              {formatDate(task.deadline)}
                            </span>
                            {isOverdue(task.deadline) && (
                              <span className="text-red-600 text-xs font-medium">(Quá hạn)</span>
                            )}
                            {getDaysUntilDeadline(task.deadline) >= 0 && !isOverdue(task.deadline) && (
                              <span className="text-gray-500 text-xs">
                                (Còn {getDaysUntilDeadline(task.deadline)} ngày)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                              {getPriorityIcon(task.priority)}
                              <span className="ml-1">
                                {task.priority==='high'?'Ưu tiên cao':task.priority==='medium'?'Ưu tiên TB':'Ưu tiên thấp'}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                              {task.status==='pending'?'Chờ thực hiện':task.status==='in-progress'?'Đang thực hiện':'Đã hoàn thành'}
                            </span>
                          </div>
                          {task.assignee && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Phụ trách:</span>
                              <span className="font-medium text-gray-800">{task.assignee}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        {task.project}
                      </span>
                      <button 
                        onClick={()=>setEditingTask({...task})} 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4"/>
                      </button>
                      <button 
                        onClick={()=>handleDeleteTask(task.id)} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;