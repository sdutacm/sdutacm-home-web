<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import SdutacmLogoPure from './sdutacm-logo-pure.vue';
import { ElDivider } from 'element-plus';
import IconBilibili from './homepage/icon/icon-bilibili.vue';
import IconWechat from './homepage/icon/icon-wechat.vue';

@Options({
  components: {
    SdutacmLogoPure,
    ElDivider,
    IconBilibili,
    IconWechat,
  },
})
export default class HomeFooter extends Vue {
  goHome() {
    this.$router.push('/');
  }

  toTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
</script>

<template>
  <footer class="home-footer">
    <!-- <div class="sunflower-to-top" @click="toTop">
      <img src="../assets/images/sunflower.png" alt="">
    </div> -->
    <div class="footer-container">
      <div class="display">
        <a class="logo-section" href="/" target="_parent">
          <SdutacmLogoPure style="width: 1.2rem; height: 1.2rem" />
          <span>SDUTACM</span>
        </a>
        <div class="slogan-section">
          <p>宁拙毋巧，和而不同</p>
          <small>NO EFFORTS GOES IN VAIN</small>
        </div>
      </div>
      <client-only><el-divider></el-divider></client-only>
      <div class="cpr-links">
        <div class="info">
          <span>Copyright © 2026 SDUTACM. All rights reserved.</span>
        </div>
        <div class="links">
          <span>关注我们</span>
          <a href="https://space.bilibili.com/1479542015" target="_blank" rel="noopener">
            <IconBilibili style="width: .6rem; height: .6rem" />
          </a>
          <a href="https://mp.weixin.qq.com/s/0n9sKqj8qLhXH9n2eQYg" target="_blank" rel="noopener">
            <IconWechat style="width: .6rem; height: .6rem" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="less">
.home-footer {
  width: 100%;
  height: fit-content;
  background-color: var(--ah-c-background-header);
  padding: 1rem 0;
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  position: relative;
  & .footer-container {
    width: 60%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;

    & .display {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: start;
      height: fit-content;

      & .logo-section {
        display: flex;
        align-items: start;
        justify-content: start;
        height: fit-content;
        user-select: none;
        gap: 0.2rem;
        cursor: pointer;
        & span {
          font-size: 0.8rem;
          font-weight: 700;
        }
      }

      & .slogan-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;

        & p {
          font-size: 0.8rem;
          font-weight: 700;
        }

        & small {
          font-size: 0.3rem;
          font-weight: 200;
        }
      }
    }

    & .cpr-links {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;

      & .info {
        font-size: 0.32rem;
        color: var(--ah-c-text2);
      }

      & .links {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        & span {
          font-size: 0.32rem;
          color: var(--ah-c-text2);
        }

        & a {
          font-size: 0.32rem;
          color: var(--ah-c-text2);
          text-decoration: underline;
        }
      }
    }
  }
}

.sunflower-to-top {
  position: absolute;
  width: 1.5rem;
  height: 1.5rem;
  top: 0;
  right: 10%;
  transform: translateY(-100%);

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: floatUpDown 3s ease-in-out infinite;
    cursor: pointer;

    &:hover {
      animation-play-state: paused;
    }
  }
}
</style>
