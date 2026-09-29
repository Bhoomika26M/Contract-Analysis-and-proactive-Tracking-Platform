import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Clock } from 'lucide-react';

const Obligations = () => {
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    completed: []
  });

  // --- NEW: Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    due_date: '',
    risk_level: 'Medium',
    responsible_person: 'Admin'
  });

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/obligations')
      .then(res => res.json())
      .then(data => {
        const categorized = { todo: [], inProgress: [], completed: [] };
        
        data.forEach(task => {
          const formattedTask = {
            id: task.id.toString(), 
            title: task.title,
            contract: task.contract_id ? `CTR-${task.contract_id}` : 'No Contract', 
            date: task.due_date,
            risk: task.risk_level
          };

          if (task.status === 'To Do') categorized.todo.push(formattedTask);
          else if (task.status === 'In Progress') categorized.inProgress.push(formattedTask);
          else if (task.status === 'Completed') categorized.completed.push(formattedTask);
        });

        setTasks(categorized);
      })
      .catch(err => console.error("Error fetching obligations:", err));
  }, []);

  const getRiskStyle = (risk) => {
    switch(risk) {
      case 'High': return { bg: '#FEE2E2', text: '#991B1B' };
      case 'Medium': return { bg: '#FEF3C7', text: '#92400E' };
      case 'Low': return { bg: '#D1FAE5', text: '#065F46' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const handleDragStart = (e, taskId, sourceColumn) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceCol', sourceColumn);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrop = (e, targetColumn) => {
    const taskId = e.dataTransfer.getData('taskId');
    const sourceCol = e.dataTransfer.getData('sourceCol');

    if (sourceCol === targetColumn) return;

    const taskToMove = tasks[sourceCol].find(task => task.id === taskId);
    
    setTasks(prevTasks => ({
      ...prevTasks,
      [sourceCol]: prevTasks[sourceCol].filter(task => task.id !== taskId),
      [targetColumn]: [...prevTasks[targetColumn], taskToMove]
    }));

    let backendStatus = 'To Do';
    if (targetColumn === 'inProgress') backendStatus = 'In Progress';
    if (targetColumn === 'completed') backendStatus = 'Completed';

    fetch(`http://127.0.0.1:8000/api/obligations/${taskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: backendStatus })
    }).catch(err => console.error("Failed to update status:", err));
  };

  // --- NEW: Handle Form Submission ---
  const handleCreateTask = (e) => {
    e.preventDefault();
    
    fetch('http://127.0.0.1:8000/api/obligations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTask.title,
        due_date: newTask.due_date,
        risk_level: newTask.risk_level,
        responsible_person: newTask.responsible_person,
        status: 'To Do',
        contract_id: null
      })
    })
    .then(res => res.json())
    .then(data => {
      // Format the new task and add it to the "To Do" column immediately
      const savedTask = data.data;
      const formattedTask = {
        id: savedTask.id.toString(),
        title: savedTask.title,
        contract: 'No Contract', 
        date: savedTask.due_date,
        risk: savedTask.risk_level
      };

      setTasks(prev => ({
        ...prev,
        todo: [...prev.todo, formattedTask]
      }));

      // Close modal and reset form
      setIsModalOpen(false);
      setNewTask({ title: '', due_date: '', risk_level: 'Medium', responsible_person: 'Admin' });
    })
    .catch(err => console.error("Failed to create task:", err));
  };

  const KanbanCard = ({ task, columnId }) => (
    <div 
      draggable
      onDragStart={(e) => handleDragStart(e, task.id, columnId)}
      style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'grab' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>{task.contract}</span>
        <span style={{ backgroundColor: getRiskStyle(task.risk).bg, color: getRiskStyle(task.risk).text, padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 'bold' }}>
          {task.risk}
        </span>
      </div>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#111827' }}>{task.title}</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', fontSize: '12px' }}>
        <Calendar size={14} />
        <span>Due {task.date}</span>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Obligation Tracker</h1>
          <p style={{ color: '#6B7280', margin: '4px 0 0 0', fontSize: '14px' }}>Manage contract deliverables and milestones.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} // --- NEW: Open modal on click ---
          style={{ backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          + New Obligation
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
        
        <div 
          onDragOver={handleDragOver} 
          onDrop={(e) => handleDrop(e, 'todo')}
          style={{ flex: 1, backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#4B5563', fontWeight: '600' }}>
            <AlertCircle size={18} /> <span>To Do</span>
            <span style={{ backgroundColor: '#E5E7EB', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px' }}>{tasks.todo.length}</span>
          </div>
          {tasks.todo.map(task => <KanbanCard key={task.id} task={task} columnId="todo" />)}
        </div>

        <div 
          onDragOver={handleDragOver} 
          onDrop={(e) => handleDrop(e, 'inProgress')}
          style={{ flex: 1, backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#D97706', fontWeight: '600' }}>
            <Clock size={18} /> <span>In Progress</span>
            <span style={{ backgroundColor: '#FDE68A', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', color: '#92400E' }}>{tasks.inProgress.length}</span>
          </div>
          {tasks.inProgress.map(task => <KanbanCard key={task.id} task={task} columnId="inProgress" />)}
        </div>

        <div 
          onDragOver={handleDragOver} 
          onDrop={(e) => handleDrop(e, 'completed')}
          style={{ flex: 1, backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#059669', fontWeight: '600' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ backgroundColor: '#059669', width: '10px', height: '10px', borderRadius: '50%' }}></span></div> 
            <span>Completed</span>
            <span style={{ backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', color: '#065F46' }}>{tasks.completed.length}</span>
          </div>
          {tasks.completed.map(task => <KanbanCard key={task.id} task={task} columnId="completed" />)}
        </div>

      </div>

      {/* --- NEW: Pop-up Modal UI --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px', color: '#111827' }}>Create New Obligation</h2>
            
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Task Title</label>
                <input 
                  type="text" 
                  required 
                  value={newTask.title} 
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Due Date</label>
                <input 
                  type="date" 
                  required 
                  value={newTask.due_date} 
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Risk Level</label>
                <select 
                  value={newTask.risk_level} 
                  onChange={(e) => setNewTask({...newTask, risk_level: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #D1D5DB', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', backgroundColor: '#8B5CF6', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Obligations;