import React from 'react';
const STATUS = {
  active:'badge-success', inactive:'badge-secondary', blacklisted:'badge-danger', pending_verification:'badge-warning',
  draft:'badge-secondary', sent:'badge-info', closed:'badge-primary', cancelled:'badge-danger',
  submitted:'badge-info', under_review:'badge-warning', accepted:'badge-success', rejected:'badge-danger',
  pending:'badge-warning', approved:'badge-success',
  confirmed:'badge-success', partially_delivered:'badge-warning', delivered:'badge-primary',
  paid:'badge-success', overdue:'badge-danger',
  low:'badge-secondary', medium:'badge-info', high:'badge-warning', urgent:'badge-danger',
};
const Badge = ({ status, text }) => (
  <span className={`badge ${STATUS[status] || 'badge-secondary'}`}>
    {text || (status || '').replace(/_/g,' ')}
  </span>
);
export default Badge;
