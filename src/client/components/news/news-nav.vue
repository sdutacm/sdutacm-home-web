<script lang="ts">
import { Vue, Options } from 'vue-class-component';

@Options({
  components: {},
})
export default class NewsNav extends Vue {}
</script>

<template>
  <div class="news-nav">
    <div class="news-nav-title">
      <img src="../../assets/images/sdutacm_logo_colorful.svg" alt="" />
      <h1>SDUTACM News</h1>
    </div>
    <div class="news-nav-tools"></div>
  </div>
</template>

<style>
.news-nav {
  position: fixed;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.6rem;
  width: 100%;
  min-width: var(--ah-breakpoint-xs);
  height: 1.6rem;
  background-color: var(--ah-c-background-header);
  box-shadow: var(--ah-s-shadow-2);

  & .news-nav-title {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    & img {
      width: 1rem;
      height: 1rem;
    }
    & h1 {
      font-size: 0.6rem;
      font-weight: 700;
    }
  }
}
</style>
