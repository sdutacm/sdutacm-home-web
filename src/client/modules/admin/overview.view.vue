<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { Head } from '@vueuse/head';
import { ElSkeleton, ElIcon } from 'element-plus';
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
  Pointer,
} from 'lucide-vue-next';
import VisitTrendChart from '@client/components/admin/charts/visit-trend-chart.vue';
import MediaTypePieChart from '@client/components/admin/charts/media-type-pie-chart.vue';
import NewsStatusBarChart from '@client/components/admin/charts/news-statusbar-chart.vue';
import AdminActivityPieChart from '@client/components/admin/charts/admin-activity-pie-chart.vue';

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
    Pointer,
    VisitTrendChart,
    MediaTypePieChart,
    NewsStatusBarChart,
    AdminActivityPieChart,
  },
})
export default class OverviewView extends Vue {
  loading = true;

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
    logoCount: 0,
    imageCount: 0,
    audioCount: 0,
    videoCount: 0,
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
}
</script>

<template>
  <Head>
    <title>SDUTACM Admin | Overview</title>
    <meta name="description" content="SDUTACM 管理后台概览" />
  </Head>
  <div class="overview-container">
    <el-skeleton :loading="loading" animated :rows="6">
      <template #default>
        <div class="stats-grid">
          <!-- 访问统计 -->
          <div class="stats-section">
            <div class="section-title">
              <!-- <el-icon size="11"><Pointer /></el-icon> -->
              <span>Visit Statistics</span>
            </div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <Eye class="stat-icon" :size="16" />
                  <span>Total</span>
                </div>
                <div class="stat-value">{{ stats.totalHomeViews.toLocaleString() }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <TrendingUp class="stat-icon" :size="16" />
                  <span>Today</span>
                </div>
                <div class="stat-value highlight">{{ stats.todayHomeViews.toLocaleString() }}</div>
              </div>
            </div>
          </div>

          <!-- 新闻统计 -->
          <div class="stats-section">
            <div class="section-title">News Statistics</div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <Newspaper class="stat-icon" :size="16" />
                  <span>Total</span>
                </div>
                <div class="stat-value">{{ stats.totalNewsCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <FileText class="stat-icon" :size="16" />
                  <span>Published</span>
                </div>
                <div class="stat-value">{{ stats.publishedNewsCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <FileText class="stat-icon" :size="16" />
                  <span>Draft</span>
                </div>
                <div class="stat-value secondary">{{ stats.draftNewsCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <Eye class="stat-icon" :size="16" />
                  <span>Views</span>
                </div>
                <div class="stat-value">{{ stats.totalNewsViews.toLocaleString() }}</div>
              </div>
            </div>
          </div>

          <!-- 项目统计 -->
          <div class="stats-section">
            <div class="section-title">Projects Statistics</div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <FolderKanban class="stat-icon" :size="16" />
                  <span>Total</span>
                </div>
                <div class="stat-value">{{ stats.totalProjectCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <Star class="stat-icon" :size="16" />
                  <span>Featured</span>
                </div>
                <div class="stat-value">{{ stats.featuredProjectCount }}</div>
              </div>
            </div>
          </div>

          <!-- 媒体统计 -->
          <div class="stats-section">
            <div class="section-title">Media Statistics</div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <Image class="stat-icon" :size="16" />
                  <span>Total</span>
                </div>
                <div class="stat-value">{{ stats.totalMediaCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <HardDrive class="stat-icon" :size="16" />
                  <span>Storage Usage</span>
                </div>
                <div class="stat-value">{{ formattedMediaSize }}</div>
              </div>
            </div>
          </div>

          <!-- 管理员统计 -->
          <div class="stats-section">
            <div class="section-title">Admin Statistics</div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-label">
                  <Users class="stat-icon" :size="16" />
                  <span>Total</span>
                </div>
                <div class="stat-value">{{ stats.totalAdminCount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">
                  <UserCheck class="stat-icon" :size="16" />
                  <span>Active Admins</span>
                </div>
                <div class="stat-value">{{ stats.activeAdminCount }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 访问趋势图表 -->
        <VisitTrendChart :view-data="dailyViewData" />

        <!-- 统计图表区域 -->
        <div class="charts-row">
          <MediaTypePieChart
            :logo-count="stats.logoCount"
            :image-count="stats.imageCount"
            :audio-count="stats.audioCount"
            :video-count="stats.videoCount"
          />
          <NewsStatusBarChart :published-count="stats.publishedNewsCount" :draft-count="stats.draftNewsCount" />
          <AdminActivityPieChart :total-count="stats.totalAdminCount" :active-count="stats.activeAdminCount" />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style lang="less" scoped>
.overview-container {
  padding: 0 24px 24px;
}

.stats-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: .5rem;
  margin-bottom: 24px;
}

.stats-section {
  background: var(--ah-c-background-header);
  padding: 20px 24px 16px;
  border-radius: 0.2rem;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    user-select: none;
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
  user-select: none;
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

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: .5rem;
  margin-top: .5rem;
}
</style>
