import * as THREE from './three'
import GLTFLoader from './GLTFLoader'

export default class JMAr {
  constructor(canvas) {
    this.canvas = canvas
    this.isInited = false;
    this.deviceInfo = wx.getSystemInfoSync();
    this.app = getApp();

    this.group = new THREE.Group();
    this.cameraGroup = new THREE.Group();
 
    this.setObjectQuaternion = function() {
      var zee = new THREE.Vector3(0, 0, 1);
      var euler = new THREE.Euler();
      var q0 = new THREE.Quaternion();
      var q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis
      return function(quaternion, alpha, beta, gamma, orient) {
        euler.set(beta, alpha, -gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us
        quaternion.setFromEuler(euler); // orient the device
        // quaternion.multiply(q1); // camera looks out the back of the device, not the top
        quaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // adjust for screen orientation
      };
    }();
  }

  isIos() {
    return this.deviceInfo.platform == "ios"
  }

  initCamera() {
    return new Promise(function(r, j) {
      const context = wx.createCameraContext()
      this.listener = context.onCameraFrame((_frame) => {

        if (!this.isInited) {
          this.initMesh(_frame);
          this.isInited = true
          this.meshFrame.scale.x = Math.min(_frame.width, _frame.height) / Math.max(_frame.width, _frame.height)
        }
        this.render(_frame);
      })
      this.listener.start({
        success: function() {
          r(true)
        },
        fail: function() {
          j(arguments)
        },
        complete: function() {},
      })
    }.bind(this))

  }

  animate() {
    this.requestAnimationFrame(this.animate);
    this.render();
  }


  render(frame) {
    if (frame) {
      if (this.isIos()) {
        this.frameTexture.image.data = new Uint8Array(frame.data);
      } else {
        this.frameTexture.image = frame;
      }

      this.frameTexture.needsUpdate = true;

      /*
      this.torus.rotation.z += 0.1 * Math.PI
      this.cube.rotation.z += 0.01 * Math.PI

      if (this.gltf)
        this.gltf.rotation.y += 0.01 * Math.PI
      */  
    }


    this.renderer.render(this.scene, this.camera);
  }

  geneTextureByFrame(frame) {
    var data = new Uint8Array(frame.data);
    var texture = new THREE.DataTexture(data, frame.width, frame.height, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }

  initMesh(frame) {

    this.camera = new THREE.PerspectiveCamera(45, this.canvas.width / this.canvas.height, 1, 10000);
    this.camera.position.z = 10;
    
    this.scene = new THREE.Scene();
    this.scene.add(this.group);
    this.scene.add(this.cameraGroup);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: true
    });
    if (this.isIos()) {
      this.frameTexture = this.geneTextureByFrame(frame);
    } else {
      this.frameTexture = new THREE.DataTexture();
    }

    this.frameTexture.flipY = true;
    var material = new THREE.MeshBasicMaterial({
      /*color:0xff0000,*/
      map: this.frameTexture,
      side: THREE.DoubleSide
    });
    let plane = new THREE.PlaneGeometry(10, 10, 1, 1);
    this.meshFrame = new THREE.Mesh(plane, material);
    // mesh.scale.y = mesh.scale.x = mesh.scale.z = 0.5;
    this.meshFrame.position.z = -10;
    this.cameraGroup.add(this.meshFrame);
    this.cameraGroup.position.z = 10;
  //  this.cameraGroup.visible = false;

    //this.group.position.z = -5;
    this.group.position.z = 0;

    let torusGeo = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16)
    let torusMat = new THREE.MeshNormalMaterial()
    this.torus = new THREE.Mesh(torusGeo, torusMat)
    this.torus.position.y = 0.5
    this.torus.position.x = 1
    this.group.add(this.torus)

    let axesHelper = new THREE.AxesHelper(1)
    this.scene.add(axesHelper)

    let cubeGeo = new THREE.CubeGeometry(1, 1, 1)
    let cubeMat = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    this.cube = new THREE.Mesh(cubeGeo, cubeMat)
    this.cube.position.y = cubeGeo.parameters.height / 2
    this.cube.position.x = cubeGeo.parameters.width * -1
    this.group.add(this.cube)

    var ambient = new THREE.AmbientLight(0x222222);
    this.group.add(ambient);
    var directionalLight = new THREE.DirectionalLight(0xdddddd, 4);
    directionalLight.position.set(0, 0, 1).normalize();
    this.group.add(directionalLight);

    var spot1 = new THREE.SpotLight(0xffffff, 1);
    spot1.position.set(10, 20, 10);
    spot1.angle = 0.25;
    spot1.penumbra = 0.75;

    this.group.add(spot1);

    

