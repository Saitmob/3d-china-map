import * as THREE from "three";
import * as d3 from "d3";
import TWEEN from '@tweenjs/tween.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';

import { CSM } from 'three/examples/jsm/csm/CSM.js';
import { CSMHelper } from 'three/examples/jsm/csm/CSMHelper.js';


import px from './textures/cube/px.png'
import py from './textures/cube/py.png'
import pz from './textures/cube/pz.png'
import nx from './textures/cube/nx.png'
import ny from './textures/cube/ny.png'
import nz from './textures/cube/nz.png'

import tag from './textures/tag.png'

// 墨卡托投影转换
const projection = d3.geoMercator().center([104.0, 37.5]).scale(80).translate([0, 0]);

// 地图材质颜色
// const COLOR_ARR = [0x3C6EAB, 0x2F75AC, '#0465BD', '#4350C1', '#008495']
// const COLOR_ARR = [0x3C6EAB, 0x2F75AC, '#0465BD', '#357bcb', '#408db3']
const COLOR_ARR = ['#0465BD', '#357bcb', '#3a7abd']
const HIGHT_COLOR = '#4fa5ff'

let csmHelper;
const params = {
	orthographic: false,
	fade: false,
	far: 1000,
	mode: 'practical',
	// mode: 'uniform',
	lightX: - 1,
	lightY: - 1,
	lightZ: - 1,
	margin: 100,
	lightFar: 5000,
	lightNear: 1,
	autoUpdateHelper: true,
	updateHelper: function () {
		csmHelper.update();
	}
};

export default class lineMap {
    constructor(container, el, options) {
        this.container = container ? container : document.body;
        this.width = this.container.offsetWidth
        this.height = this.container.offsetHeight
        this.provinceInfo = el
        const {
            tagClick = () => {}
        } = options
        this.tagClick = tagClick
    }

    init() {
        this.provinceInfo = this.provinceInfo || document.getElementById('provinceInfo');
        this.group = new THREE.Object3D(); // 标注
        
        this.selectedObject = null
        // 渲染器
        // this.renderer = new THREE.WebGLRenderer();
        if (!this.renderer) {
            this.renderer = new THREE.WebGLRenderer( { antialias: true,alpha: true} );
        }
        this.renderer.shadowMap.enabled = true; // 开启阴影
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.25;
		// this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.outputEncoding = THREE.sHSVEncoding;
        this.renderer.setPixelRatio( window.devicePixelRatio );
        // 清除背景色，透明背景
        this.renderer.setClearColor(0xffffff, 0);
        
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);

        
        // 场景
        this.scene = new THREE.Scene();
        this.scene.background = null


        // probe
		this.lightProbe = new THREE.LightProbe();

        // this.scene.add(bulbLight)
		this.scene.add( this.lightProbe );

