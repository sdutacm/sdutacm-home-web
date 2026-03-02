<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { GetProjectPreviewResDTO } from '@common/modules/project/project.dto';

@Options({})
export default class SectionProject extends Vue {
  @Prop({ required: true })
  projectItems!: GetProjectPreviewResDTO[];

  defaultBgColor = '#f4f4f4';

  acitveProject = 0;
  clickProject = (target) => {
    this.acitveProject = target === this.acitveProject ? 0 : target;
  };

  splitDescription(description?: string): string[] {
    if (!description) return [];
    return description.split('\n').filter((line) => line.trim());
  }
}
</script>

<template>
  <div class="project">
    <div
      class="project-item"
      v-for="(project, index) in projectItems"
      :key="index"
      :class="{ active: acitveProject === index + 1 }"
      :style="{
        backgroundImage: `url(${project.coverImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '10% 50%',
        backgroundSize: '50%',
        backgroundColor: project.bgColor || defaultBgColor,
      }"
      @click="() => this.clickProject(index + 1)"
    >
      <div class="project-bubble"></div>
      <span class="project-title">{{ project.name }}</span>
      <div class="project-external-links">
        <a v-if="project.websiteUrl" class="external-link" :href="project.websiteUrl" target="_blank" @click.stop>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            />
          </svg>
          <span>官网</span>
        </a>
        <a v-if="project.repoUrl" class="external-link" :href="project.repoUrl" target="_blank" @click.stop>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
          <span>仓库</span>
        </a>
      </div>
      <p class="project-summary">
        <span v-for="(line, lineIndex) in splitDescription(project.description)" :key="lineIndex">{{ line }}</span>
      </p>
    </div>
  </div>
</template>

<style lang="less" scoped>
// 我们的项目
.project {
  display: flex;
  width: 100%;
  max-width: 20rem;
  height: 100%;
  flex-direction: column;
  place-self: center center;
  gap: 0.8rem;

  .project-item {
    position: relative;
    overflow: hidden;
    border-radius: 0.2rem;
    width: 100%;
    height: 5rem;
    transition: box-shadow var(--ah-t-long);

    .project-bubble {
      position: absolute;
      top: -5rem;
      right: -4.5rem;
      border-radius: 50%;
      width: 12rem;
      height: 12rem;
      background-color: var(--ah-c-background-card);
      transition: transform var(--ah-t-long), box-shadow var(--ah-t-long);
    }

    .project-title {
      position: absolute;
      top: 2.2rem;
      right: 0;
      width: 40%;
      font-size: 0.48rem;
      font-weight: 700;
      text-align: center;
      color: var(--ah-c-text2);
      transition: transform var(--ah-t-long);
      cursor: default;
    }

    .project-external-links {
      position: absolute;
      top: 3rem;
      right: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.24rem;
      width: 40%;
      opacity: 0;
      transition: opacity var(--ah-t-short) 0s;

      .external-link {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.12rem;
        padding: 0.08rem 0;
        font-size: 0.28rem;
        font-weight: 500;
        color: var(--ah-c-text2);
        text-decoration: none;

        svg {
          width: 0.32rem;
          height: 0.32rem;
        }

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 0.04rem;
          background-color: var(--ah-c-text2);
          transition: width var(--ah-t-short), left var(--ah-t-short);
        }

        &:hover::after {
          left: 0;
          width: 100%;
        }
      }
    }

    .project-summary {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 0 1rem;
      width: 60%;
      height: 100%;
      color: var(--ah-c-text2);
      opacity: 0;
      transition: opacity 0.2s 0s;
      flex-direction: column;
      user-select: none;

      span {
        margin: 0.2rem 0;
        font-size: 0.32rem;
        font-weight: 500;
        line-height: 0.48rem;
        user-select: none;
      }
    }

    .project-links {
      position: absolute;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40%;
      height: 80%;
      max-height: 0;
      opacity: 0;
      transition: opacity var(--ah-t-short) 0s;
      flex-direction: column;

      .link-item {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 30%;
        height: 100%;
        max-height: 0.8rem;

        .img {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 5rem;
          opacity: 0;
          transition: opacity 0.2s ease-in-out, width 0s ease-in-out;
          transform: translateX(-100%);
        }

        .link {
          position: relative;
          width: 100%;
          height: 100%;
          font-size: 0.32rem;
          font-weight: 500;
          text-align: center;
          color: var(--ah-c-text2);
          line-height: 0.8rem;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            display: block;
            width: 20%;
            height: 0.04rem;
            background-color: var(--ah-c-text1);
            opacity: 0;
            transition: width var(--ah-t-short), opacity var(--ah-t-short);
            transform: translateX(-50%);
          }
        }

        &:hover {
          .img {
            width: 150%;
            opacity: 1;
          }

          .link {
            &::after {
              width: 60%;
              opacity: 1;
            }
          }
        }
      }
    }
  }

  // 我们的项目的单独配置: 背景图 + 链接预览图
  .project-item1 {
    background: url('../../assets/img/sdutacm-homepage-project-oj3-logo.png') no-repeat 10% 50% / 50%, #f4f4f4;

    .project-links {
      #img-1-1 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-oj3-home.png') no-repeat left / cover;
      }

      #img-1-2 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-oj3-contests.png') no-repeat left / cover;
      }

      #img-1-3 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-oj3-users.png') no-repeat left / cover;
      }

      #img-1-4 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-oj3-github.png') no-repeat left / cover;
      }
    }
  }

  .project-item2 {
    background: url('../../assets/img/sdutacm-homepage-project-rankland-logo.png') no-repeat 10% 50% / 50%, #fff2df;

    .project-links {
      #img-2-1 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-rankland-home.png') no-repeat left / cover;
      }

      #img-2-2 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-rankland-search.png') no-repeat left / cover;
      }

      #img-2-3 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-rankland-collection.png') no-repeat left / cover;
      }

      #img-2-4 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-rankland-playground.png') no-repeat left / cover;
      }
    }
  }

  .project-item3 {
    background: url('../../assets/img/sdutacm-homepage-project-magicbook-logo.png') no-repeat 10% 50% / 50%, #d6e6f2;

    .project-links {
      #img-3-1 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-magicbook-home@2.png') no-repeat left / cover;
      }

      #img-3-2 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-magicbook-missions@2.png') no-repeat left / cover;
      }

      #img-3-3 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-magicbook-catalog@2.png') no-repeat left / cover;
      }

      #img-3-4 {
        background: var(--ah-bg-project),
          url('../../assets/img/sdutacm-homepage-project-magicbook-gallery@2.png') no-repeat left / cover;
      }
    }
  }
}

// // 非移动端展示时的 "我们的项目"板块的交互样式
// // 电脑 ✅ 平板 ✅ 手机 ❌
@media screen and (width >=601px) {
  .project-item {
    &.active {
      .project-bubble {
        transform: scale(3.5);
      }

      .project-title {
        transform: translateY(-1.6rem);
      }

      .project-external-links {
        opacity: 1;
        transition: opacity var(--ah-t-long) var(--ah-t-short);
      }

      .project-summary {
        opacity: 1;
        transition: opacity var(--ah-t-long) var(--ah-t-short);

        span {
          user-select: auto;
        }
      }

      .project-links {
        max-height: 10rem;
        opacity: 1;
        transition: opacity var(--ah-t-long) var(--ah-t-short);
      }
    }

    &:hover:not(.active) {
      cursor: pointer;

      .project-bubble {
        transform: scale(1.2);
        box-shadow: var(--ah-s-shadow-1);
      }
    }

    &:hover {
      box-shadow: var(--ah-s-shadow-1);
    }
  }
}

// ipad端的样式. 尾随注释是在>1100px时的样式
// 电脑 ❌ 平板 ✅ 手机 ❌
@media screen and (width >=601px) and (width <=1100px) {
  .project {
    width: 100%; // 100%
    max-width: 14rem; // 20rem

    .project-item {
      height: 4.5rem; // 5rem
      background-size: 40%;

      .project-bubble {
        top: -3rem; // -5rem
        right: -3rem; // -4.5rem
        width: 8rem; // 12rem
        height: 8rem; // 12rem
      }

      .project-title {
        top: 2rem; // 2.2rem
        width: 30%; // 40%
        font-size: 0.4rem; // 0.48rem
      }

      .project-external-links {
        top: 2.7rem; // 3rem
        width: 30%; // 40%

        .external-link {
          font-size: 0.24rem;
        }
      }

      .project-summary {
        padding: 0 0.4rem;

        span {
          font-size: 0.28rem; // 0.32rem
          line-height: 0.4rem; // 0.48rem
        }
      }

      .project-links {
        width: 30%; // 40%

        .link-item {
          .img {
            height: 4.5rem; // 5rem
          }

          .link {
            font-size: 0.28rem; // 0.32rem
            line-height: 0.6rem; // 0.8rem
          }

          &:hover {
            .img {
              width: 230%; // 150%
            }
          }
        }
      }

      &:hover:not(.active) {
        .project-bubble {
          // transform: scale(1.1);
          box-shadow: var(--ah-s-shadow-1);
        }
      }

      &:hover {
        box-shadow: var(--ah-s-shadow-1);
      }
    }
  }
}

// 移动端的样式
// 电脑 ❌ 平板 ❌ 手机 ✅
@media screen and (width <=600px) {
  .project {
    width: 100%;

    .project-item {
      height: 7rem;
      background-position: 50% 20%;
      background-size: 60%;

      .project-bubble {
        top: 80%;
        left: 50%;
        z-index: 10;
        width: 12rem;
        height: 12rem;
        transform: translate(-50%, -20%);
      }

      .project-title {
        top: 70%;
        right: 50%;
        z-index: 50;
        transform: translate(50%, -20%);
      }

      .project-external-links {
        top: auto;
        bottom: 0.8rem;
        right: 50%;
        z-index: 50;
        transform: translateX(50%);
      }

      .project-summary {
        z-index: 20;
        padding: 0 0.4rem;
        width: 100%;
      }

      .project-links {
        margin-bottom: 0.4rem;
        padding: 0.4rem;
        width: 100%;
        height: auto;
        flex-direction: row;
        gap: 0.2rem;

        .link-item .link {
          z-index: 0;
          border-radius: 0.2rem;
          font-size: 0.24rem;
          background-color: var(--ah-c-background-button);
          line-height: 0.64rem;
        }
      }

      &.active {
        .project-bubble {
          transform: translate(-50%, -50%) scale(1.5);
        }

        .project-title {
          transform: translate(50%, -4rem);
        }

        .project-external-links {
          opacity: 1;
          transition: opacity var(--ah-t-long) var(--ah-t-short);
        }

        .project-summary {
          opacity: 1;
          transition: opacity var(--ah-t-long) var(--ah-t-short);

          span {
            user-select: auto;
          }
        }

        .project-links {
          z-index: 50;
          opacity: 1;
          transition: opacity var(--ah-t-long) var(--ah-t-short);
        }
      }

      &:hover:not(.active) {
        .project-bubble {
          transform: translate(-50%, -24%) scale(1.05);
          box-shadow: var(--ah-s-shadow-1);
        }
      }

      &:hover {
        box-shadow: var(--ah-s-shadow-1);

        .project-bubble {
          box-shadow: var(--ah-s-shadow-1);
        }
      }
    }
  }
}
</style>
