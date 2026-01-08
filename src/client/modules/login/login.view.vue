<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View } from 'bwcx-client-vue3';
import { RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { ElForm, ElInput, ElFormItem, ElButton } from 'element-plus';
import { RegisterAdminReqDTO } from '@common/modules/auth/auth.dto';

@View('/login')
@Options({
  components: {
    ElForm,
    ElInput,
    ElFormItem,
    ElButton,
  },
})
@RenderMethod(RenderMethodKind.CSR)
export default class LoginView extends Vue {
  loginState: RegisterAdminReqDTO = {
    username: '',
    password: '',
  };

  async login() {
    try {
      await this.$api.login({
        username: this.loginState.username,
        password: this.loginState.password,
      });
      this.$router.push('/admin');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
    }
  }
}
</script>

<template>
  <div class="login-container">
    <header class="login-header">
      <div class="title">Tars</div>
      <span class="desc">SDUTACM Admin System</span>
    </header>
    <main class="login-main">
      <h1 class="slogan">Hi, SDUTACMer ! 🌻</h1>
      <el-form class="login-form" size="large">
        <el-form-item label="username">
          <el-input v-model="loginState.username" placeholder="Please enter username"></el-input>
        </el-form-item>
        <el-form-item label="password">
          <el-input v-model="loginState.password" type="password" placeholder="Please enter password"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" plain @click="login">Login</el-button>
        </el-form-item>
      </el-form>
    </main>
    <footer class="login-footer">© 2026 SDUTACM All Rights Reserved.</footer>
  </div>
</template>

<style lang="less" scoped>
.login-form {
  font-size: 0.6rem;
}

.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  & .login-header {
    display: flex;
    justify-content: start;
    align-items: end;
    width: 100%;
    padding: 0.5rem;
    gap: 0.1rem;

    & .title {
      width: fit-content;
      height: fit-content;
      font-size: 1rem;
      font-weight: bold;
      position: relative;
      display: flex;
      line-height: 1rem;
    }

    & .desc {
      font-size: 0.3rem;
    }
  }

  & .login-main {
    flex: 1;
    width: 100%;
    display: flex;
    // padding: 4rem 1rem;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;

    @media screen and (max-width: 1100px) {
      justify-content: center;
    }
    & .slogan {
      font-size: 1.5rem;
      font-weight: bold;
      @media screen and (max-width: 1100px) {
        font-size: 1rem;
      }

      @media screen and (max-width: 600px) {
        font-size: 0.8rem;
      }
    }
  }

  & .login-footer {
    font-size: 0.3rem;
    color: gray;
  }
}
</style>
