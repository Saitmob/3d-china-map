/*
 * @Description: 3d地图 
 * @Author: qinxp 
 * @Date: 2022-01-11 17:02:52 
 * @Last Modified by: qinxp
 * @Last Modified time: 2022-01-18 16:32:04
 */
 <template>
    <div ref="box" class="china-chart">
        <div id="provinceInfo"></div>
    </div>
</template>
<script>
import lineMap from './map'

export default {
    name: "Map",
    props: {
        tagData: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            mapObj: null
        };
    },
    watch: {
        tagData(v) {
            this.mapObj.setTag(v)
        }
    },
    mounted() {
        this.init();
    },
    beforeDestroy() {
        this.mapObj.destroyed()
    },
    methods: {
        init() {
            this.mapObj = new lineMap(
                this.$refs.box,
                document.querySelector('#provinceInfo'),
                {
                    tagClick: this.tagClick.bind(this)
                }
            );
            this.mapObj.init();
            this.mapObj.setTag(this.tagData)
        },
        tagClick(v) {
            this.$emit('tagClick', v)
        }
    },
};
</script>
<style lang="scss" scoped>
.china-chart{
    position: relative;
    width: 100%;
    height: 100%;
    // mask-image: radial-gradient(yellow 60%, transparent 80%);
    #provinceInfo{
        position: absolute;
        color: #fff;
        user-select: none;
    }
}
</style>