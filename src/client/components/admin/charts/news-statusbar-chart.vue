<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { Newspaper } from 'lucide-vue-next';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

@Options({
  components: {
    Newspaper,
  },
})
export default class NewsStatusBarChart extends Vue {
  @Prop({ type: Number, default: 0 })
  publishedCount!: number;

  @Prop({ type: Number, default: 0 })
  draftCount!: number;

  chartInstance: echarts.ECharts | null = null;

  get isDarkMode() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }

  mounted() {
    this.initChart();
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

  @Watch('publishedCount')
  @Watch('draftCount')
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
        trigger: 'axis',
        confine: true,
        axisPointer: {
          type: 'shadow',
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
        data: ['Published', 'Draft'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 11,
          color: this.isDarkMode ? '#999' : '#666',
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
          name: 'News Count',
          type: 'bar',
          barWidth: '50%',
          data: [
            { value: this.publishedCount, itemStyle: { color: '#67c23a' } },
            { value: this.draftCount, itemStyle: { color: '#909399' } },
          ],
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
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
        <Newspaper class="chart-icon" :size="16" />
        <span>News Status</span>
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
  transition:  box-shadow 0.3s ease;
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