    //this.camera.lookAt(new THREE.Vector3(0,0,-10));
    console.log(this.camera.quaternion);
  }

  init() {
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
    var app = getApp();
    app.canvas = this.canvas;

    wx.startDeviceMotionListening({
       interval: "game"
     });
     //wx.onDeviceMotionChange(this.onDeviceMotionChange.bind(this))

    wx.startAccelerometer();
    wx.onAccelerometerChange(this.onAccelerometerChange.bind(this));
    return this.initCamera()
  }



  onAccelerometerChange(res) {
    const now = Date.now();

    // 500ms检测一次
    if (now - this.lastTime < 500) {
      return;
    }
    this.lastTime = now;

    let nowState;

    // 57.3 = 180 / Math.PI
    const Roll = Math.atan2(-res.x, Math.sqrt(res.y * res.y + res.z * res.z)) * 57.3;
    const Pitch = Math.atan2(res.y, res.z) * 57.3;

    // console.log('Roll: ' + Roll, 'Pitch: ' + Pitch)

    // 横屏状态
    if (Roll > 50) {
      if ((Pitch > -180 && Pitch < -60) || (Pitch > 130)) {
        nowState = 1;
      } else {
        nowState = this.lastState;
      }

    } else if ((Roll > 0 && Roll < 30) || (Roll < 0 && Roll > -30)) {
      let absPitch = Math.abs(Pitch);

      // 如果手机平躺，保持原状态不变，40容错率
      if ((absPitch > 140 || absPitch < 40)) {
        nowState = this.lastState;
      } else if (Pitch < 0) { /*收集竖向正立的情况*/
        nowState = 0;
      } else {
        nowState = this.lastState;
      }
    } else {
      nowState = this.lastState;
    }

    // 状态变化时，触发
    if (nowState !== this.lastState) {
      this.lastState = nowState;
      if (nowState === 1) {
       // console.log('change:横屏');
      //  this.group.rotation.z = Math.PI / -2
      } else {
       // console.log('change:竖屏');
       // this.group.rotation.z = 0
      }
    }
  }


  onDeviceMotionChange(device) {
   
   
    // console.log(event);
    //alpha //饶人手机左右摆动 
    //当 手机坐标 X/Y 和 地球 X/Y 重合时，绕着 Z 轴转动的夹角为 alpha，范围值为 [0, 2*PI)。逆时针转动为正。

    //beta //饶人手机上下翻转
    //当手机坐标 Y/Z 和地球 Y/Z 重合时，绕着 X 轴转动的夹角为 beta。范围值为 [-1*PI, PI) 。顶部朝着地球表面转动为正。也有可能朝着用户为正。

    //gamma //手机自身翻转
    //当手机 X/Z 和地球 X/Z 重合时，绕着 Y 轴转动的夹角为 gamma。范围值为 [-1*PI/2, PI/2)。右边朝着地球表面转动为正。
    if (!this.camera) return;

    var alpha = device.alpha ? -1*THREE.Math.degToRad(device.alpha ) : 0; // Z
    var beta = THREE.Math.degToRad(0);//THREE.Math.degToRad(-90);//0;//device.beta ? THREE.Math.degToRad(device.beta - 90)  : 0; // X'
    var gamma = 0;//device.gamma ? THREE.Math.degToRad(device.gamma) : 0; // Y''
    var orient = 0; // O
    this.setObjectQuaternion(this.camera.quaternion, alpha, beta, gamma, orient);
    this.cameraGroup.quaternion.copy(this.camera.quaternion);



    if(!this.hasInitQua) {
      this.hasInitQua = true;
      
      var vectorEuler = new THREE.Euler(0, 0, 0, "XYZ");
      vectorEuler.setFromQuaternion(this.camera.quaternion.clone().normalize(), "XYZ");


      var vector = vectorEuler.toVector3();
      vector = vector.normalize();

      console.log(device.alpha, device.beta, device.gamma, vector.x, vector.y, vector.z)

     // this.group.translateOnAxis(vector.normalize(),10);
    }

  
/*
    if (this.gltf)
      this.setObjectQuaternion(this.gltf.quaternion, alpha, beta, gamma, orient);
*/
  }

  loadGltf(url) {
    this.app.log("开始加载：" + url);
    return new Promise(function(r, j) {
      var loader = new GLTFLoader();
      this.app.log("开始加载 111：" + url);
      loader.load(url, function(data) {
        this.gltf = data.scene;
        this.gltf.scale.set(100, 100, 100);
        // this.gltf.lookAt(0,0,1);

        this.group.add(this.gltf)
        r(true)
      }.bind(this), function(e) {
        this.app.log("进度：" + JSON.stringify(e));
      }, function(e) {
        j(e)
      })
    }.bind(this))

  }

  unInit() {
    wx.startAccelerometer()
    wx.stopDeviceMotionListening();
    this.listener.stop()
  }

}