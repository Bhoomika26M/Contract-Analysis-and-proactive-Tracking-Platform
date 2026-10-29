import React, { useCallback, useEffect, useState } from 'react';
import ObligationForm from '../features/authentication/components/ObligationForm';
import {
  getAllObligations,
  updateObligationStatus
} from '../features/authentication/services/obligationsApi';
import { cardStyle, primaryButtonStyle } from '../uiStyles';

const isPastDue = (dueDate) => {
  if (!dueDate) return false;
  const [year, month, day] = dueDate.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return false;
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const getTaskStatus = (task) => {
  if ((task.status || '').toLowerCase() === 'completed') return 'Completed';
  if (isPastDue(task.due_date)) return 'Overdue';
  if ((task.status || '').toLowerCase() === 'in progress') return 'In Progress';
  return task.status || 'Pending';
};

const badgeColors = {
  Completed: { backgroundColor: '#d4edda', color: '#155724' },
  'In Progress': { backgroundColor: '#fff3cd', color: '#856404' },
  Overdue: { backgroundColor: '#f8d7da', color: '#721c24' }
};

const Obligations = () => {
  const userRole = localStorage.getItem('userRole');
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState(null);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      const obligationData = await getAllObligations();
      setObligations(obligationData);
      setError('');
    } catch (err) {
      console.error('Failed to load obligations', err);
      setError('Failed to load obligations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleMarkComplete = async (obligationId) => {
    setWorkingId(obligationId);
    setError('');
    try {
      const updatedObligation = await updateObligationStatus(obligationId, 'Completed');
      setObligations((current) => current.map((obligation) => (
        obligation.id === updatedObligation.id ? updatedObligation : obligation
      )));
    } catch (err) {
      console.error('Failed to mark obligation as complete', err);
      setError('Failed to update task status. Please try again.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px',
        boxSizing: 'border-box',
        backgroundColor: '#f5f8fa'
      }}
    >
      <h1 style={{ margin: '0 0 24px', color: '#1e1e2d', fontWeight: 600 }}>
        Task Tracker
      </h1>

      {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}

      {userRole !== 'Employee' && (
        <ObligationForm onObligationAdded={loadPageData} />
      )}

      {loading ? (
        <p style={{ color: '#6c757d' }}>Loading tasks...</p>
      ) : obligations.length === 0 ? (
        <section style={{ ...cardStyle, padding: '24px', textAlign: 'center', color: '#6c757d' }}>
          No tasks found.
        </section>
      ) : (
        <section
          aria-label="Tasks"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}
        >
          {obligations.map((task) => {
            const displayStatus = getTaskStatus(task);
            return (
              <article
                key={task.id}
                style={{
                  ...cardStyle,
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(30, 30, 45, 0.08)'
                }}
              >
                <h2 style={{ margin: '0 0 12px', color: '#1e1e2d', fontSize: '17px', fontWeight: 600 }}>
                  {task.description}
                </h2>
                <p style={{ margin: '0 0 8px', color: '#6c757d' }}>
                  Responsible Person: {task.assignee_id ? `User #${task.assignee_id}` : 'Unassigned'}
                </p>
                <p style={{ margin: '0 0 14px', color: '#6c757d' }}>
                  Due Date: {task.due_date || 'Not set'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '5px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: badgeColors[displayStatus]?.backgroundColor || '#e9ecef',
                      color: badgeColors[displayStatus]?.color || '#495057'
                    }}
                  >
                    {displayStatus}
                  </span>
                  {task.status !== 'Completed' && task.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleMarkComplete(task.id)}
                      disabled={workingId !== null}
                      style={{
                        ...primaryButtonStyle,
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: workingId === task.id ? 'wait' : 'pointer'
                      }}
                    >
                      {workingId === task.id ? 'Updating...' : 'Mark as Complete'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};

export default Obligations;