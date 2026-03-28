import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database/connection.js';
import loansRouter from './routes/loans.js';
import fixedDebtsRouter from './routes/fixedDebts.js';
import dashboardRouter from './routes/dashboard.js';
import forecastRouter from './routes/forecast.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_PATH = process.env.STATIC_PATH || path.join(__dirname, '../../public');
// 初始化数据库
initDatabase();
// 中间件
app.use(cors());
app.use(express.json());
// API 路由
app.use('/api/loans', loansRouter);
app.use('/api/fixed-debts', fixedDebtsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/forecast', forecastRouter);
// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 静态文件服务（前端应用）
app.use(express.static(STATIC_PATH));
// 所有其他路由返回前端应用的 index.html（支持前端路由）
app.get('*', (req, res) => {
    res.sendFile(path.join(STATIC_PATH, 'index.html'));
});
// 错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Static files served from: ${STATIC_PATH}`);
});
//# sourceMappingURL=index.js.map