        // 相机 透视相机
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 5000);
        this.camera.position.set(0, -40, 70);
        this.camera.lookAt(0, 0, 0);

        const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
		this.scene.add( ambientLight );

        this.csm = new CSM( {
            maxFar: params.far,
            cascades: 4,
            mode: params.mode,
            parent: this.scene,
            shadowMapSize: 1024,
            lightDirection: new THREE.Vector3( params.lightX, params.lightY, params.lightZ ).normalize(),
            camera: this.camera
        } );

        this.csmHelper = new CSMHelper( this.csm );
        this.csmHelper.visible = false;
        this.scene.add( this.csmHelper );


        this.setController(); // 设置控制

        this.setLight(); // 设置灯光

        this.setRaycaster();

        this.setPlayGround()

        this.animate();

        this.setTag()


        // this.loadFont(); // 加载字体

        this.loadMapData();


        this.setResize(); // 绑定浏览器缩放事件
    }

    setResize() {
        window.addEventListener('resize', this.resizeEventHandle.bind(this))
    }

    resizeEventHandle() {
        this.width = this.container.offsetWidth
        this.height = this.container.offsetHeight
        this.renderer.setSize(this.width, this.height);
    }
    loadMapData() {
        let _this = this;

        let jsonData = require('./json/china.json')
        
        _this.initMap(jsonData);
    }

    loadFont() { //加载中文字体
        var loader = new THREE.FontLoader();
        var _this = this;
        loader.load('fonts/chinese.json', function (response) {
            _this.font = response;
            _this.loadMapData();
        });

    }

    createText(text, position) {
        var shapes = this.font.generateShapes(text, 1);

        var geometry = new THREE.ShapeBufferGeometry(shapes);

        var material = new THREE.MeshBasicMaterial();

        var textMesh = new THREE.Mesh(geometry, material);
        textMesh.position.set(position.x, position.y, position.z);

        this.scene.add(textMesh);
    }

    initMap(chinaJson) {
        // 建一个空对象存放对象
        this.map = new THREE.Object3D();

        let _this = this;

        // 加载贴图材质
        const urls = [px,nx,py,ny,pz,nz];

        // 绘制地图
		new THREE.CubeTextureLoader().load( urls, function ( cubeTexture ) {
			// cubeTexture.encoding = THREE.sRGBEncoding;
			// _this.scene.background = cubeTexture;

			_this.lightProbe.copy( LightProbeGenerator.fromCubeTexture( cubeTexture ) );


            chinaJson.features.forEach((elem, index) => {
                // 定一个省份3D对象
                const province = new THREE.Object3D();
                // 每个的 坐标 数组
                const coordinates = elem.geometry.coordinates;
                const color = COLOR_ARR[index % COLOR_ARR.length]
                // 循环坐标数组
                coordinates.forEach(multiPolygon => {
                    
                    multiPolygon.forEach((polygon) => {
                        const shape = new THREE.Shape();
                        
                        for (let i = 0; i < polygon.length; i++) {
                            let [x, y] = projection(polygon[i]);
                            
                            if (i === 0) {
                                shape.moveTo(x, -y);
                            }
                            shape.lineTo(x, -y);
                        }
    
                        const extrudeSettings = {
                            depth: 4,
                            bevelEnabled: true,
                            bevelSegments: 1,
                            bevelThickness: 0.2
                        };
    
                        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                       
                        
                        const material = new THREE.MeshStandardMaterial( {
                            clearcoat: 3.0,
                            metalness: 1,
                            color: color,
                            
                        } );

                        const material1 = new THREE.MeshStandardMaterial( {
                            clearcoat: 3.0,
                            metalness: 1,
                            roughness: 1,
                            color: color,
                            
                        } );

                        const mesh = new THREE.Mesh(geometry, [
                            material,
                            material1
                        ]);
                        if (index % 2 === 0) {
                            mesh.scale.set(1, 1, 1.2);
                        }
                        
                        mesh.castShadow = true
                        mesh.receiveShadow = true
                        mesh._color = color
                        province.add(mesh);

                    })
    
                })
    
                // 将geo的属性放到省份模型中
                province.properties = elem.properties;
                if (elem.properties.centorid) {
                    const [x, y] = projection(elem.properties.centorid);
                    province.properties._centroid = [x, y];
                }
    
                _this.map.add(province);
                
            })
    
            _this.scene.environment = cubeTexture;
            // 销毁贴图
            cubeTexture.dispose();
            _this.scene.add(_this.map);
            // this.renderer.render();
		}, () => {}, (e) => {
             console.log(e)
        } );
        
    }

    // 绘制标注
    setTag(_data = []) {
        if (!_data || _data.length === 0) {
            return 
        }

        this.scene.remove(this.group)
        this.group = new THREE.Object3D();

        function paintTag(scale = 1) {
            let spriteMap = new THREE.TextureLoader().load( tag );

            _data.forEach(d => {
                // 必须是不同的材质，否则鼠标移入时，修改材质会全部都修改
                let spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
                const { value } = d
                // 添加标点
                const sprite1 = new THREE.Sprite( spriteMaterial );
                
                if (value && value.length !== 0) {
                    let [x, y] = projection(value)
                    sprite1.position.set(x, -y + 2, 6);
                }
                sprite1._data = d
                sprite1.scale.set( 2 * scale, 3 * scale, 8 * scale );

                this.group.add(sprite1)
            })
            spriteMap.dispose()
        }

        function setScale(scale = 1) {
            this.group.children.forEach(s => {
                s.scale.set( 2 * scale, 3 * scale, 8 * scale );
            })
        }
        
        this.scene.add(this.group)

        paintTag.call(this, 0.1)
        
        let tween = new TWEEN.Tween({ val: 0.1 })
        .to(
            {
                val: 1.2
            },
            1.5 * 1000
        )
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate((d) => {//高度增加动画
            setScale.call(this, d.val)
        })
        tween.start()
        
        if (this.raycaster) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
        }
        this.renderer.render(this.scene, this.camera);
        console.log('render info', this.renderer.info)
        // TWEEN.update()
    }

    setRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.eventOffset = {};
        var _this = this;

        function onMouseMove(event) {
            // 父级并非满屏，所以需要减去父级的left 和 top
            let { top, left, width, height } = _this.container.getBoundingClientRect()
            let clientX = event.clientX - left
            let clientY = event.clientY - top

            _this.mouse.x = (clientX / width) * 2 - 1;
            _this.mouse.y = -(clientY / height) * 2 + 1;

            _this.eventOffset.x = clientX;
            _this.eventOffset.y = clientY;
            _this.provinceInfo.style.left = _this.eventOffset.x + 10 + 'px';
            _this.provinceInfo.style.top = _this.eventOffset.y - 20 + 'px';
        }

        // 标注
        function onPointerMove() {
            if ( _this.selectedObject ) {
                _this.selectedObject.material.color.set( 0xffffff );
                _this.selectedObject = null;
            }

            if (_this.raycaster) {
                const intersects = _this.raycaster.intersectObject( _this.group, true );
                // console.log('select group', intersects)
                if ( intersects.length > 0 ) {
                    const res = intersects.filter( function ( res ) {
    
                        return res && res.object;
    
                    } )[intersects.length - 1];
    
                    if ( res && res.object ) {
                        _this.selectedObject = res.object;
                        _this.selectedObject.material.color.set( '#f00' );
    
                    }
                }
            }
        }

        // 标注点击
        function onClick() {
            if (_this.selectedObject) {
                // 输出标注信息
                console.log(_this.selectedObject._data)
                _this.tagClick(_this.selectedObject._data)
            }
        }
        window.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener( 'pointermove', onPointerMove );
        document.addEventListener( 'click', onClick );
    }

    // // 绘制地面
        
    setPlayGround() {
        const groundMaterial = new THREE.MeshStandardMaterial( { 
            color: 0x031837, 
            // specular: 0x111111,
            metalness: 0,
            roughness: 1, 
            // opacity: 0.2,
            opacity: 0.5,
            transparent: true,
        } );
        const ground = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000, 1, 1 ), groundMaterial );
		// ground.rotation.x = - Math.PI / 2;
        ground.position.z = 0
        // ground.castShadow = true;
		ground.receiveShadow = true;

		this.scene.add( ground );
    }

    setLight() {
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // 环境光

        const light = new THREE.DirectionalLight( 0xffffff, 0.5 ); // 平行光
		light.position.set( 20, -50, 20 );

		light.castShadow = true;
		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;


        // 半球光
        let hemiLight = new THREE.HemisphereLight('#80edff','#75baff', 0.3)
        // 这个也是默认位置
        hemiLight.position.set(20, -50, 0)
        this.scene.add(hemiLight)

        const pointLight = new THREE.PointLight(0xffffff, 0.5)
        pointLight.position.set( 20, -50, 50 );

		pointLight.castShadow = true;
		pointLight.shadow.mapSize.width = 1024;
		pointLight.shadow.mapSize.height = 1024;


        const pointLight2 = new THREE.PointLight(0xffffff, 0.5)
        pointLight2.position.set( 50, -50, 20 );
        pointLight2.castShadow = true;
        pointLight2.shadow.mapSize.width = 1024;
		pointLight2.shadow.mapSize.height = 1024;

        const pointLight3 = new THREE.PointLight(0xffffff, 0.5)
        pointLight3.position.set( -50, -50, 20 );
        pointLight3.castShadow = true;
        pointLight3.shadow.mapSize.width = 1024;
		pointLight3.shadow.mapSize.height = 1024;

        this.scene.add(ambientLight);
        this.scene.add(light);
        this.scene.add(pointLight);
        this.scene.add(pointLight2);
        this.scene.add(pointLight3);
        
    }

    setController() {
        this.controller = new OrbitControls(this.camera, this.renderer.domElement);
		this.controller.update();
        /* this.controller.enablePan = false; // 禁止右键拖拽

        this.controller.enableZoom = true; // false-禁止右键缩放
        
        this.controller.maxDistance = 200; // 最大缩放 适用于 PerspectiveCamera
        this.controller.minDistance = 50; // 最大缩放

        this.controller.enableRotate = true; // false-禁止旋转 */

        /* this.controller.minZoom = 0.5; // 最小缩放 适用于OrthographicCamera
        this.controller.maxZoom = 2; // 最大缩放 */

    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (this.raycaster) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
    
            // calculate objects intersecting the picking ray
            var intersects = this.raycaster.intersectObjects(this.scene.children, true);
            if (this.activeInstersect && this.activeInstersect.length > 0) { // 将上一次选中的恢复颜色
                this.activeInstersect.forEach(element => {
                    const { object } = element
                    const { _color, material } = object
                    material[0].color.set(_color);
                    material[1].color.set(_color);
                });
            }
    
            this.activeInstersect = []; // 设置为空
            // console.log('select', intersects)
            for (var i = 0; i < intersects.length; i++) {
                // debugger;
                if (intersects[i].object.material && intersects[i].object.material.length === 2) {
                    this.activeInstersect.push(intersects[i]);
                    intersects[i].object.material[0].color.set(HIGHT_COLOR);
                    intersects[i].object.material[1].color.set(HIGHT_COLOR);
                    break; // 只取第一个
                }
            }
        }
        this.createProvinceInfo();
        this.camera.updateMatrixWorld();
		this.csm.update();
		this.controller.update();
        // csmHelper.update();
        if (!this.renderer) {
            this.renderer = new THREE.WebGLRenderer( { antialias: true,alpha: true} );
        }
        this.renderer.render(this.scene, this.camera);
        TWEEN.update()
    }

    createProvinceInfo() { // 显示省份的信息      
        if (this.activeInstersect.length !== 0 && this.activeInstersect[0].object.parent.properties.name) {
            var properties = this.activeInstersect[0].object.parent.properties;

            this.provinceInfo.textContent = properties.name;

            this.provinceInfo.style.visibility = 'visible';
        } else {
            this.provinceInfo.style.visibility = 'hidden';
        }
    }

    // 丢失 context
    destroyed() {
        if (this.renderer) {
            this.renderer.forceContextLoss()
            this.renderer.dispose()
            this.renderer.domElement = null
            this.renderer = null   
        }
        window.removeEventListener('resize', this.resizeEventHandle)
    }
}