<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { Head } from '@vueuse/head';
import { ElSkeleton } from 'element-plus';
import {
  Eye,
  TrendingUp,
  Newspaper,
  FileText,
  FolderKanban,
  Star,
  Image,
  HardDrive,
  Users,
  UserCheck,
} from 'lucide-vue-next';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

@View('/admin/overview')
@ChildOf('AdminView')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
    Head,
    ElSkeleton,
    Eye,
    TrendingUp,
    Newspaper,
    FileText,
    FolderKanban,
    Star,
    Image,
    HardDrive,
    Users,
    UserCheck,
  },
})
export default class OverviewView extends Vue {
  loading = true;
  chartInstance: echarts.ECharts | null = null;

  stats = {
    totalHomeViews: 0,
    todayHomeViews: 0,
    totalNewsCount: 0,
    publishedNewsCount: 0,
    draftNewsCount: 0,
    totalNewsViews: 0,
    totalProjectCount: 0,
    featuredProjectCount: 0,
    totalMediaCount: 0,
    activeMediaCount: 0,
    totalMediaSize: 0,
    totalAdminCount: 0,
    activeAdminCount: 0,
  };

  dailyViewData: { date: string; viewCount: number }[] = [];

  get formattedMediaSize() {
    const bytes = this.stats.totalMediaSize;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async mounted() {
    await this.loadStats();
    this.$nextTick(() => {
      this.initChart();
    });
    window.addEventListener('resize', this.handleResize);
  }

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  }

  handleResize() {
    if (this.chartInstance) {
      this.chartInstance.resize();
    }
  }

  async loadStats() {
    try {
      this.loading = true;
      const overviewRes = await this.$api.getOverviewStats();
      this.stats = overviewRes;

      const dailyRes = await this.$api.getDailyViewStats({
        pageKey: 'home',
        days: 30,
      });
      this.dailyViewData = dailyRes.rows;
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      this.loading = false;
    }
  }

  get isDarkMode() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }

  initChart() {
    const chartDom = this.$refs.chartRef as HTMLElement;
    if (!chartDom) return;

    // 根据主题选择 echarts 主题
    this.chartInstance = echarts.init(chartDom, this.isDarkMode ? 'dark' : undefined);

    const dates = this.dailyViewData.map((item) => item.date);
    const views = this.dailyViewData.map((item) => item.viewCount);

    const option: EChartsOption = {
      title: {
        text: '访问趋势',
        left: 0,
        textStyle: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `<div style="font-size: 12px;">${data.axisValue}<br/><span style="color: #409eff;">访问量: ${data.value}</span></div>`;
        },
      },
      grid: {
        left: 0,
        right: 0,
        bottom: 0,
        top: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 11,
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
        axisLabel: {
          fontSize: 11,
        },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: views,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
            ]),
          },
          lineStyle: {
            color: '#409eff',
            width: 2,
          },
        },
      ],
    };

    this.chartInstance.setOption(option);
  }
}
</script>

<template>
  <Head>
    <title>SDUTACM Admin | Overview</title>
    <meta name="description" content="SDUTACM 管理后台概览">
  </Head>
  <div class="overview-container">
    <div class="page-header">
      <h1>数据概览</h1>
      <p class="subtitle">查看网站各项数据统计</p>
    </div>

    <el-skeleton :loading="loading" animated :rows="6">
      <template #default>
        <div class="stats-grid">
          <!-- 访问统计 -->
          <div class="stats-section">
            <div class="section-title">访问统计</div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <Eye class="stat-icon" :size="16" />
                  <span>总访问量</span>
                </div>
                <div class="stat-value">{{ stats.totalHomeViews.toLocaleString() }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <TrendingUp class="stat-icon" :size="16" />
                  <span>今日访问</span>
                </div>
                <div class="stat-value highlight">{{ stats.todayHomeViews.toLocaleString() }}</div>
              </div>
            </div>
          </div>

          <!-- 新闻统计 -->
          <div class="stats-section">
            <div class="section-title">新闻统计</div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <Newspaper class="stat-icon" :size="16" />
                  <span>新闻总数</span>
                </div>
                <div class="stat-value">{{ stats.totalNewsCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <FileText class="stat-icon" :size="16" />
                  <span>已发布</span>
                </div>
                <div class="stat-value">{{ stats.publishedNewsCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <FileText class="stat-icon" :size="16" />
                  <span>草稿</span>
                </div>
                <div class="stat-value secondary">{{ stats.draftNewsCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <Eye class="stat-icon" :size="16" />
                  <span>总阅读量</span>
                </div>
                <div class="stat-value">{{ stats.totalNewsViews.toLocaleString() }}</div>
              </div>
            </div>
          </div>

          <!-- 项目统计 -->
          <div class="stats-section">
            <div class="section-title">项目统计</div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <FolderKanban class="stat-icon" :size="16" />
                  <span>项目总数</span>
                </div>
                <div class="stat-value">{{ stats.totalProjectCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <Star class="stat-icon" :size="16" />
                  <span>首页展示</span>
                </div>
                <div class="stat-value">{{ stats.featuredProjectCount }}</div>
              </div>
            </div>
          </div>

          <!-- 媒体统计 -->
          <div class="stats-section">
            <div class="section-title">媒体统计</div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <Image class="stat-icon" :size="16" />
                  <span>媒体总数</span>
                </div>
                <div class="stat-value">{{ stats.totalMediaCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <Image class="stat-icon" :size="16" />
                  <span>已启用</span>
                </div>
                <div class="stat-value">{{ stats.activeMediaCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <HardDrive class="stat-icon" :size="16" />
                  <span>存储占用</span>
                </div>
                <div class="stat-value">{{ formattedMediaSize }}</div>
              </div>
            </div>
          </div>

          <!-- 管理员统计 -->
          <div class="stats-section">
            <div class="section-title">管理员统计</div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <Users class="stat-icon" :size="16" />
                  <span>管理员总数</span>
                </div>
                <div class="stat-value">{{ stats.totalAdminCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <UserCheck class="stat-icon" :size="16" />
                  <span>活跃管理员</span>
                </div>
                <div class="stat-value">{{ stats.activeAdminCount }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 访问趋势图表 -->
        <div class="chart-section">
          <div ref="chartRef" class="chart-container"></div>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style lang="less" scoped>
.overview-container {
  padding: 0 24px 24px;
  max-width: 1200px;
}

.page-header {
  margin-bottom: 32px;

  h1 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  margin-bottom: 48px;
}

.stats-section {
  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
  }
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);

  .stat-icon {
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;

  &.highlight {
    color: var(--el-color-success);
  }

  &.secondary {
    color: var(--el-text-color-secondary);
  }
}

.chart-section {
  background: var(--el-fill-color-light);

  .chart-container {
    width: 100%;
    height: 280px;
  }
}
</style>
