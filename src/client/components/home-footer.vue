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

  get year() {
    return new Date().getFullYear();
  }
}
</script>

<template>
  <footer class="home-footer">
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
          <span>Copyright © {{ year }} SDUTACM. All rights reserved.</span>
        </div>
        <div class="links">
          <span>关注我们</span>
          <div class="link-item">
            <a href="https://space.bilibili.com/1479542015" target="_blank" rel="noopener">
              <IconBilibili style="width: .6rem; height: .6rem" />
            </a>
            <div class="qr-popup">
              <img src="../assets/images/qr_bilibili.png" alt="Bilibili 二维码" />
            </div>
          </div>
          <div class="link-item">
            <a href="https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzA3NDg0NjEwOA==&scene=124#wechat_redirect" target="_blank" rel="noopener">
              <IconWechat style="width: .6rem; height: .6rem" />
            </a>
            <div class="qr-popup">
              <img src="../assets/images/qr_wx.png" alt="微信公众号二维码" />
            </div>
          </div>
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
  user-select: none;

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
      margin-bottom: 1rem;

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

        & .link-item {
          position: relative;
          display: flex;
          align-items: center;

          & a {
            font-size: 0.32rem;
            color: var(--ah-c-text2);
            text-decoration: underline;
            display: flex;
            align-items: center;

            &:hover {
              & + .qr-popup {
                opacity: 1;
              }
            }
          }

          & .qr-popup {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 0.3rem;
            height: fit-content;
            padding: 0.3rem;
            background: #fff;
            border-radius: 0.2rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 1001;

            &::after {
              content: '';
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              border: 0.15rem solid transparent;
              border-top-color: #fff;
            }

            & img {
              display: block;
              width: 2.5rem;
              height: 2.5rem;
              object-fit: contain;
              border-radius: 0.1rem;
              -webkit-user-drag: none;
            }
          }
        }

        & > a {
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
