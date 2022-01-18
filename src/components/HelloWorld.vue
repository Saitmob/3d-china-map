<template>
  <div class="hello">
    <Map :tagData="tagData" @tagClick="onClick"/>
  </div>
</template>

<script>
import Map from '@/components/Map'
export default {
  name: 'HelloWorld',
  components: { Map },
  props: {
    msg: String
  },
  data() {
    return {
      tagData: [
        {"cityId":"110100","cityName":"北京","value":["116.405289","39.904987"],"projectCount":3,"deviceCount":1},
        {"cityId":"441200","cityName":"肇庆","value":["112.616609","23.20106"],"projectCount":14,"deviceCount":107},
        {"cityId":"460100","cityName":"海口","value":["110.208472","20.031379"],"projectCount":3,"deviceCount":20},
        {"cityId":"440100","cityName":"广州","value":["113.34669","23.147482"],"projectCount":4,"deviceCount":50},
        {"cityId":"440800","cityName":"湛江","value":["110.420038","21.193235"],"projectCount":3,"deviceCount":37},
        {"cityId":"530700","cityName":"丽江","value":["100.233025","26.872108"],"projectCount":1,"deviceCount":0},
        {"cityId":"445100","cityName":"潮州","value":["116.592724","23.488789"],"projectCount":2,"deviceCount":31},
        {"cityId":"440600","cityName":"佛山","value":["113.207172","23.134999"],"projectCount":3,"deviceCount":34}
      ]
    }
  },
  methods: {
    onClick(d) {
      alert(d.cityName)
    }
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
