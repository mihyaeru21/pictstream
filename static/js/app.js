function r () {
  return (Math.random() - 0.5) * 100;
}

function main () {
  var scene = new THREE.Scene();

  var width = window.innerWidth;
  var height = window.innerHeight;
  var fov    = 60;
  var aspect = width / height;
  var near   = 1;
  var far    = 1000;
  var camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
  camera.position.set( 0, 0, 50 );

  var renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(new THREE.Color(0xffffff));
  renderer.setSize( width, height );
  document.body.appendChild( renderer.domElement );

  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 0, 0.7, 0.7 );
  scene.add( directionalLight );


  var meshes = [];
  var tweens = [];
  var geometry = new THREE.BoxGeometry( 5, 5, 0.5 );
  for (var i = 0; i < 50; i++) {
    var material = new THREE.MeshPhongMaterial({
      map: THREE.ImageUtils.loadTexture('static/img/img' + Math.floor(Math.random()*30+1) + '.jpg', {}, function() {renderer.render(scene, camera);})
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = (i % 2 == 0) ? 100 : -100;
    mesh.position.y = (i % 2 != 0) ? 100 : -100;
    scene.add(mesh);
    meshes.push(mesh);

    // 回転速度
    mesh.rotation_d_y = (Math.random() - 0.5) / 20;
    mesh.rotation_d_z = (Math.random() - 0.5) / 20;

    var initial_position = { x: mesh.position.x, y: mesh.position.y };

    // 移動周り
    var tween = new TWEEN.Tween( mesh.position )
      .to( { x: [r(), r(), r()], y: [r(), r(), r()] }, 4000 )
      .easing(TWEEN.Easing.Quartic.InOut)
      .interpolation(TWEEN.Interpolation.CatmullRom)
      .delay(500 * i)
      .onUpdate( function() {
        mesh.position.x = this.x;
        mesh.position.y = this.y;
      });
    tweens.push(tween);
  }

  tweens.forEach( function (tween, index, ar) {
    tween.start();
  });


  function renderLoop () {
    requestAnimationFrame( renderLoop );
    meshes.forEach( function (mesh, index, ar) {
      mesh.rotation.set(
        0,
        mesh.rotation.y + mesh.rotation_d_y,
        mesh.rotation.z + mesh.rotation_d_z
        );
    });
    TWEEN.update();
    renderer.render( scene, camera );
  };
  renderLoop();

};

main();

$(document).ready(function(){
  var socket = io.connect('http://' + document.domain + ':' + location.port + '/stream');
  socket.on('my response', function(message) {
    console.log(message.image_url + ' : ' + message.tweet_url);
  });
});
