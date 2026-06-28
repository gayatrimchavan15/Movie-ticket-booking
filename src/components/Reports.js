import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to the proper admin reports page
    navigate('/admin/ReportsAnalytics');
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '1.2rem'
    }}>
      Redirecting to Reports & Analytics...
    </div>
  );
}