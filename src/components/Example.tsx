import { useRef, useEffect } from "react";
import { Renderer, Camera, Orbit, Vec3, Geometry, Mesh, Program, Texture, Transform } from "../ogl";
import { data } from "./ExampleData";
import textureImg from '../images/macaw.jpeg';

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec3 position;
  attribute vec3 normal;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform mat3 normalMatrix;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform sampler2D tMap;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 tex = texture2D(tMap, vUv).rgb;
    vec3 light = normalize(vec3(0.5, 1.0, -0.3));
    float shading = dot(normal, light) * 0.15;
    gl_FragColor.rgb = tex + shading;
    gl_FragColor.a = 1.0;
  }
`;

const Example: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sceneRef.current) {
      const ref = sceneRef.current;
      let width = ref.clientWidth;
      let height = ref.clientHeight;
      let frameId: number | null;

      const renderer = new Renderer({ dpr: 1.2, alpha: true });
      const gl: WebGL2RenderingContext = renderer.gl as unknown as WebGL2RenderingContext;
      // @ts-ignore
      const camera = new Camera(gl, { fov: 45 });
      camera.position.set(0, 1, 3);
      const controls = new Orbit(camera, {
        target: new Vec3(0, 0.7, 0),
        zoomStyle: "FOV",
      });

      gl.clearColor(0, 0, 0, 0);
      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });

      const scene = new Transform();
      const texture = new Texture(gl);
      const img = new Image();
      img.onload = () => (texture.image = img);
      img.src = textureImg;

      const program = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
              tMap: { value: texture },
          },
          cullFace: null,
      });

      const geometry = new Geometry(gl, {
          position: { size: 3, data: new Float32Array(data.position) },
          uv: { size: 2, data: new Float32Array(data.uv) },
          normal: { size: 3, data: new Float32Array(data.normal) },
      });

      let mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);

      const handleResize = () => {
        width = ref.clientWidth;
        height = ref.clientHeight;
        renderer.setSize(width, height);
        camera.perspective({ aspect: width / height });
      };

      const animate = (t: number) => {
        frameId = window.requestAnimationFrame(animate);
        controls.update();
        // @ts-ignore
        renderer.render({ scene, camera });
      };

      const start = () => {
        if (!frameId) {
          frameId = requestAnimationFrame(animate);
        }
      };

      const stop = () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
      };

      ref.appendChild(gl.canvas as Node);
      window.addEventListener("resize", handleResize);
      start();

      return () => {
        stop();
        window.removeEventListener("resize", handleResize);
        ref.removeChild(gl.canvas as Node);
      };
    }
  }, []);

  return <div ref={sceneRef} className="scene" />;
};

export default Example;
