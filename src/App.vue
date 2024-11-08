<template>
  <div
    id="app"
    style="'width:100vw; height 100vh'">
    <div id="game-container"></div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'App',
  };
</script>

<style>
#app {
  text-align: center;
  display: flex;
  justify-content: center;
  items: center;
}

#game-container {
  width: 100%;
  height: 100%;
}
</style>
