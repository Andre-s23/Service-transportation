import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await authLogin(login, password);

    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <section className="vh-100" style={{ background: '#f5f7fa' }}>
      <div className="container py-5 h-100">
        <div className="row d-flex align-items-center justify-content-center h-100">

          {/* Левая часть с картинкой */}
          <div className="col-md-8 col-lg-7 col-xl-6 d-none d-md-block">
            <img
              src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.svg"
              className="img-fluid"
              alt="Login illustration"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          {/* Правая часть с формой */}
          <div className="col-md-7 col-lg-5 col-xl-5 offset-xl-1">
            <form onSubmit={handleSubmit}>

              {/* Заголовок */}
              <h3 className="fw-bold mb-4 text-center">Система учета автоперевозок</h3>

              {/* Поле логина */}
              <div data-mdb-input-init className="form-outline mb-4">
                <input
                  type="text"
                  id="loginInput"
                  className={`form-control form-control-lg ${login ? 'active' : ''}`}
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  required
                  disabled={loading}
                />
                <label className="form-label" htmlFor="loginInput">Логин</label>
              </div>

              {/* Поле пароля */}
               <div data-mdb-input-init className="form-outline mb-4">
                <input
                  type="password"
                  id="passwordInput"
                  className={`form-control form-control-lg ${password ? 'active' : ''}`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <label className="form-label" htmlFor="passwordInput">Пароль</label>
              </div>

              {/* Сообщение об ошибке */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Кнопка входа */}
              <div className="d-grid gap-2 mb-4">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Вход...
                    </>
                  ) : 'Войти в систему'}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </section>
  );
}