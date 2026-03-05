<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { Users } from 'lucide-vue-next';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { effectiveTheme } from '@client/utils/theme';

@Options({
  components: {
    Users,
  },
})
export default class AdminActivityPieChart extends Vue {
  @Prop({ type: Number, default: 0 })
  totalCount!: number;

  @Prop({ type: Number, default: 0 })
  activeCount!: number;

  chartInstance: echarts.ECharts | null = null;

  get isDarkMode() {
    return effectiveTheme.value === 'dark';
  }

  get inactiveCount() {
    return this.totalCount - this.activeCount;
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

  @Watch('totalCount')
  @Watch('activeCount')
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

    const option: EChartsOption = {
      backgroundColor: this.isDarkMode ? '#282828' : '#fff',
      tooltip: {
        show: true,
        trigger: 'item',
        confine: true,
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          color: this.isDarkMode ? '#999' : '#666',
        },
      },
      series: [
        {
          name: 'Admin Status',
          type: 'pie',
          radius: '70%',
          center: ['35%', '50%'],
          data: [
            { value: this.activeCount, name: 'Active', itemStyle: { color: '#67c23a' } },
            { value: this.inactiveCount, name: 'Inactive', itemStyle: { color: '#909399' } },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            formatter: '{b}: {c}',
            color: this.isDarkMode ? '#999' : '#666',
          },
        },
      ],
    };

    this.chartInstance.setOption(option);
  }
}
</script>

<template>
  <div class="chart-section small-chart">
    <div class="chart-header">
      <div class="chart-title">
        <Users class="chart-icon" :size="16" />
        <span>Admin Activity</span>
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
  }

  .chart-container {
    width: 100%;
    height: 260px;
  }

  &.small-chart {
    .chart-container {
      height: 220px;
    }
  }
}
</style>
