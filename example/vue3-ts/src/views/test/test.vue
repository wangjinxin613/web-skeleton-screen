<template>
  <div>
    <h1>Hello World</h1>
    <p>This is a simple example of a Vue.js component.</p>
    <div class="box">
    </div>
    <div class="bg">
    </div>
    <!-- <div class="box box2">
    </div> -->
    <!-- <button>按钮</button> -->
    <!-- <div class="overflow">
      <div class="box-one">1</div>
      <div class="box-two">2</div>
    </div> -->
    <!-- <div class="box-list">
      <div class="single"></div>
      <div class="single"></div>
    </div>
    <div class="box-test">
      <div class="single"></div>
      <div class="single"></div>
    </div> -->
    <!-- <div class="test1">test1</div>
    <div class="test2">test2</div> -->
  </div>
</template>

<style lang="less">
.big-box{
  margin: 20px auto;
  width: 300px;
  height: 300px;
  background: #eee;
}
.box{
  margin: 20px auto;
  width: 100px;
  height: 100px;
  background: palegoldenrod;
}
.box1{
  border: 1px solid #000;
}
.box2{
  box-shadow: 0 0 5px #000;
}

.bg{
  margin: 20px auto;
  width: 100px;
  height: 100px;
  background: url('https://img2.baidu.com/it/u=1814268193,3619863984&fm=253&fmt=auto&app=138&f=JPEG?w=632&h=500');
  background-size: cover;
}

.overflow{
  margin: 20px auto;
  width: 200px;
  height: 200px;
  overflow: hidden;
  background: #ccc;
}

.box-one{
  width: 50px;
  height: 50px;
  background: yellow;
  margin-left: -20px;
  margin-top: -10px;
}

.box-two{
  width: 200px;
  height: 200px;
  background: red;
  margin-left: 100px;
  margin-top: 100px;
}

.box-list{
  display: flex;
  justify-content: center;

  & .single {
    width: 100px;
    height: 20px;
    background: #ccc;
    border: 1px solid #ccc;

    &:nth-of-type(2) {
      background: blue;
    }
  }
}

.box-test{
  display: flex;
  justify-content: center;
  margin-top: 30px;

  & .single {
    width: 120px;
    height: 60px;
    background: #ccc;
    border: 1px solid #ccc;
    border-radius: 10px;

    &:nth-of-type(2) {
      background: blue;
      width: 50px;
      height: 80px;
      border-radius: 0;
      position: absolute;
      transform: translateX(10px);
    }
  }
}
.test1, .test2{
  margin: 20px auto;
  width: 100px;
  height: 30px;
  background: #ccc;
}

.test2{
  background: transparent
}
</style>