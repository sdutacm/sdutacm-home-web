<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { TrendingUp } from 'lucide-vue-next';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { effectiveTheme } from '@client/utils/theme';

@Options({
  components: {
    TrendingUp,
  },
})
export default class VisitTrendChart extends Vue {
  @Prop({ type: Array, default: () => [] })
  viewData!: { date: string; viewCount: number }[];

  chartInstance: echarts.ECharts | null = null;

  get isDarkMode() {
    return effectiveTheme.value === 'dark';
  }

  get chartStats() {
    const views = this.viewData.map((item) => item.viewCount);
    if (views.length === 0) return { max: 0, min: 0, avg: 0, total: 0 };
    const max = Math.max(...views);
    const min = Math.min(...views);
    const total = views.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / views.length);
    return { max, min, avg, total };
  }

  themeWatcher: (() => void) | null = null;

  mounted() {
    this.initChart();
    window.addEventListener('resize', this.handleResize);
    // 监听主题变化
    this.themeWatcher = this.$watch(
      () => effectiveTheme.value,
      () => this.initChart(),
    );
  }

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.themeWatcher) {
      this.themeWatcher();
    }
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  }

  handleResize() {
    if (this.chartInstance) {
      this.chartInstance.resize();
    }
  }

  @Watch('viewData', { deep: true })
  onDataChange() {
    this.initChart();
  }

  initChart() {
    const chartDom = this.$refs.chartRef as HTMLElement;
    if (!chartDom) return;

    if (this.chartInstance) {
      this.chartInstance.dispose();
    }

    this.chartInstance = echarts.init(chartDom, this.isDarkMode ? 'dark' : undefined);

    const dates = this.viewData.map((item) => item.date);
    const views = this.viewData.map((item) => item.viewCount);
    const { avg } = this.chartStats;

    const option: EChartsOption = {
      backgroundColor: this.isDarkMode ? '#282828' : '#fff',
      tooltip: {
        show: true,
        trigger: 'axis',
        confine: true,
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
      },
      grid: {
        left: 12,
        right: 24,
        bottom: 12,
        top: 24,
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
          color: this.isDarkMode ? '#999' : '#666',
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
          interval: 'auto',
          rotate: 0,
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
            color: this.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          },
        },
        axisLabel: {
          fontSize: 11,
          color: this.isDarkMode ? '#999' : '#666',
        },
      },
      series: [
        {
          name: '访问量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          emphasis: {
            focus: 'series',
            scale: true,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(64, 158, 255, 0.5)',
            },
          },
          data: views,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.25)' },
              { offset: 0.5, color: 'rgba(64, 158, 255, 0.1)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.02)' },
            ]),
          },
          lineStyle: {
            color: '#409eff',
            width: 2.5,
          },
          itemStyle: {
            color: '#409eff',
            borderColor: '#fff',
            borderWidth: 2,
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: '#e6a23c',
              type: 'dashed',
              width: 1,
              opacity: 0.6,
            },
            label: {
              show: true,
              position: 'end',
              fontSize: 10,
              color: '#e6a23c',
              formatter: `Ave.: ${avg}`,
            },
            data: [
              {
                yAxis: avg,
              },
            ],
          },
        },
      ],
    };

    this.chartInstance.setOption(option);
  }
}
</script>

<template>
  <div class="chart-section">
    <div class="chart-header">
      <div class="chart-title">
        <TrendingUp class="chart-icon" :size="16" />
        <span>Visit Trend</span>
        <span class="chart-subtitle">Last 30 Days</span>
      </div>
      <div class="chart-stats">
        <div class="chart-stat-item">
          <span class="chart-stat-label">Total</span>
          <span class="chart-stat-value">{{ chartStats.total.toLocaleString() }}</span>
        </div>
        <div class="chart-stat-item">
          <span class="chart-stat-label">Average</span>
          <span class="chart-stat-value">{{ chartStats.avg.toLocaleString() }}</span>
        </div>
        <div class="chart-stat-item">
          <span class="chart-stat-label">Highest</span>
          <span class="chart-stat-value highlight">{{ chartStats.max.toLocaleString() }}</span>
        </div>
        <div class="chart-stat-item">
          <span class="chart-stat-label">Lowest</span>
          <span class="chart-stat-value secondary">{{ chartStats.min.toLocaleString() }}</span>
        </div>
      </div>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<style lang="less" scoped>
.chart-section {
  background: var(--ah-c-background-header);
  border-radius: 12px;
  padding: 20px 24px 16px;
  transition: box-shadow 0.3s ease;
  user-select: none;

  &:hover {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .chart-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    .chart-icon {
      color: var(--el-color-primary);
    }

    .chart-subtitle {
      font-size: 12px;
      font-weight: 400;
      color: var(--el-text-color-secondary);
      margin-left: 4px;
    }
  }

  .chart-stats {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .chart-stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;

    .chart-stat-label {
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }

    .chart-stat-value {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      font-variant-numeric: tabular-nums;

      &.highlight {
        color: var(--el-color-success);
      }

      &.secondary {
        color: var(--el-text-color-secondary);
      }
    }
  }

  .chart-container {
    width: 100%;
    height: 260px;
  }
}
</style>
