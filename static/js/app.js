function main() {
  function r() {
    return (Math.random() - 0.5) * 100;
  }

  function create_mesh(geometry, material) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = (Math.random() > 0.5) ? 100 : -100;
    mesh.position.y = (Math.random() > 0.5) ? 100 : -100;

    // 回転速度
    mesh.rotation_d_y = (Math.random() - 0.5) / 20;
    mesh.rotation_d_z = (Math.random() - 0.5) / 20;

    // 初期座標
    mesh.initial_x = mesh.position.x;
    mesh.initial_y = mesh.position.y;

    return mesh;
  }

  function create_tween(mesh) {
    var enter = new TWEEN.Tween( mesh.position )
      .to( { x: [r(), r(), r()], y: [r(), r(), r()] }, 4000 )
      .easing(TWEEN.Easing.Quartic.InOut)
      .interpolation(TWEEN.Interpolation.CatmullRom)
      .onUpdate( function() {
        mesh.position.x = this.x;
        mesh.position.y = this.y;
      });
    var exit = new TWEEN.Tween( mesh.position )
      .to( { x: [r(), r(), mesh.initial_x], y: [r(), r(), mesh.initial_y] }, 4000 )
      .easing(TWEEN.Easing.Quartic.InOut)
      .interpolation(TWEEN.Interpolation.CatmullRom)
      .delay(10000)
      .onUpdate( function() {
        mesh.position.x = this.x;
        mesh.position.y = this.y;
      })
      .onComplete( function() {
        mesh.parent.remove(mesh);
      });

    enter.chain(exit);
    return enter;
  }

  function add_mesh_to_scene(image_url, scene) {
    var geometry = new THREE.BoxGeometry( 5, 5, 0.5 );

    var texture = THREE.ImageUtils.loadTexture(image_url);
    var face = new THREE.MeshPhongMaterial( {map: texture} );
    var edge = new THREE.MeshPhongMaterial( { color: 0x3e3e3e } );
    var material = new THREE.MeshFaceMaterial([edge, edge, edge, edge, face, face]);

    var mesh = create_mesh(geometry, material);
    scene.add(mesh);

    var tween = create_tween(mesh);
    tween.start();
  }

  var scene = new THREE.Scene();

  var width = window.innerWidth;
  var height = window.innerHeight;
  var fov    = 60;
  var aspect = width / height;
  var near   = 1;
  var far    = 1000;
  var camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
  camera.position.set( 0, 0, 50 );

  var renderer;
  if (window.WebGLRenderingContext) {
    renderer = new THREE.WebGLRenderer();
  } else {
    renderer = new THREE.CanvasRenderer();
  }
  renderer.setClearColor(new THREE.Color(0xe8e8e8));
  renderer.setSize( width, height );
  document.body.appendChild( renderer.domElement );

  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 0, 0.7, 0.7 );
  scene.add( directionalLight );

  function renderLoop () {
    requestAnimationFrame( renderLoop );
    scene.children.forEach( function (child, index, arr) {
      if (! child instanceof THREE.Mesh) return;
      child.rotation.set(
        0,
        child.rotation.y + child.rotation_d_y,
        child.rotation.z + child.rotation_d_z
        );
    });
    TWEEN.update();
    renderer.render( scene, camera );
  };
  renderLoop();

  // 鯖と繋ぐあれ
  $(document).ready(function(){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/stream');
    socket.on('my response', function(message) {
      // console.log(message.image_url + ' : ' + message.tweet_url);
      add_mesh_to_scene(message.image_url, scene);
    });
  });
}

main();

