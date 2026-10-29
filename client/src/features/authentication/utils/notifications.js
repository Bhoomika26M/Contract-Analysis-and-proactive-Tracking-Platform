const parseDateOnly = (value) => {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isPastDue = (dueDate, today) => {
  const date = parseDateOnly(dueDate);
  return Boolean(date && date < today);
};

const isDueSoon = (dueDate, today, deadline) => {
  const date = parseDateOnly(dueDate);
  return Boolean(date && date >= today && date <= deadline);
};

export const createNotifications = (
  contracts,
  obligations,
  userRole,
  userDepartment,
  userId
) => {
  const notifications = [];
  const visibleContracts = userRole === 'Administrator' || userRole === 'Legal Manager'
    ? contracts
    : userRole === 'Department Head' && userDepartment
      ? contracts.filter((contract) => contract.department === userDepartment)
      : [];

  visibleContracts.forEach((contract) => {
    if ((contract.status || '').toLowerCase() === 'expired') {
      notifications.push({
        id: `contract-expired-${contract.id}`,
        type: 'warning',
        title: 'Expired contract',
        message: `${contract.title || `Contract #${contract.id}`} has expired.`
      });
    }

    if ((contract.approval_status || '').toLowerCase() === 'pending') {
      notifications.push({
        id: `contract-pending-${contract.id}`,
        type: 'info',
        title: 'Contract pending approval',
        message: `${contract.title || `Contract #${contract.id}`} is awaiting approval.`
      });
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 7);
  const assignedObligations = userRole === 'Employee' && userId
    ? obligations.filter((obligation) => String(obligation.assignee_id) === String(userId))
    : [];

  assignedObligations.forEach((obligation) => {
    const status = (obligation.status || '').toLowerCase();
    if (status === 'completed') return;

    const overdue = status === 'overdue' || isPastDue(obligation.due_date, today);
    const dueSoon = isDueSoon(obligation.due_date, today, deadline);
    if (!overdue && !dueSoon) return;

    notifications.push({
      id: `obligation-${overdue ? 'overdue' : 'due-soon'}-${obligation.id}`,
      type: overdue ? 'warning' : 'info',
      title: overdue ? 'Overdue obligation' : 'Obligation due soon',
      message: `${obligation.description || `Obligation #${obligation.id}`} is ${overdue ? 'overdue' : 'due within 7 days'}.`
    });
  });

  return notifications;
};
