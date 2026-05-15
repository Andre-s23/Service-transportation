import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [lowStock, setLowStock] = useState([]);
  const [deliveryData, setDeliveryData] = useState([]);
  const [topPlants, setTopPlants] = useState([]);
  const [topDrivers, setTopDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tripsByMonth, setTripsByMonth] = useState([]);

  // Загрузка данных при изменении периода
  const fetchData = async () => {
    setLoading(true);
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    try {
      const [low, del, trips, plants, drivers] = await Promise.all([
        api.get('/reports/low-stock'),
        api.get('/reports/delivery-by-month', { params }),
        api.get('/reports/trips-by-month', { params }),  // 🔥 Новый запрос
        api.get('/reports/dashboard'),
        api.get('/reports/top-drivers', { params })
      ]);
      setLowStock(low.data);
      setDeliveryData(del.data);
      setTripsByMonth(trips.data);
      setTopPlants(plants.data);
      setTopDrivers(drivers.data);
    } catch (err) {
      console.error('Ошибка загрузки отчетов:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  // Подготовка данных для графика с чередованием цветов
  const chartData = tripsByMonth.map((item, idx) => ({
    ...item,
    fill: CHART_COLORS[idx % CHART_COLORS.length]
  }));

  if (loading) return <div className="text-center py-5">⏳ Формирование отчетов...</div>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">📊 Отчеты и аналитика</h2>



      <div className="row g-4">

        {/* ✅ 1. Детали с низким остатком (на основе таблицы) */}
        <div className="col-12">
          <div className="card shadow-sm border-danger">
            <div className="card-header bg-danger text-white">⚠️ Детали с остатком ниже минимума</div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead><tr><th>Название</th><th>На складе</th><th>Мин. остаток</th><th>Дефицит</th></tr></thead>
                <tbody>
                  {lowStock.length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted py-3">Данных нет</td></tr>
                  ) : lowStock.map(d => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td className="text-danger fw-bold">{d.current_stock}</td>
                      <td>{d.min_stock}</td>
                      <td>{d.min_stock - d.current_stock} шт.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>


 {/* 🔹 Фильтр по периоду */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Дата с</label>
              <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Дата по</label>
              <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="col-md-6 text-end">
              <button className="btn btn-outline-secondary" onClick={() => { setStartDate(''); setEndDate(''); }}>🔄 Сбросить период</button>
            </div>
          </div>
        </div>
      </div>

        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-success text-white">📊 Количество рейсов по месяцам</div>
            <div className="card-body">
              {tripsByMonth.length === 0 ? (
                <div className="alert alert-secondary text-center py-4 mb-0">Данных нет</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: 'Месяц', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Рейсов', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => `${value.toLocaleString()}`} />

                    <Bar dataKey="trip_count" name="Рейсы">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ✅ 3. Месяцы по стоимости доставки (убывание) */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white"> Месяцы по стоимости (убывание)</div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead><tr><th>Месяц</th><th className="text-end">Сумма доставки</th></tr></thead>
                <tbody>
                  {deliveryData.length === 0 ? (
                    <tr><td colSpan="2" className="text-center text-muted py-3">Данных нет</td></tr>
                  ) : deliveryData.map((d, i) => (
                    <tr key={i}>
                      <td>{d.month} мес.</td>
                      <td className="text-end fw-bold">{d.total_delivery_cost?.toLocaleString() || 0} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ✅ 4. Топ заводов (Dashboard) */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white">🏭 Топ-5 заводов по рейсам</div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead><tr><th>Завод</th><th className="text-end">Рейсов</th></tr></thead>
                <tbody>
                  {topPlants.length === 0 ? (
                    <tr><td colSpan="2" className="text-center text-muted py-3">Данных нет</td></tr>
                  ) : topPlants.map((p, i) => (
                    <tr key={i}><td>{p.name}</td><td className="text-end fw-bold">{p.trips}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ✅ 5. Водители по рейсам (убывание) */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">👨‍✈️ Водители по количеству рейсов</div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead><tr><th>Водитель</th><th className="text-end">Рейсов</th></tr></thead>
                <tbody>
                  {topDrivers.length === 0 ? (
                    <tr><td colSpan="2" className="text-center text-muted py-3">Данных нет</td></tr>
                  ) : topDrivers.map((d, i) => (
                    <tr key={i}><td>{d.full_name}</td><td className="text-end fw-bold">{d.trip_count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}