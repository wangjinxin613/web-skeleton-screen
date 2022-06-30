<template>
  <router-view />
</template>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

body {
  font-size: 14px !important;
  overflow-x: hidden;
  cursor: pointer;
  margin: 0;
  padding: 0;
  -webkit-overflow-scrolling: touch;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<style lang="less">
/** 导入全局css样式 */
</style>

<script lang="js">
import Vue from 'vue'
export default {
  name: "App",
  beforeCreate() {
    // 全局i18n 函数
    window.i18n= this.$t;
  },

};
// function fontSize() {
//   let view_width = document
//     .getElementsByTagName("html")[0]
//     .getBoundingClientRect().width;
//   let _html = document.getElementsByTagName("html")[0];
//   view_width > 768
//     ? (_html.style.fontSize = (100 * 768) / 375 + "px")
//     : (_html.style.fontSize = (view_width * 100) / 375 + "px");
// }
// fontSize();
// window.onresize = function () {
//   fontSize();
// };
</script>
