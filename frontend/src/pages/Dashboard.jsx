import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  
  const getWelcomeMessage = () => {
    const messages = {
      admin: ` Добро пожаловать, ${user.full_name}! У вас полный доступ ко всем функциям.`,
      manager: ` Добро пожаловать, ${user.full_name}! Вы можете управлять перевозками.`,
//       client: ` Добро пожаловать! Вы можете просматривать свои перевозки.`,
      driver: ` Добро пожаловать, ${user.full_name}! Здесь ваши назначенные рейсы.`
    };
    return messages[user?.role];
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