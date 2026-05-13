import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  
  const getWelcomeMessage = () => {
    const messages = {
      admin: ' Добро пожаловать, Администратор! У вас полный доступ ко всем функциям.',
      manager: ' Добро пожаловать, Менеджер! Вы можете управлять перевозками и отчётами.',
      client: ' Добро пожаловать! Вы можете просматривать свои перевозки.',
      driver: ' Добро пожаловать, Водитель! Здесь ваши назначенные рейсы.'
    };
    return messages[user?.role] || ' Добро пожаловать!';
  };

  return (
    <div className="container py-5">
      <div className="card shadow-sm">
        <div className="card-body text-center py-5">
          <p className="lead text-muted mb-4">{getWelcomeMessage()}</p>
          

        </div>
      </div>
    </div>
  );
}