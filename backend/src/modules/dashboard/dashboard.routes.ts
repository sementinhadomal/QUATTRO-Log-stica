import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as dashboardController from './dashboard.controller';

const router = Router();

router.use(requireAuth);

router.get('/home', dashboardController.getDashboardHomeCombined);
router.get('/indicadores', dashboardController.getIndicators);
router.get('/home-stats', dashboardController.getHomeStats);
router.get('/chart-7-days', dashboardController.getChart7Days);
router.get('/ranking-vendedores', dashboardController.getSellerRanking);
router.get('/full', dashboardController.getDashboardFull);
router.get('/mapa', dashboardController.getMapData);
router.get('/heatmap', dashboardController.getHeatmap);

export default router;
