import JMAr from '../../libs/jmar'

let arCom

Page({
  data:{
    logs: [
    ]
  },
  log(text) {
    var logs = this.data.logs;
    logs.push(text);
    this.setData({
      logs
    })
  },

  onReady() {
    let app = getApp();
    app.log = this.log;


    const query = wx.createSelectorQuery()
    query.select('#webgl').node().exec((res) => {
      let canvas = res[0].node
     arCom = new JMAr(canvas)

      arCom.init().then(function(e) {
        app.log("init over");
        arCom.loadGltf("http://192.168.20.170:8080/ar-model/glTF/BoomBox.gltf").then(function(e){
            wx.showModal({
              title: '',
              content: '模型加载成功',
            })
            
        }).catch(function(e) {
          wx.showModal({
            title: '模型加载失败',
            content: JSON.stringify(e),
          })
        })
      })
    })
  },
  add(){
    arCom.meshFrame.position.z += 1;
  },
  des(){
    arCom.meshFrame.position.z -= 1;
  },
  onLoad() {
    wx.setNavigationBarTitle({
      title: '小程序AR测试'
    })
  },
  onUnload() {
    if (arCom)
      arCom.unInit()
  }
})