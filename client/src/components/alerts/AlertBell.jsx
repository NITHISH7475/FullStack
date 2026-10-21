import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { alertAPI } from '../../services/api';

function AlertBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = async () => {
    try {
      const { data } = await alertAPI.getUnreadCount();
      setUnreadCount(data?.unreadCount ?? data?.count ?? 0);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      to="/alerts"
      title="Plant Alert Center"
      className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute 1 top-1 right-1 bg-rose-500 text-white text-[9px] font-mono font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center ring-2 ring-white shadow-xs">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default AlertBell;
