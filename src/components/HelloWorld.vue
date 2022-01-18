<template>
  <div class="hello">
    <Map />
  </div>
</template>

<script>
import Map from '@/components/Map'
export default {
  name: 'HelloWorld',
  components: { Map },
  props: {
    msg: String
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.hello{
  height: 100%;
  width: 100%;
  background: #000;
}
</style>
