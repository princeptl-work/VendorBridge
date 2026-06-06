import React from 'react';
const Loader = ({ fullScreen }) => {
  if (fullScreen) return (
    <div className="loader-overlay">
      <div style={{ textAlign:'center' }}>
        <div className="spinner" />
        <div style={{ marginTop:12, color:'var(--text-muted)', fontSize:13 }}>Loading...</div>
      </div>
    </div>
  );
  return (
    <div className="page-loader">
      <div className="spinner" />
      <span style={{ color:'var(--text-muted)', fontSize:13 }}>Loading...</span>
    </div>
  );
};
export default Loader;
