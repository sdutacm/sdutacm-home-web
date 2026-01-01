<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Provide, Prop } from 'vue-property-decorator';
import { View } from 'bwcx-client-vue3';
import { RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { GetHomeDataResDTO } from '@common/modules/home/home.dto';
import { AsyncDataOptions } from '@client/typings';

import NavigationBar from '@client/components/homepage/navigation-bar.vue';
import SectionNews from '@client/components/homepage/section-news.vue';
import SectionProject from '@client/components/homepage/section-project.vue';

@View('/')
@RenderMethod(RenderMethodKind.SSR)
@Options({
  components: {
    NavigationBar,
    SectionNews,
    SectionProject,
  },
})
export default class HomeView extends Vue {
  @Prop()
  homeState!: GetHomeDataResDTO;

  async asyncData({ apiClient }: AsyncDataOptions) {
    const res = await apiClient.getHomeData();
    return {
      homeState: res,
    };
  }

  mounted() {
    console.log(this.homeState);
    console.log(
      String.raw`      _/_/_/  _/_/_/    _/    _/  _/_/_/_/_/    _/_/      _/_/_/  _/      _/   ` +
        '\n' +
        String.raw`   _/        _/    _/  _/    _/      _/      _/    _/  _/        _/_/  _/_/    ` +
        '\n' +
        String.raw`    _/_/    _/    _/  _/    _/      _/      _/_/_/_/  _/        _/  _/  _/     ` +
        '\n' +
        String.raw`       _/  _/    _/  _/    _/      _/      _/    _/  _/        _/      _/      ` +
        '\n' +
        String.raw`_/_/_/    _/_/_/      _/_/        _/      _/    _/    _/_/_/  _/      _/       ` +
        '\n\n' +
        '🎉欢迎来到 SDUTACM 官网🤔💡🎈',
    );
  }

  parseDesc(text: string) {
    const lines = text.split('\n');
    const wrapped = lines
      .filter((line) => line.trim() !== '')
      .map((line) => `<p class="desc">${line}</p>`)
      .join('');
    return wrapped;
  }
}
</script>

<template>
  <!-- 顶部导航栏及其下拉列表 -->
  <!-- <NavigationBar :logo="homeState.logo"/> -->

  <main>
    <!-- 页面位置指示器 -->
    <div class="indicator">
      <a class="dot" href="#1"></a>
      <a class="dot" href="#2"></a>
      <a class="dot" href="#3"></a>
    </div>

    <!-- SDUTACM简介 -->
    <div class="summary" id="1">
      <span class="title" ref="section1">{{ homeState.title }}</span>
      <span class="slogan">{{ homeState.slogan }}</span>
      <div class="text" v-html="parseDesc(homeState.description)"></div>
    </div>

    <!-- 最新动态 -->
    <div class="section-title" ref="section2" id="2">最新动态</div>
    <SectionNews />

    <!-- 我们的项目 -->
    <div class="section-title" ref="section3" id="3">我们的项目</div>
    <SectionProject />

    <!-- 时间线 -->
    <!-- <div class="section-title">时间线</div>
    <div class="time-line">
      敬请期待
    </div> -->

    <!-- 加入我们 -->
    <!-- <div class="section-title">加入我们</div>
    <div class="join-us">敬请期待</div> -->
  </main>

  <footer>
    <span> © 2008-2024 SDUTACM. All Rights Reserved. </span>
  </footer>
</template>

<style scoped lang="less">
// 全局样式
// 电脑 ✅ 平板 ✅ 手机 ✅
main {
  z-index: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 1.6rem 3.6rem;
  width: 100%;
  height: 100%;
  background-color: var(--ah-c-background-bg);
  flex-direction: column;
  gap: 1rem;

  * {
    z-index: 10;
  }
}

// 页面指示器
.indicator {
  position: fixed;
  top: 50%;
  right: 0.6rem;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 0.04rem;
  height: 6.4rem;
  background-color: var(--ah-c-background-indicator);
  flex-direction: column;
  transform: translate(0, -50%);

  .dot {
    position: relative;
    border-radius: 50%;
    width: 0.28rem;
    height: 0.28rem;
    background-color: var(--ah-c-background-indicator);
    transition: all var(--ah-t-long);

    &:hover {
      border: var(--ah-c-background-indicator) 0.04rem solid;
      transform: scale(1.2);
      background-color: var(--ah-c-background-indicator-active);
    }
  }
}

// SDUTACM简介
.summary {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10vh;
  width: 100%;
  flex-direction: column;
  gap: 0.2rem;

  .title {
    font-size: 1rem;
    font-family: 'Noto Sans SC', sans-serif;
    font-weight: 900;
    color: var(--ah-c-text1);
  }

  .slogan {
    position: relative;
    margin: 0 0.7rem;
    font-size: 0.48rem;
    font-weight: 500;
    color: var(--ah-c-text3);

    &::after {
      position: absolute;
      top: 50%;
      left: -0.7rem;
      display: block;
      width: 0.5rem;
      height: 0.04rem;
      background-color: var(--ah-c-text3);
      content: '';
    }

    &::before {
      position: absolute;
      top: 50%;
      right: -0.7rem;
      display: block;
      width: 0.5rem;
      height: 0.04rem;
      background-color: var(--ah-c-text3);
      content: '';
    }
  }

  .text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;

    & :deep(.desc) {
      margin: 0.1rem 0;
      font-size: 0.32rem;
      color: var(--ah-c-text2);
      line-height: 0.48rem;
    }
  }
}

// 页脚
footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  width: 100%;
  height: 2rem;

  span {
    font-size: 0.32rem;
    color: var(--ah-c-text3);
  }
}

// 仅PC端样式
// 电脑 ✅ 平板 ❌ 手机 ❌
@media screen and (width >=1101px) {
  // nothing
}

// 放了一些非pc端的主题样式在这里
// 电脑 ❌ 平板 ✅ 手机 ✅
@media screen and (width <=1100px) {
  main {
    margin-top: 1.2rem; // 1.6rem
    padding: 1.6rem; // 1.6rem 3.6rem
  }

  .summary {
    .title {
      font-size: 0.64rem; // 1rem
    }

    .slogan {
      font-size: 0.32rem; // 0.48rem
    }
  }
}

// 非移动端展示时的 "我们的项目"板块的交互样式
// 电脑 ✅ 平板 ✅ 手机 ❌
@media screen and (width >=601px) {
  // nothing
}

// ipad端的样式. 尾随注释是在>1100px时的样式
// 电脑 ❌ 平板 ✅ 手机 ❌
@media screen and (width >=601px) and (width <=1100px) {
  // nothing
}

// 移动端的样式
// 电脑 ❌ 平板 ❌ 手机 ✅
@media screen and (width <=600px) {
  main {
    padding: 1rem 0.8rem;
  }

  .indicator {
    right: 0.3rem;

    .dot {
      width: 0.22rem;
      height: 0.22rem;
    }
  }
}
</style>
