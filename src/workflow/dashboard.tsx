import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useWorkflow } from './ui';
import { type Account } from '../auth';
import { aggregateReports, productReports, todayKey } from '../reports/analytics';
import '../styles/friendly-dashboard.css';

const formatMoney = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(n);

const formatShortDate = (isoDate: string) => {
  const parts = isoDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return isoDate;
};

const formatDateVN = (isoDate: string) => {
  const parts = isoDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return isoDate;
};

type RangePreset = '7' | '30' | 'today';

export function WorkflowDashboard({ user }: { user: Account }) {
  const s = useWorkflow();
  const [preset, setPreset] = useState<RangePreset>('7');
  const [activeLinePoint, setActiveLinePoint] = useState<number | null>(null);
  const [activeColumnBar, setActiveColumnBar] = useState<number | null>(null);

  const today = useMemo(() => todayKey(), []);

  const { fromDate, toDate, rangeLabel } = useMemo(() => {
    const to = today;
    const toObj = new Date(`${to}T12:00:00Z`);
    let fromObj = new Date(toObj);

    if (preset === '7') {
      fromObj.setUTCDate(fromObj.getUTCDate() - 6);
      return {
        fromDate: fromObj.toISOString().slice(0, 10),
        toDate: to,
        rangeLabel: '7 ngày qua'
      };
    } else if (preset === '30') {
      fromObj.setUTCDate(fromObj.getUTCDate() - 29);
      return {
        fromDate: fromObj.toISOString().slice(0, 10),
        toDate: to,
        rangeLabel: '30 ngày qua'
      };
    } else {
      return {
        fromDate: to,
        toDate: to,
        rangeLabel: 'Hôm nay'
      };
    }
  }, [preset, today]);

  // Aggregate metrics from shared orders
  const report = useMemo(() => {
    return aggregateReports(s.orders, fromDate, toDate);
  }, [s.orders, fromDate, toDate]);

  // Top selling products in this period
  const topProducts = useMemo(() => {
    return productReports(s.orders, fromDate, toDate).slice(0, 5);
  }, [s.orders, fromDate, toDate]);

  // Order status breakdown in this period
  const statusCounts = useMemo(() => {
    const ordersInPeriod = s.orders.filter(o => {
      const d = o.createdAt?.slice(0, 10) || o.date;
      return d && d >= fromDate && d <= toDate;
    });
    const completed = ordersInPeriod.filter(o => o.status === 'Hoàn tất').length;
    const processing = ordersInPeriod.filter(o =>
      ['Đang xử lý', 'Đang giao'].includes(o.status)
    ).length;
    const pending = ordersInPeriod.filter(o => o.status === 'Chờ xác nhận').length;
    const cancelled = ordersInPeriod.filter(o => o.status === 'Đã hủy').length;
    return {
      total: ordersInPeriod.length,
      completed,
      processing,
      pending,
      cancelled
    };
  }, [s.orders, fromDate, toDate]);

  // Average Order Value (AOV)
  const aov = report.periodOrders > 0
    ? Math.round(report.periodSales / report.periodOrders)
    : 0;

  // Completion rate
  const completionRate = report.periodOrders > 0
    ? Math.round((report.periodCompleted / report.periodOrders) * 100)
    : 0;

  // Pending actions
  const pendingRequests = s.requests.filter(r => r.status === 'PENDING').length;
  const pendingOrders = s.orders.filter(o => o.status === 'Chờ xác nhận').length;

  // SVG Chart Dimensions
  const chartW = 560;
  const chartH = 200;
  const padX = 35;
  const padY = 25;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padY * 2;

  // Max values for scaling
  const maxSales = useMemo(() => {
    const max = Math.max(...report.days.map(d => d.orderSales), 0);
    return max > 0 ? max : 100000;
  }, [report.days]);

  const maxOrders = useMemo(() => {
    const max = Math.max(...report.days.map(d => d.orders), 0);
    return max > 0 ? max : 5;
  }, [report.days]);

  // Coordinates for Line Chart (Doanh số)
  const linePoints = useMemo(() => {
    const n = report.days.length;
    if (n === 0) return [];
    return report.days.map((d, i) => {
      const x = n === 1 ? chartW / 2 : padX + (i / (n - 1)) * innerW;
      const y = chartH - padY - (d.orderSales / maxSales) * innerH;
      return { x, y, day: d };
    });
  }, [report.days, maxSales, innerW, innerH]);

  // SVG Path string for Line Chart
  const linePathD = useMemo(() => {
    if (linePoints.length === 0) return '';
    if (linePoints.length === 1) {
      return `M ${linePoints[0].x - 20} ${linePoints[0].y} L ${linePoints[0].x + 20} ${linePoints[0].y}`;
    }
    // Generate smooth line
    return linePoints.reduce((acc, curr, i, arr) => {
      if (i === 0) return `M ${curr.x} ${curr.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + curr.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }, '');
  }, [linePoints]);

  // Area path for gradient fill below the line
  const areaPathD = useMemo(() => {
    if (linePoints.length < 2) return '';
    const bottomY = chartH - padY;
    const first = linePoints[0];
    const last = linePoints[linePoints.length - 1];
    return `${linePathD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [linePathD, linePoints, chartH, padY]);

  // Bar width and spacing for Column Chart
  const columnBars = useMemo(() => {
    const n = report.days.length;
    if (n === 0) return [];
    const availableW = innerW;
    const totalSlot = availableW / n;
    const barW = Math.max(6, Math.min(26, totalSlot * 0.65));

    return report.days.map((d, i) => {
      const slotCenter = padX + (i + 0.5) * totalSlot;
      const barH = Math.max(4, (d.orders / maxOrders) * innerH);
      const x = slotCenter - barW / 2;
      const y = chartH - padY - barH;
      return {
        x,
        y,
        w: barW,
        h: barH,
        day: d
      };
    });
  }, [report.days, maxOrders, innerW, innerH, chartH, padX, padY]);

  return (
    <div className="friendly-dashboard">
      {/* 1. Header Toolbar with Preset Tabs */}
      <div className="dash-toolbar">
        <div className="dash-toolbar-left">
          <span className="dash-badge-live">Dữ liệu thời gian thực</span>
          <span className="dash-range-title">
            Khoảng thời gian: <b>{formatDateVN(fromDate)} — {formatDateVN(toDate)}</b> ({rangeLabel})
          </span>
        </div>

        <div className="dash-pills" role="tablist" aria-label="Chọn khoảng thời gian">
          <button
            type="button"
            className={`dash-pill-btn ${preset === '7' ? 'active' : ''}`}
            onClick={() => setPreset('7')}
          >
            7 ngày gần nhất
          </button>
          <button
            type="button"
            className={`dash-pill-btn ${preset === '30' ? 'active' : ''}`}
            onClick={() => setPreset('30')}
          >
            30 ngày qua
          </button>
          <button
            type="button"
            className={`dash-pill-btn ${preset === 'today' ? 'active' : ''}`}
            onClick={() => setPreset('today')}
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards */}
      <div className="dash-kpi-grid">
        {/* Card 1: Tổng số đơn hàng */}
        <div className="dash-kpi-card card-orders">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Tổng số đơn hàng</span>
            <div className="dash-kpi-icon">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="dash-kpi-value">{report.periodOrders.toLocaleString('vi-VN')}</div>
          <div className="dash-kpi-sub">
            <span>Hoàn tất: <b>{report.periodCompleted}</b></span>
            <span className="dash-kpi-badge">Đạt {completionRate}%</span>
          </div>
        </div>

        {/* Card 2: Doanh số bán hàng */}
        <div className="dash-kpi-card card-sales">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Doanh số bán hàng</span>
            <div className="dash-kpi-icon">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="dash-kpi-value">{formatMoney(report.periodSales)}</div>
          <div className="dash-kpi-sub">
            <span>Đã thanh toán: <b>{formatMoney(report.periodRevenue)}</b></span>
          </div>
        </div>

        {/* Card 3: Giá trị TB mỗi đơn (AOV) */}
        <div className="dash-kpi-card card-aov">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Giá trị TB / Đơn (AOV)</span>
            <div className="dash-kpi-icon">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="dash-kpi-value">{formatMoney(aov)}</div>
          <div className="dash-kpi-sub">
            <span>Tính trên <b>{report.periodOrders}</b> đơn phát sinh</span>
          </div>
        </div>

        {/* Card 4: Tác vụ & Đề xuất chờ xử lý */}
        <div className="dash-kpi-card card-tasks">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Tác vụ cần xử lý</span>
            <div className="dash-kpi-icon">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="dash-kpi-value">{pendingRequests + pendingOrders}</div>
          <div className="dash-kpi-sub">
            <span><b>{pendingOrders}</b> đơn mới · <b>{pendingRequests}</b> đề xuất duyệt</span>
          </div>
        </div>
      </div>

      {/* 3. Charts Grid: Line Chart & Column Chart */}
      <div className="dash-charts-grid">
        {/* Line Chart: Xu hướng Doanh số Bán hàng */}
        <div className="dash-chart-card">
          <div className="dash-chart-head">
            <div>
              <h3>Xu hướng Doanh số Bán hàng (Line Chart)</h3>
              <p className="dash-chart-subtitle">
                Giá trị đặt hàng theo từng ngày ({rangeLabel})
              </p>
            </div>
            <div className="dash-chart-legend">
              <span className="legend-item">
                <span className="legend-dot teal" />
                Doanh số (VNĐ)
              </span>
            </div>
          </div>

          <div className="dash-svg-wrap">
            <svg
              className="dash-svg"
              viewBox={`0 0 ${chartW} ${chartH}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartH - padY - ratio * innerH;
                const val = Math.round(maxSales * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={chartW - padX}
                      y2={y}
                      className="chart-grid-line"
                    />
                    <text
                      x={padX - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="chart-axis-label"
                    >
                      {ratio === 0 ? '0' : val >= 1000000 ? `${(val / 1000000).toFixed(1)}Tr` : `${Math.round(val / 1000)}k`}
                    </text>
                  </g>
                );
              })}

              {/* Area fill under curve */}
              {areaPathD && <path d={areaPathD} className="line-area-main" />}

              {/* Main Line path */}
              {linePathD && <path d={linePathD} className="line-path-main" />}

              {/* Data points */}
              {linePoints.map((pt, idx) => (
                <circle
                  key={pt.day.date}
                  cx={pt.x}
                  cy={pt.y}
                  r={activeLinePoint === idx ? 6 : 4}
                  className={`line-data-point ${activeLinePoint === idx ? 'active' : ''}`}
                  onMouseEnter={() => setActiveLinePoint(idx)}
                  onMouseLeave={() => setActiveLinePoint(null)}
                  onClick={() => setActiveLinePoint(idx === activeLinePoint ? null : idx)}
                />
              ))}

              {/* X Axis Labels */}
              {linePoints.map((pt, idx) => {
                // If 30 days, skip some labels for clarity
                const showLabel =
                  report.days.length <= 10 ||
                  idx === 0 ||
                  idx === report.days.length - 1 ||
                  idx % Math.ceil(report.days.length / 7) === 0;

                if (!showLabel) return null;
                return (
                  <text
                    key={pt.day.date}
                    x={pt.x}
                    y={chartH - 8}
                    textAnchor="middle"
                    className="chart-axis-label"
                  >
                    {formatShortDate(pt.day.date)}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip for Line Chart */}
            {activeLinePoint !== null && linePoints[activeLinePoint] && (
              <div className="dash-chart-tooltip">
                <small>{formatDateVN(linePoints[activeLinePoint].day.date)}</small>
                <b>Doanh số: {formatMoney(linePoints[activeLinePoint].day.orderSales)}</b>
                <span>Đơn hàng: {linePoints[activeLinePoint].day.orders} đơn</span>
              </div>
            )}
          </div>
        </div>

        {/* Column Chart: Số lượng Đơn hàng Theo Ngày */}
        <div className="dash-chart-card">
          <div className="dash-chart-head">
            <div>
              <h3>Số lượng Đơn hàng theo ngày (Column Chart)</h3>
              <p className="dash-chart-subtitle">
                Phân bố số lượng đơn phát sinh ({rangeLabel})
              </p>
            </div>
            <div className="dash-chart-legend">
              <span className="legend-item">
                <span className="legend-dot blue" />
                Số đơn đặt
              </span>
            </div>
          </div>

          <div className="dash-svg-wrap">
            <svg
              className="dash-svg"
              viewBox={`0 0 ${chartW} ${chartH}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.75" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              {[0, 0.5, 1].map((ratio) => {
                const y = chartH - padY - ratio * innerH;
                const val = Math.round(maxOrders * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={chartW - padX}
                      y2={y}
                      className="chart-grid-line"
                    />
                    <text
                      x={padX - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="chart-axis-label"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Column Bars */}
              {columnBars.map((bar, idx) => (
                <rect
                  key={bar.day.date}
                  x={bar.x}
                  y={bar.y}
                  width={bar.w}
                  height={bar.h}
                  rx={4}
                  ry={4}
                  fill="url(#blueGradient)"
                  className={`column-bar ${activeColumnBar === idx ? 'active' : ''}`}
                  onMouseEnter={() => setActiveColumnBar(idx)}
                  onMouseLeave={() => setActiveColumnBar(null)}
                  onClick={() => setActiveColumnBar(idx === activeColumnBar ? null : idx)}
                />
              ))}

              {/* X Axis Labels */}
              {columnBars.map((bar, idx) => {
                const showLabel =
                  report.days.length <= 10 ||
                  idx === 0 ||
                  idx === report.days.length - 1 ||
                  idx % Math.ceil(report.days.length / 7) === 0;

                if (!showLabel) return null;
                return (
                  <text
                    key={bar.day.date}
                    x={bar.x + bar.w / 2}
                    y={chartH - 8}
                    textAnchor="middle"
                    className="chart-axis-label"
                  >
                    {formatShortDate(bar.day.date)}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip for Column Chart */}
            {activeColumnBar !== null && columnBars[activeColumnBar] && (
              <div className="dash-chart-tooltip">
                <small>{formatDateVN(columnBars[activeColumnBar].day.date)}</small>
                <b>Số đơn tạo: {columnBars[activeColumnBar].day.orders} đơn</b>
                <span>Hoàn tất: {columnBars[activeColumnBar].day.completed} đơn</span>
                <span>Doanh số: {formatMoney(columnBars[activeColumnBar].day.orderSales)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Top Selling Products & Status Breakdown */}
      <div className="dash-bottom-grid">
        {/* Top 5 Products */}
        <div className="dash-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Top 5 Sản phẩm Bán chạy trong kỳ</h3>
            <Link to="/admin/workflow/product-performance" style={{ fontSize: '0.8125rem', color: '#0d9488', textDecoration: 'none', fontWeight: 600 }}>
              Xem tất cả →
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem', padding: '16px 0' }}>
              Chưa có giao dịch bán hàng nào trong khoảng thời gian này.
            </p>
          ) : (
            <div className="dash-top-products-list">
              {topProducts.map((p, idx) => (
                <div className="dash-product-item" key={p.productId}>
                  <div className="dash-product-item-info">
                    <span className="dash-product-item-name">
                      #{idx + 1}. {p.name}
                    </span>
                    <span className="dash-product-item-cat">
                      {p.category} · {p.orders} lượt mua
                    </span>
                  </div>
                  <div className="dash-product-item-sales">
                    <span className="dash-product-item-qty">{p.qty} {p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="dash-panel">
          <h3>Phân bổ Trạng thái Đơn hàng</h3>
          <div className="dash-status-list">
            <div className="dash-status-item">
              <div className="dash-status-meta">
                <span>Hoàn tất (Đã giao)</span>
                <b>{statusCounts.completed} đơn</b>
              </div>
              <div className="dash-status-bar-bg">
                <div
                  className="dash-status-bar-fill fill-completed"
                  style={{
                    width: `${statusCounts.total > 0 ? (statusCounts.completed / statusCounts.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="dash-status-item">
              <div className="dash-status-meta">
                <span>Đang xử lý / Đang giao</span>
                <b>{statusCounts.processing} đơn</b>
              </div>
              <div className="dash-status-bar-bg">
                <div
                  className="dash-status-bar-fill fill-processing"
                  style={{
                    width: `${statusCounts.total > 0 ? (statusCounts.processing / statusCounts.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="dash-status-item">
              <div className="dash-status-meta">
                <span>Chờ xác nhận</span>
                <b>{statusCounts.pending} đơn</b>
              </div>
              <div className="dash-status-bar-bg">
                <div
                  className="dash-status-bar-fill fill-pending"
                  style={{
                    width: `${statusCounts.total > 0 ? (statusCounts.pending / statusCounts.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="dash-status-item">
              <div className="dash-status-meta">
                <span>Đã hủy</span>
                <b>{statusCounts.cancelled} đơn</b>
              </div>
              <div className="dash-status-bar-bg">
                <div
                  className="dash-status-bar-fill fill-cancelled"
                  style={{
                    width: `${statusCounts.total > 0 ? (statusCounts.cancelled / statusCounts.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

