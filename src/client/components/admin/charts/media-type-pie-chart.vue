<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { Image } from 'lucide-vue-next';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { effectiveTheme } from '@client/utils/theme';

@Options({
  components: {
    Image,
  },
})
export default class MediaTypePieChart extends Vue {
  @Prop({ type: Number, default: 0 })
  logoCount!: number;

  @Prop({ type: Number, default: 0 })
  imageCount!: number;

  @Prop({ type: Number, default: 0 })
  audioCount!: number;

  @Prop({ type: Number, default: 0 })
  videoCount!: number;

  chartInstance: echarts.ECharts | null = null;

  get isDarkMode() {
    return effectiveTheme.value === 'dark';
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

  @Watch('logoCount')
  @Watch('imageCount')
  @Watch('audioCount')
  @Watch('videoCount')
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
          name: 'Media Type',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: this.isDarkMode ? '#282828' : '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: this.logoCount, name: 'Logo', itemStyle: { color: '#409eff' } },
            { value: this.imageCount, name: 'Image', itemStyle: { color: '#67c23a' } },
            { value: this.audioCount, name: 'Audio', itemStyle: { color: '#e6a23c' } },
            { value: this.videoCount, name: 'Video', itemStyle: { color: '#f56c6c' } },
          ],
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
        <Image class="chart-icon" :size="16" />
        <span>Media Type</span>
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
