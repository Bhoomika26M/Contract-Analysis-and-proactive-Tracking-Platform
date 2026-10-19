import React, { useEffect, useState } from 'react';
import { getObligations, updateObligationStatus } from '../services/obligationsApi';
import { cardStyle, getStatusBadgeStyle } from '../../../uiStyles';

const KanbanBoard = ({ contractId, refreshKey}) => {
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractId) return;
    const fetchTasks = async () => {
      try {
        const data = await getObligations(contractId);
        setObligations(data);
      } catch (err) {
        console.error("Failed to fetch obligations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [contractId, refreshKey]);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("obligationId", id);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("obligationId");
    if (!id) return;

    // Optimistically update UI
    setObligations(prev => prev.map(ob => 
      ob.id === parseInt(id) ? { ...ob, status: newStatus } : ob
    ));

    // Send update to FastAPI
    try {
      await updateObligationStatus(id, newStatus);
    } catch (err) {
      console.error("Failed to update status on server", err);
      // Revert on failure (in a full production app, you'd fetch tasks again here)
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Required to allow dropping
  };

  const renderColumn = (title, statusCategory) => {
    const columnTasks = obligations.filter(ob => (ob.status || 'Pending') === statusCategory);
    
    return (
      <div 
        onDrop={(e) => handleDrop(e, statusCategory)} 
        onDragOver={handleDragOver}
        style={{ flex: 1, backgroundColor: '#f5f8fa', padding: '15px', borderRadius: '8px', minHeight: '300px' }}
      >
        <h3 style={{ marginTop: 0, borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>{title}</h3>
        {columnTasks.map(task => (
          <div 
            key={task.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            style={{ ...cardStyle, padding: '15px', marginBottom: '10px', cursor: 'grab' }}
          >
            <strong style={{ display: 'block', marginBottom: '8px' }}>{task.description}</strong>
            <span style={getStatusBadgeStyle(task.status || 'Pending')}>{task.status || 'Pending'}</span>
            <span style={{ fontSize: '12px', color: '#666' }}>Due: {task.due_date}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <p>Loading board...</p>;

  return (
    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
      {renderColumn("Pending", "Pending")}
      {renderColumn("In Progress", "In Progress")}
      {renderColumn("Completed", "Completed")}
    </div>
  );
};

export default KanbanBoard;