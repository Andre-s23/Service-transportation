import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function TransportList() {
  const [transports, setTransports] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null); // 🔥 ID раскрытой строки
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const canEdit = ['admin', 'manager'].includes(user?.role);

  const fetchTransports = async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const res = await api.get('/transports/', { params });
      setTransports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setTransports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransports(); }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить перевозку?')) return;
    try {
      await api.delete(`/transports/${id}`);
      fetchTransports();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.detail || 'Не удалось удалить'));
    }
  };

  // 🔥 Переключение раскрытия строки
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="container py-4">
      {/* Шапка */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Перевозки</h3>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => navigate('/transports/new')}>
            + Создать рейс
          </button>
        )}
      </div>

      {/* Поиск */}
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Поиск по госномеру авто..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Таблица */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th></th> {/* 🔥 Колонка для кнопки раскрытия */}
                <th>Дата начала</th>
                <th>Дата завершения</th>
                <th>Завод</th>
                <th>Авто</th>
                <th>Водитель</th>
                <th>Груз (шт)</th>
                <th>Сумма</th>
                {canEdit && <th className="text-end pe-4">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center py-5">Загрузка...</td></tr>
              ) : transports.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-5 text-muted">
                  {user?.role === 'driver' ? 'У вас нет назначенных рейсов' : 'Нет данных'}
                </td></tr>
              ) : (
                transports.map(t => {
                  const isExpanded = expandedId === t.id;
                  const details = t.details || [];
                  const deliveryCost = details.reduce((sum, d) => sum + (d.quantity * d.shipping_cost), 0);
                  const goodsValue = details.reduce((sum, d) => sum + (d.quantity * d.base_price), 0);

                  return (
                    <Fragment key={t.id}>
                      {/* 🔹 Основная строка */}
                      <tr className={isExpanded ? 'table-primary' : ''}>
                        <td>
                          <button
                            className="btn btn-sm btn-link p-0"
                            onClick={() => toggleExpand(t.id)}
                            title={isExpanded ? 'Свернуть' : 'Подробнее'}
                          >
                            {isExpanded ? '▲' : '▶'}
                          </button>
                        </td>
                        <td>{t.assign_date}</td>
                        <td>{t.completion_date}</td>
                        <td>{t.plant_name}</td>
                        <td>{t.vehicle_plate}</td>
                        <td>{t.driver_name}</td>
                        <td>{t.total_items}</td>
                        <td className="text-success fw-bold">{t.total_cost?.toLocaleString()} ₽</td>
                        {canEdit && (
                          <td className="text-end pe-4">
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => navigate(`/transports/${t.id}/edit`)}>✏️</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t.id)}>🗑️</button>
                          </td>
                        )}
                      </tr>

                      {/* 🔹 Раскрытая подробная информация */}
                      {isExpanded && (
  <tr>
    <td colSpan="9" className="bg-light p-3">
      <h6 className="fw-bold mb-2">Состав груза</h6>
      <div className="table-responsive">
        <table className="table table-sm table-bordered mb-0 bg-white">
          <thead className="table-light">
            <tr>
              <th>Деталь</th>
              <th>Склад</th>
              <th>Кол-во</th>
              <th>Цена за ед.</th>
              <th>Доставка</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d, idx) => (
              <tr key={idx}>
                <td>{d.detail_name || `ID: ${d.detail_id}`}</td>
                <td><small className="text-muted">{d.warehouse_name || '—'}</small></td>
                <td>{d.quantity} шт.</td>
                <td>{d.base_price?.toLocaleString() || '0'} ₽</td>
                <td>{d.shipping_cost?.toLocaleString() || '0'} ₽</td>
                <td className="fw-bold">{(d.quantity * d.shipping_cost).toLocaleString()} ₽</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="table-light">
            <tr>
              <td colSpan="5" className="text-end fw-bold">Итого:</td>
              <td className="fw-bold text-success">{deliveryCost.toLocaleString()} ₽</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </td>
  </tr>
)}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}