import React from 'react';
import { Check, X } from 'lucide-react';

const PendingApprovals = () => {
  const approvals = [
    { 
      id: 'CTR-2459', 
      name: 'AWS Cloud Services Agreement', 
      submittedBy: 'Daniel Park', 
      date: '2024-07-01', 
      risk: 'High', 
      riskColor: '#EF4444', 
      riskBg: '#FEE2E2' 
    },
    { 
      id: 'CTR-2420', 
      name: 'External Counsel Retainer', 
      submittedBy: 'Emma Walsh', 
      date: '2024-07-02', 
      risk: 'Medium', 
      riskColor: '#F59E0B', 
      riskBg: '#FEF3C7' 
    }
  ];

  return (
    <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flex: 2 }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>Pending Approvals</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {approvals.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
            
            {/* Contract Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>{item.id}</span>
                <span style={{ 
                  backgroundColor: item.riskBg, color: item.riskColor, padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 'bold' 
                }}>
                  {item.risk}
                </span>
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#111827' }}>{item.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Submitted by {item.submittedBy} • {item.date}</p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                <Check size={16} /> Approve
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                <X size={16} /> Reject
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingApprovals;