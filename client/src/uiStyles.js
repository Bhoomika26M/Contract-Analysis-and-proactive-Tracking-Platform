export const cardStyle = {
  backgroundColor: '#ffffff',
  boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
  borderRadius: '8px'
};

export const tableHeaderCellStyle = {
  padding: '12px',
  borderBottom: '2px solid #dee2e6',
  color: '#6c757d',
  textTransform: 'uppercase',
  fontSize: '12px',
  fontWeight: 600,
  textAlign: 'left'
};

export const getStatusBadgeStyle = (status) => {
  const normalizedStatus = (status || '').toLowerCase();
  let colors = { backgroundColor: '#e9ecef', color: '#495057' };

  if (['active', 'approved', 'completed'].includes(normalizedStatus)) {
    colors = { backgroundColor: '#d4edda', color: '#155724' };
  } else if (['pending', 'expiring', 'in progress'].includes(normalizedStatus)) {
    colors = { backgroundColor: '#fff3cd', color: '#856404' };
  } else if (['expired', 'rejected', 'overdue', 'high risk'].includes(normalizedStatus)) {
    colors = { backgroundColor: '#f8d7da', color: '#721c24' };
  }

  return {
    padding: '5px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    ...colors
  };
};

export const primaryButtonStyle = {
  backgroundColor: '#4b2bf2',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

export const secondaryButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#6c757d',
  border: '1px solid #dee2e6',
  borderRadius: '6px',
  cursor: 'pointer'
};
